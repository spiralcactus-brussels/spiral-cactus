/* SpiralCactus Radio — official SoundCloud embeds, no file hosting, no custom streaming API. */
(()=>{
'use strict';
if(document.body.dataset.page!=='radio')return;
const el=id=>document.getElementById(id);
const frame=el('radio-soundcloud'),queue=el('radio-queue'),status=el('radio-status');
const start=el('radio-start'),next=el('radio-next'),filter=el('radio-filter');
const title=el('radio-current-title'),artist=el('radio-current-artist'),count=el('radio-count');
const container=el('radio-embed-wrap');
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const lang=()=>{let l='en';try{l=localStorage.getItem('sc-lang')||'en'}catch(_){}return ['en','fr','nl'].includes(l)?l:'en'};
const tr=k=>window.SC_TRANSLATIONS?.[lang()]?.[k]||window.SC_TRANSLATIONS?.en?.[k]||k;
const validUrl=link=>{try{const u=new URL(link);return u.protocol==='https:'&&['soundcloud.com','www.soundcloud.com','m.soundcloud.com'].includes(u.hostname)&&!u.username&&!u.password}catch(_){return false}};
const makeSrc=(url,autoplay=false)=>'https://w.soundcloud.com/player/?'+new URLSearchParams({url,color:'#b7ff22',auto_play:String(autoplay),hide_related:'true',show_comments:'false',show_user:'true',show_reposts:'false',show_artwork:'true',visual:'false'}).toString();
let items=[],selected=0,started=false,widget=null,changing=false;
const mark=(key)=>{status.dataset.messageKey=key;status.textContent=tr(key)};
const current=()=>items[selected];
function paint(){
const item=current();if(!item)return;
title.textContent=item.title;
artist.textContent=item.artist.toUpperCase()+' · '+item.genre;
count.textContent=String(items.length).padStart(2,'0')+' / '+tr('radioSetCount');
const visible=items.map((t,i)=>({...t,idx:i})).filter(t=>filter.value==='all'||t.artist===filter.value);
queue.innerHTML=visible.map(t=>'<div class="radio-queue-item'+(t.idx===selected?' active':'')+'"><button class="radio-choose" type="button" data-index="'+t.idx+'" aria-pressed="'+(t.idx===selected)+'"><span class="radio-queue-num">'+String(t.idx+1).padStart(2,'0')+'</span><span class="radio-queue-copy"><strong>'+escapeHtml(t.title)+'</strong><small>'+escapeHtml(t.artist)+' · '+escapeHtml(t.description||t.genre)+'</small></span></button><a class="radio-source" href="'+escapeHtml(t.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+escapeHtml(tr('radioOpenSource')+' — '+t.title)+'" title="'+escapeHtml(tr('radioOpenSource'))+'">↗</a></div>').join('');
}
function load(index,autoplay=false){
if(!items.length)return;
selected=(index+items.length)%items.length;
paint();
if(!started)return;
const sound=current();
try{
 if(widget&&window.SC?.Widget)widget.load(sound.url,{auto_play:autoplay,color:'#b7ff22',visual:false,show_artwork:true});
 else frame.src=makeSrc(sound.url,autoplay);
 mark('radioReady');
}catch(_){frame.src=makeSrc(sound.url,autoplay);mark('radioReady')}
}
function advance(autoplay){const visible=items.map((t,i)=>({...t,index:i})).filter(t=>filter.value==='all'||t.artist===filter.value).map(t=>t.index);const p=visible.indexOf(selected);const nxt=visible[(p+1+visible.length)%visible.length];if(nxt!==undefined)load(nxt,autoplay);}
async function init(){
try{
 const response=await fetch('content/radio.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);
 const raw=await response.json();
 if(!Array.isArray(raw))throw Error('Invalid playlist');
 const validArtists=new Set(['Soul3d','Minopolska']);
 items=raw.filter(t=>t&&typeof t.title==='string'&&validArtists.has(t.artist)&&validUrl(t.url)&&(t.format==='track'||t.format==='playlist'));
 if(!items.length)throw Error('Empty playlist');
 paint();start.disabled=false;mark('radioBeforePlay');
}catch(err){console.warn('Radio playlist unavailable',err);start.disabled=true;mark('radioUnavailable')}
}
start.disabled=true;
start.addEventListener('click',()=>{
 if(!items.length)return;
 if(started){container.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
 started=true;container.hidden=false;
 const item=current();
 frame.src=makeSrc(item.url,true);
 next.disabled=false;
 start.textContent=tr('radioListening');
 mark('radioReady');
 if(window.SC?.Widget){
   widget=window.SC.Widget(frame);
   widget.bind(window.SC.Widget.Events.READY,()=>{try{widget.play()}catch(_){}});
   widget.bind(window.SC.Widget.Events.FINISH,()=>{
     const playing=current();if(!playing)return;
     if(playing.format==='playlist')return; // SoundCloud manages tracks within its own multi-track playlist.
     advance(true); // Browsers may block automatic playback; listeners can use native player controls.
   });
 }
});
next.addEventListener('click',()=>advance(true));
queue.addEventListener('click',e=>{
 const btn=e.target.closest('button[data-index]');if(!btn)return;
 const idx=Number(btn.dataset.index);if(Number.isInteger(idx)&&idx>=0&&idx<items.length)load(idx,started);
});
filter.addEventListener('change',paint);
el('langselect')?.addEventListener('change',()=>{
 paint();if(!started)start.textContent=tr('radioStart');else start.textContent=tr('radioListening');
 if(status.dataset.messageKey)status.textContent=tr(status.dataset.messageKey);
});
init();
})();
