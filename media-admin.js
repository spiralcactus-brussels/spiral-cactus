/* SpiralCactus private media manager. Browser-based ZIP extraction and photo optimization. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const status = (message, error=false) => { $("status").textContent=message; $("status").dataset.error=String(error); };
  let selected=[], ready=false, processing=false;
  const allowed = {
    jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",
    avif:"image/avif",heic:"image/heic",heif:"image/heif",
    mp4:"video/mp4",m4v:"video/mp4",webm:"video/webm",mov:"video/quicktime"
  };
  function basename(name){return String(name||"").split(/[\\/]/).pop()}
  const ext = name => (basename(name).split(".").pop()||"").toLowerCase();
  function apiBase(){
    return ($("api-base").value||"").trim().replace(/\/+$/,"");
  }
  function checkBase(){
    let u;try{u=new URL(apiBase())}catch{throw Error("Adresse Cloudflare invalide.")}
    if(u.protocol!=="https:"||u.username||u.password||u.pathname!=="/"||u.search||u.hash)
      throw Error("L'adresse doit être une URL HTTPS simple.");
    return u.origin;
  }
  function credentials(){
    const token=$("admin-token").value.trim();
    if(token.length<12)throw Error("Saisissez le mot de passe d'administration Cloudflare.");
    return {"Authorization":"Bearer "+token};
  }
  async function jsonRequest(method,path,payload){
    const headers={...credentials()};
    if(payload!==undefined)headers["Content-Type"]="application/json";
    const response=await fetch(checkBase()+path,{
      method,headers,body:payload===undefined?undefined:JSON.stringify(payload),cache:"no-store"
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||("HTTP "+response.status));
    return data;
  }
  async function connect(){
    try {
      await jsonRequest("GET","/api/auth");
      ready=true;localStorage.setItem("sc-media-api",checkBase());
      $("connection-status").textContent="✓ Connecté à Cloudflare";
      $("connection-status").style.color="#b7ff22";
      $("upload").disabled=selected.length===0;
      status("Connexion vérifiée. Choisissez un événement et vos fichiers.");
      refreshAlbum();
    }catch(e){
      ready=false;$("upload").disabled=true;
      $("connection-status").textContent="Connexion impossible";
      $("connection-status").style.color="#ff9b92";
      status(e.message,true);
    }
  }
  const currentAPI=(window.SC_MEDIA_CONFIG?.apiBase||"").trim();
  $("api-base").value=currentAPI||localStorage.getItem("sc-media-api")||"";
  $("connect").addEventListener("click",connect);
  fetch("content/events.json",{cache:"no-cache"}).then(r=>r.json()).then(events=>{
    $("album").replaceChildren();
    for(const event of events.sort((a,b)=>String(b.date).localeCompare(String(a.date)))){
      if(!event.gallery)continue;
      const opt=document.createElement("option");
      opt.value=event.gallery;
      opt.textContent=(event.name?.fr||event.name?.en||event.id)+" · "+event.date;
      $("album").append(opt);
    }
    $("album").value=events.find(e=>e.id==="acid-edition")?.gallery||$("album").value;
    updateGalleryLink();
  }).catch(()=>status("Impossible de charger la liste des événements.",true));
  const updateGalleryLink=()=>{
    $("open-gallery").href="gallery.html?event="+encodeURIComponent($("album").value);
  };
  $("album").addEventListener("change",()=>{updateGalleryLink(); if(ready)refreshAlbum();});
  function updateSelection(files){
    selected=[...files];
    $("files-list").replaceChildren();
    for(const file of selected){
      const li=document.createElement("li");
      li.textContent=basename(file.name)+" · "+(file.size/1048576).toFixed(1)+" Mo";
      $("files-list").append(li);
    }
    $("upload").disabled=!ready||selected.length===0||processing;
    status(selected.length?selected.length+" fichier(s) sélectionné(s). Prêt pour la publication.":"");
  }
  $("media-files").addEventListener("change",e=>updateSelection(e.target.files));
  const dz=$("dropzone");
  for(const eventName of ["dragenter","dragover"]){
    dz.addEventListener(eventName,e=>{e.preventDefault();dz.classList.add("over")});
  }
  for(const eventName of ["dragleave","drop"]){
    dz.addEventListener(eventName,e=>{e.preventDefault();dz.classList.remove("over")});
  }
  dz.addEventListener("drop",e=>{if(e.dataTransfer?.files?.length)updateSelection(e.dataTransfer.files)});
  dz.addEventListener("click",()=>$("media-files").click());
  function mime(file){
    return allowed[ext(file.name)]||null;
  }
  async function optimizePhoto(file){
    let bitmap;
    try{bitmap=await createImageBitmap(file)}catch{throw Error("Format photo non lisible ("+ext(file.name)+"). Exportez en JPEG.")}
    try{
      const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));
      const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
      const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d",{alpha:false});
      if(!ctx)throw Error("Impossible d'ouvrir l'optimiseur d'image");
      ctx.fillStyle="#08090c";ctx.fillRect(0,0,w,h);
      ctx.drawImage(bitmap,0,0,w,h);
      let result=null;
      for(const q of [.83,.75,.66]){
        result=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",q));
        if(result&&result.size<2*1048576)break;
      }
      if(!result)throw Error("Impossible de convertir la photographie.");
      const actualType=result.type==="image/webp"?"image/webp":"image/jpeg";
      if(actualType==="image/jpeg")result=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.8));
      if(!result)throw Error("Compression indisponible.");
      const name=basename(file.name).replace(/\.[^.]+$/,"")+"."+(actualType==="image/webp"?"webp":"jpg");
      return new File([result],name,{type:actualType});
    }finally{bitmap.close()}
  }
  async function uploadPart(url,bytes){
    for(let attempt=0;attempt<3;attempt++){
      try{
        const response=await fetch(checkBase()+url,{
          method:"PUT",headers:{...credentials(),"Content-Type":"application/octet-stream"},
          body:bytes,cache:"no-store"
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw Error(data.error||("HTTP "+response.status));
        return data;
      }catch(e){
        if(attempt===2)throw e;
        await new Promise(resolve=>setTimeout(resolve,800*(attempt+1)));
      }
    }
  }
  async function uploadBinary(target,note,variant="preview",originalKey="",displayName=""){
    const type=mime(target);
    if(!type)throw Error("Format non pris en charge : "+basename(target.name));
    const info=await jsonRequest("POST","/api/upload/start",{
      album:$("album").value,name:target.name,type,
      size:target.size,variant,originalKey,displayName:displayName||target.name
    });
    const partSize=8*1024*1024,parts=[];
    try{
      for(let start=0,i=1;start<target.size;start+=partSize,i++){
        const end=Math.min(start+partSize,target.size);
        status("Envoi "+note+" : "+Math.round(100*end/target.size)+"% ("+(target.size/1048576).toFixed(1)+" Mo)");
        const part=await uploadPart("/api/upload/part?key="+encodeURIComponent(info.key)+
          "&uploadId="+encodeURIComponent(info.uploadId)+"&part="+i,target.slice(start,end));
        parts.push(part);
      }
      return await jsonRequest("POST","/api/upload/finish",{key:info.key,uploadId:info.uploadId,parts});
    }catch(e){
      await jsonRequest("POST","/api/upload/cancel",{key:info.key,uploadId:info.uploadId}).catch(()=>{});
      throw e;
    }
  }
  async function uploadOne(file,note){
    const type=mime(file);
    if(!type)throw Error("Format non pris en charge : "+basename(file.name));
    if(!type.startsWith("image/")){
      const video = new File([file],file.name,{type});
      await uploadBinary(video,"vidéo originale : "+note,"preview","",""+file.name);
      return;
    }
    // Create the small gallery rendition locally, but retain every pixel of the HD original.
    const preview=await optimizePhoto(file);
    if(!["image/webp","image/jpeg"].includes(preview.type))
      throw Error("Impossible d'optimiser la photo "+file.name);
    const original = new File([file],file.name,{type});
    status("Préparation de la photo HD : "+note);
    const uploadedOriginal=await uploadBinary(original,"original HD : "+note,"original","",file.name);
    try{
      await uploadBinary(preview,"aperçu optimisé : "+note,"preview",uploadedOriginal.key,file.name);
    }catch(e){
      // Avoid charging for an invisible original if its preview upload fails.
      try{
        await jsonRequest("DELETE","/api/media?key="+encodeURIComponent(uploadedOriginal.key));
      }catch(cleanup){
        console.warn("Could not remove orphan original",cleanup);
      }
      throw e;
    }
  }

  async function expandZip(file,submit){
    if(!window.zip?.ZipReader)throw Error("La bibliothèque ZIP ne s'est pas chargée. Rechargez cette page.");
    const reader=new zip.ZipReader(new zip.BlobReader(file));
    let good=0,failed=0;
    try{
      const entries=await reader.getEntries();
      const photos=entries.filter(e=>!e.directory && !e.filename.includes("__MACOSX/")
        && allowed[ext(e.filename)]);
      if(!photos.length)throw Error("Le ZIP ne contient aucune photo ou vidéo compatible.");
      if(photos.length>2000)throw Error("ZIP trop volumineux : partagez les photos en plusieurs ZIP.");
      for(let i=0;i<photos.length;i++){
        const entry=photos[i],name=basename(entry.filename);
        if(entry.uncompressedSize>200*1048576){
          failed++;status(name+" : vidéo ZIP trop grosse. Envoyez-la directement hors du ZIP.",true);continue;
        }
        try{
          status("Extraction "+(i+1)+"/"+photos.length+" : "+name);
          const blob=await entry.getData(new zip.BlobWriter());
          const item=new File([blob],name,{type:allowed[ext(name)]});
          await submit(item,"ZIP "+(i+1)+"/"+photos.length+" : "+name);
          good++;
        }catch(e){failed++;status("Erreur "+name+" : "+e.message,true)}
      }
    }finally{await reader.close()}
    return {good,failed};
  }
  $("upload").addEventListener("click",async()=>{
    if(!ready||processing)return;
    if(!$("album").value){status("Choisissez d'abord un événement.",true);return}
    processing=true;$("upload").disabled=true;$("connect").disabled=true;
    $("progress").classList.remove("hidden");
    let done=0,fail=0;
    try {
      for(let index=0;index<selected.length;index++){
        const file=selected[index];
        try{
          if(ext(file.name)==="zip"){
            const z=await expandZip(file,uploadOne);
            done+=z.good;fail+=z.failed;
          }else{await uploadOne(file,basename(file.name));done++}
        }catch(e){
          fail++;status("Erreur sur "+basename(file.name)+" : "+e.message,true);
        }
        $("progress").value=(index+1)*100/selected.length;
      }
      status("Publication terminée : "+done+" média(s) publié(s), "+fail+" échec(s)."+
        (done?" Les médias sont consultables dans la galerie de l'événement.":""),
        fail>0);
    }finally{
      processing=false;$("upload").disabled=selected.length===0;$("connect").disabled=false;
      if(done)refreshAlbum();
    }
  });
  async function refreshAlbum(){
    const box=$("media-grid");box.replaceChildren();
    if(!checkReady())return;
    try{
      let cursor=null,entries=[];
      do{
        const url=new URL(checkBase()+"/api/gallery");url.searchParams.set("event",$("album").value);
        if(cursor)url.searchParams.set("cursor",cursor);
        const response=await fetch(url.href,{cache:"no-store"});
        if(!response.ok)throw Error("HTTP "+response.status);
        const page=await response.json();entries.push(...(page.items||[]));
        cursor=page.nextCursor;
      }while(cursor && entries.length<20000);
      if(!entries.length){box.textContent="Cet album est encore vide.";return}
      for(const item of entries){
        const div=document.createElement("div");div.className="media-tile";
        if(item.type==="photo"){
          const img=document.createElement("img");img.src=item.url;img.loading="lazy";img.alt=item.name||"Photo de soirée";div.append(img);
        }else{
          const video=document.createElement("video");video.src=item.url;video.preload="none";video.controls=true;div.append(video);
        }
        const caption=document.createElement("small");caption.textContent=item.name;div.append(caption);
        if(item.downloadUrl){
          const down=document.createElement("a");
          down.className="link secondary";
          down.textContent=item.hasOriginal?"↓ Télécharger HD":"↓ Télécharger";
          down.href=item.downloadUrl;down.target="_blank";down.rel="noopener noreferrer";
          down.style.cssText="font-size:12px;padding:7px 9px;margin:0 4px 8px 0";
          div.append(down);
        }
        const remove=document.createElement("button");remove.textContent="Supprimer";remove.className="danger";
        remove.addEventListener("click",async()=>{
          if(!confirm("Supprimer définitivement "+item.name+" ?"))return;
          try{
            await jsonRequest("DELETE","/api/media?key="+encodeURIComponent(item.key));
            div.remove();
          }catch(e){status(e.message,true)}
        });div.append(remove);box.append(div);
      }
    }catch(e){box.textContent="Impossible de charger l'album : "+e.message}
  }
  function checkReady(){return ready && !!$("album").value}
  $("refresh").addEventListener("click",refreshAlbum);
})();
