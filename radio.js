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
let items=[],selected=0,started=false,widget=null,soundCount=1,soundIndex=0,finishBusy=false,firstReady=true;
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
function syncPlaylistInfo(){
if(!widget)return;
const currentId=current()?.id;
widget.getSounds(sounds=>{
 if(current()?.id!==currentId)return;
 soundCount=Math.max(1,Array.isArray(sounds)?sounds.length:1);
});
}
function load(index,autoplay=false){
if(!items.length)return;
selected=(index+items.length)%items.length;
soundCount=1;soundIndex=0;finishBusy=false;
paint();
if(!started)return;
const sound=current();
try{
 if(widget&&window.SC?.Widget){
   widget.load(sound.url,{
     auto_play:autoplay,color:'#b7ff22',visual:false,show_artwork:true,
     callback:()=>{syncPlaylistInfo();if(autoplay)widget.play();}
   });
 }else frame.src=makeSrc(sound.url,autoplay);
 mark('radioReady');
}catch(_){frame.src=makeSrc(sound.url,autoplay);mark('radioReady')}
}
function advance(autoplay){const visible=items.map((t,i)=>({...t,index:i})).filter(t=>filter.value==='all'||t.artist===filter.value).map(t=>t.index);const p=visible.indexOf(selected);const nxt=visible[(p+1+visible.length)%visible.length];if(nxt!==undefined)load(nxt,autoplay);}
async function init(){
try{
 const [response,eventsResponse]=await Promise.all([
   fetch('content/radio.json',{cache:'no-cache'}),
   fetch('content/events.json',{cache:'no-cache'})
 ]);
 if(!response.ok||!eventsResponse.ok)throw Error('HTTP error while loading radio guest artists');
 const [raw,events]=await Promise.all([response.json(),eventsResponse.json()]);
 if(!Array.isArray(raw)||!Array.isArray(events))throw Error('Invalid radio or event data');
 // A DJ must have appeared on a real SpiralCactus lineup to be eligible.
 const guestArtists=new Set(events.flatMap(e=>Array.isArray(e.artists)?e.artists.map(a=>a.name):[]).filter(Boolean).map(a=>a.toLowerCase()));
 items=raw.filter(t=>t&&typeof t.title==='string'&&typeof t.artist==='string'&&guestArtists.has(t.artist.toLowerCase())&&validUrl(t.url)&&(t.format==='track'||t.format==='playlist'));
 if(!items.length)throw Error('Empty guest playlist');
 filter.querySelectorAll('option:not([value="all"])').forEach(option=>option.remove());
 [...new Set(items.map(t=>t.artist))].sort((a,b)=>a.localeCompare(b)).forEach(name=>{
   const option=document.createElement('option');option.value=name;option.textContent=name;filter.appendChild(option);
 });
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
   widget.bind(window.SC.Widget.Events.READY,()=>{
     syncPlaylistInfo();
     if(firstReady){firstReady=false;try{widget.play()}catch(_){}}
   });
   widget.bind(window.SC.Widget.Events.PLAY,()=>{
     // SoundCloud automatically progresses inside an artist's playlist.
     // Remember the last track index, so we can advance ONLY once the final
     // track of that playlist has finished.
     widget.getCurrentSoundIndex(index=>{
       if(Number.isInteger(index)&&index>=0)soundIndex=index;
     });
   });
   widget.bind(window.SC.Widget.Events.FINISH,()=>{
     if(finishBusy||!current())return;
     // FINISH is fired at the end of a track, not reliably only at the end
     // of an entire playlist. For a playlist, do not cut off its other tracks.
     const atEnd=current().format!=='playlist'||(soundCount>0&&soundIndex>=soundCount-1);
     if(!atEnd)return;
     finishBusy=true;
     advance(true); // Automatic continuation across sources is best effort:
                    // iframe/browser autoplay permissions can still block it.
   });
   widget.bind(window.SC.Widget.Events.ERROR,()=>{
     mark('radioPlaybackError');
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
