/* SpiralCactus Admin — phase 1: secure gallery publishing, no hard-coded secrets. */
(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const el={
 setup:byId('setup'),auth:byId('auth'),workspace:byId('workspace'),form:byId('loginForm'),
 email:byId('loginEmail'),password:byId('loginPassword'),loginError:byId('loginError'),
 loginButton:byId('loginButton'),userEmail:byId('userEmail'),logout:byId('logout'),
 eventSelect:byId('eventSelect'),input:byId('photoInput'),drop:byId('dropzone'),
 queue:byId('queue'),count:byId('selectionCount'),clear:byId('clearSelection'),
 upload:byId('uploadBtn'),publish:byId('publishBtn'),message:byId('uploadMessage'),
 grid:byId('existingGrid'),existingCount:byId('existingCount'),refresh:byId('refreshPhotos')
};
const cfg=window.SC_BACKEND||{};
const readyConfig=/^https:\/\/[\w-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'')
  &&typeof cfg.supabaseAnonKey==='string'&&cfg.supabaseAnonKey.length>20;
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const errorString=e=>String(e?.message||e||'Unknown error');
const bytes=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
const photos=[]; // Chosen local files with progress and saved Supabase draft ID.
let db=null,user=null,busy=false,remote=[];
function message(text,bad=false){el.message.textContent=text;el.message.classList.toggle('error',bad);}
function loginError(text){el.loginError.hidden=!text;el.loginError.textContent=text;}
function show(which){for(const k of ['setup','auth','workspace'])el[k].hidden=k!==which;}
function updateControls(){
 const selected=photos.filter(p=>p.status==='ready');
 el.count.textContent=photos.length+' photo'+(photos.length===1?'':'s')+' selected';
 el.clear.disabled=busy||!photos.length;
 el.upload.disabled=busy||!selected.length||!el.eventSelect.value;
 el.publish.disabled=busy||!photos.some(p=>p.status==='uploaded');
 el.eventSelect.disabled=busy;
 el.input.disabled=busy;
}
function queueRender(){
 el.queue.innerHTML=photos.map((p,i)=>{
 const stage={ready:'Ready',processing:'Optimizing',uploading:'Uploading',uploaded:'Saved as draft',error:'Failed'}[p.status]||p.status;
 const prog=p.status==='uploaded'?100:p.progress;
 return '<div class="queue-item"><div class="queue-info"><strong title="'+esc(p.file.name)+'">'+esc(p.file.name)+'</strong><small>'+bytes(p.file.size)+' · '+stage+'</small><div class="bar"><span style="width:'+Math.min(100,Math.max(0,prog))+'%"></span></div></div><div class="queue-state'+(p.status==='error'?' error':'')+'">'+(p.status==='error'?'ERROR':esc(p.status==='uploaded'?'DONE':p.status==='ready'?'READY':prog+'%'))+'</div></div>';
 }).join('');
 updateControls();
}
function addFiles(files){
 const unique=new Set(photos.map(p=>p.file.name+'|'+p.file.size+'|'+p.file.lastModified));
 let added=0,skipped=0;
 for(const file of files){
   const key=file.name+'|'+file.size+'|'+file.lastModified;
   if(unique.has(key))continue;
   unique.add(key);
   if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>50*1024*1024){skipped++;continue}
   photos.push({file,status:'ready',progress:0,id:null});
   added++;
 }
 queueRender();
 message(added?added+' file(s) ready to upload. Choose an event and click Upload.':skipped?'Unsupported or oversized image(s) skipped.':'No new files selected.',!!skipped);
}
async function optimize(file){
 // Keep source files on the user's machine; do not permanently alter them.
 let bitmap;
 try{bitmap=await createImageBitmap(file)}catch{throw Error('Browser cannot read '+file.name+'. Convert it to JPG first.')}
 const max=2400,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const cv=document.createElement('canvas');
 cv.width=Math.max(1,Math.round(bitmap.width*scale));
 cv.height=Math.max(1,Math.round(bitmap.height*scale));
 const ctx=cv.getContext('2d',{alpha:false});
 if(!ctx){bitmap.close?.();throw Error('Canvas unavailable')}
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,cv.width,cv.height);
 ctx.drawImage(bitmap,0,0,cv.width,cv.height);
 bitmap.close?.();
 const blob=await new Promise(resolve=>cv.toBlob(resolve,'image/jpeg',.84));
 cv.width=0;cv.height=0;
 if(!blob)throw Error('Could not compress '+file.name);
 if(blob.size>9*1024*1024)throw Error('This image is still too large. Resize before uploading.');
 return {blob,filename:file.name.replace(/\.[^.]+$/,'')+'.jpg'};
}
function xhrUpload(blob,filename,sign,p){
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  xhr.open('POST','https://api.cloudinary.com/v1_1/'+encodeURIComponent(sign.cloudName)+'/image/upload',true);
  xhr.timeout=120000;
  xhr.upload.onprogress=evt=>{
   if(evt.lengthComputable){p.progress=Math.max(3,Math.round(evt.loaded*100/evt.total));queueRender();}
  };
  xhr.onload=()=>{
   let body={};try{body=JSON.parse(xhr.responseText)}catch{}
   if(xhr.status>=200&&xhr.status<300&&body.public_id&&body.secure_url)resolve(body);
   else reject(new Error(body.error?.message||'Cloudinary upload error ('+xhr.status+')'));
  };
  xhr.onerror=()=>reject(new Error('Network error during upload'));
  xhr.ontimeout=()=>reject(new Error('Upload timed out'));
  const form=new FormData();
  form.append('file',blob,filename);
  form.append('api_key',sign.apiKey);
  form.append('timestamp',String(sign.timestamp));
  form.append('folder',sign.folder);
  form.append('signature',sign.signature);
  xhr.send(form);
 });
}
async function uploadOne(p,signature,eventId){
 try{
  p.status='processing';p.progress=1;queueRender();
  const {blob,filename}=await optimize(p.file);
  p.status='uploading';p.progress=3;queueRender();
  const result=await xhrUpload(blob,filename,signature,p);
  // Save as private draft. Public site only reads records with status=published.
  const {data,error}=await db.from('sc_gallery_photos').insert({
   event_id:eventId,image_url:result.secure_url,cloudinary_public_id:result.public_id,
   width:result.width||null,height:result.height||null,bytes:result.bytes||null,
   uploader_id:user.id,status:'draft'
  }).select('id').single();
  if(error)throw new Error('Image uploaded, but database save failed: '+error.message);
  p.id=data.id;p.status='uploaded';p.progress=100;
 }catch(err){p.status='error';p.progress=0;p.issue=errorString(err);}
 queueRender();
}
async function uploadAll(){
 if(busy||!user)return;
 const batch=photos.filter(p=>p.status==='ready'||p.status==='error');
 if(!batch.length||!el.eventSelect.value)return;
 busy=true;updateControls();message('Requesting a secure upload signature…');
 const eventId=el.eventSelect.value;
 try{
  const {data,error}=await db.functions.invoke('sc-cloudinary-sign',{body:{}});
  if(error)throw error;
  if(!data?.signature||!data?.apiKey||!data?.cloudName||!data?.timestamp||!data?.folder)
    throw new Error('Secure upload service is not configured. See the setup guide.');
  message('Uploading '+batch.length+' photographs…');
  let cursor=0;
  const workers=Array.from({length:Math.min(3,batch.length)},async()=>{
   while(cursor<batch.length){
     const p=batch[cursor++];await uploadOne(p,data,eventId);
   }
  });
  await Promise.all(workers);
  const done=batch.filter(p=>p.status==='uploaded').length;
  const errors=batch.filter(p=>p.status==='error');
  message(done+' photo(s) uploaded as private drafts.'+(errors.length?' '+errors.length+' failed: '+errors.slice(0,2).map(p=>p.file.name+' — '+p.issue).join('; '):'')+' Review, then click Publish Uploaded Batch.',!!errors.length);
  await loadExisting();
 }catch(err){message('Upload preparation failed: '+errorString(err),true);}
 finally{busy=false;queueRender();}
}
async function publishIds(ids,target){
 if(!ids.length)return;
 const {error}=await db.from('sc_gallery_photos').update({status:target}).in('id',ids);
 if(error)throw error;
}
async function publishBatch(){
 if(busy)return;
 const batch=photos.filter(p=>p.status==='uploaded'&&p.id).map(p=>p.id);
 if(!batch.length)return;
 busy=true;updateControls();
 try{
   await publishIds(batch,'published');
   photos.splice(0,photos.length,...photos.filter(p=>!batch.includes(p.id)));
   message(batch.length+' photographs published! Your public Gallery will display them after refreshing.');
   await loadExisting();
 }catch(err){message('Unable to publish: '+errorString(err),true);}
 finally{busy=false;queueRender();}
}
async function loadExisting(){
 if(!user||!el.eventSelect.value)return;
 el.grid.innerHTML='<p class="empty-list">Loading gallery…</p>';
 const {data,error}=await db.from('sc_gallery_photos').select('id,image_url,event_id,status,created_at').eq('event_id',el.eventSelect.value).order('created_at',{ascending:false}).limit(300);
 if(error){el.grid.innerHTML='<p class="empty-list">Unable to load album: '+esc(error.message)+'</p>';return;}
 remote=data||[];
 el.existingCount.textContent=remote.length+' PHOTO'+(remote.length===1?'':'S');
 if(!remote.length){el.grid.innerHTML='<p class="empty-list">No photos in this album yet. Upload a batch above to get started.</p>';return}
 el.grid.innerHTML=remote.map(p=>'<div class="image-card"><img src="'+esc(p.image_url)+'" alt="Event photograph" loading="lazy"><small class="photo-badge">'+(p.status==='published'?'PUBLISHED':'PRIVATE DRAFT')+'</small><button type="button" data-record="'+esc(p.id)+'" data-status="'+esc(p.status)+'">'+(p.status==='published'?'UNPUBLISH':'PUBLISH')+'</button></div>').join('');
}
async function loadEvents(){
 const response=await fetch('../content/events.json',{cache:'no-cache'});
 if(!response.ok)throw new Error('Unable to load existing events');
 const events=await response.json();
 if(!Array.isArray(events))throw new Error('Invalid events');
 el.eventSelect.innerHTML='<option value="">Select an event…</option>';
 for(const e of events){
  if(!e.gallery)continue;
  const opt=document.createElement('option');
  opt.value=e.gallery;opt.textContent=(e.name?.en||e.id)+' — '+e.date;
  el.eventSelect.appendChild(opt);
 }
 if(el.eventSelect.options.length>1)el.eventSelect.selectedIndex=1;
 updateControls();
}
async function activate(userRecord){
 user=userRecord;el.userEmail.textContent=userRecord.email||'Administrator';
 const {data:role,error}=await db.from('sc_admins').select('role').eq('user_id',userRecord.id).maybeSingle();
 if(error||!role){
  await db.auth.signOut();user=null;show('auth');loginError('Account exists but is not approved as a SpiralCactus administrator. Ask the project owner to authorize it.');return;
 }
 show('workspace');el.logout.hidden=false;
 try{await loadEvents();await loadExisting()}catch(err){message(errorString(err),true)}
}
async function init(){
 if(!readyConfig){show('setup');return;}
 if(!window.supabase?.createClient){show('setup');return;}
 db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
 const {data:{user:current},error}=await db.auth.getUser();
 if(current&&!error)await activate(current);else show('auth');
}
el.form.addEventListener('submit',async e=>{
 e.preventDefault();loginError('');el.loginButton.disabled=true;
 try{
  const {data,error}=await db.auth.signInWithPassword({email:el.email.value.trim(),password:el.password.value});
  if(error)throw error;
  if(data?.user)await activate(data.user);
 }catch(err){loginError(errorString(err))}
 finally{el.loginButton.disabled=false;}
});
el.logout.addEventListener('click',async()=>{
 if(!db)return;
 await db.auth.signOut();user=null;photos.length=0;el.logout.hidden=true;el.userEmail.textContent='';show('auth');
});
el.input.addEventListener('change',()=>{addFiles([...el.input.files]);el.input.value='';});
el.drop.addEventListener('click',()=>{if(!busy)el.input.click()});
el.drop.addEventListener('dragover',e=>{e.preventDefault();if(!busy)el.drop.classList.add('dragging')});
el.drop.addEventListener('dragleave',()=>el.drop.classList.remove('dragging'));
el.drop.addEventListener('drop',e=>{
 e.preventDefault();el.drop.classList.remove('dragging');
 if(!busy&&e.dataTransfer?.files?.length)addFiles([...e.dataTransfer.files]);
});
el.clear.addEventListener('click',()=>{if(!busy){photos.length=0;queueRender();message('Selection cleared.')}} );
el.upload.addEventListener('click',uploadAll);
el.publish.addEventListener('click',publishBatch);
el.eventSelect.addEventListener('change',()=>{updateControls();loadExisting()});
el.refresh.addEventListener('click',loadExisting);
el.grid.addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-record]');if(!btn||busy)return;
 const next=btn.dataset.status==='published'?'draft':'published';
 btn.disabled=true;
 try{await publishIds([btn.dataset.record],next);message(next==='published'?'Photo published.':'Photo unpublished.');await loadExisting();}
 catch(err){message(errorString(err),true);btn.disabled=false;}
});
queueRender();init();
})();
