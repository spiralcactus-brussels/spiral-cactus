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
let items=[],selected=0,started=false,widget=null,soundCount=0,soundIndex=0,finishBusy=false,firstReady=true;

/* Event-led temporary takeover: sourced from the actual event line-up and the verified radio catalog. */
let hardFrequencies=null;
const hfCopy={
 en:{kicker:'RADIO TAKEOVER / 11 DEC 2026',heading:'MEET THE LINEUP',intro:'Listen to the DJs joining us at Barrio Brussels on 11 December. Choose an artist and tune in directly through Spiral Radio.',event:'EXPLORE THE EVENT ↗',tickets:'GET TICKETS ↗',list:'LISTEN TO THE ARTISTS',count:'4 PERFORMANCE SLOTS / 7 DJS',listen:'LISTEN TO SET ▶',pending:'SET COMING SOON'},
 fr:{kicker:'RADIO SPÉCIALE / 11 DÉC 2026',heading:'DÉCOUVREZ LE LINE-UP',intro:'Découvrez les DJs qui seront au Barrio Brussels le 11 décembre. Choisissez un artiste et écoutez son set directement sur Spiral Radio.',event:'VOIR L’ÉVÉNEMENT ↗',tickets:'BILLETTERIE ↗',list:'ÉCOUTEZ LES ARTISTES',count:'4 CRÉNEAUX / 7 DJS',listen:'ÉCOUTER LE SET ▶',pending:'SET À VENIR'},
 nl:{kicker:'RADIO TAKEOVER / 11 DEC 2026',heading:'ONTDEK DE LINE-UP',intro:'Luister naar de DJs die op 11 december naar Barrio Brussels komen. Kies een artiest en beluister de set op Spiral Radio.',event:'BEKIJK HET EVENT ↗',tickets:'TICKETS ↗',list:'BELUISTER DE ARTIESTEN',count:'4 TIJDSBLOKKEN / 7 DJS',listen:'LUISTER NAAR SET ▶',pending:'SET VOLGT BINNENKORT'}
};
const hfArtistKey=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
function renderHardFrequencies(){
 const feature=el('hf-radio'),list=el('hf-radio-list');
 if(!feature||!list||!hardFrequencies)return;
 const startAt=Date.parse(hardFrequencies.date+'T00:00:00+01:00');
 // Stop showing the feature after the overnight event, without deleting normal radio mixes.
 if(!Number.isFinite(startAt)||Date.now()>startAt+36*3600000){feature.hidden=true;return;}
 const c=hfCopy[lang()]||hfCopy.en;
 feature.hidden=false;
 el('hf-radio-kicker').textContent=c.kicker;
 el('hf-radio-heading').innerHTML='HARD FREQUENCIES <span>'+escapeHtml(c.heading)+'</span>';
 el('hf-radio-intro').textContent=c.intro;
 el('hf-radio-event').textContent=c.event;
 el('hf-radio-tickets').textContent=c.tickets;
 el('hf-radio-list-label').textContent=c.list;
 el('hf-radio-count-label').textContent=c.count;
 list.innerHTML=hardFrequencies.artists.map((slot,i)=>{
  const rawGenre=String(slot.genre||'');
  const matched=rawGenre.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2})\s*·\s*(.*)$/);
  const time=matched?matched[1]:'';
  const genre=matched?matched[2]:rawGenre;
  const acts=String(slot.name).split(/\s*×\s*/).filter(Boolean);
  const buttons=acts.map(name=>{
   const index=items.findIndex(item=>hfArtistKey(item.artist)===hfArtistKey(name));
   if(index>=0)return '<button type="button" class="hf-radio-play" data-hf-index="'+index+'" title="'+escapeHtml(items[index].title)+'"><span>'+escapeHtml(name)+'</span><strong>'+escapeHtml(c.listen)+'</strong></button>';
   return '<div class="hf-radio-pending"><span>'+escapeHtml(name)+'</span><small>'+escapeHtml(c.pending)+'</small></div>';
  }).join('');
  return '<article class="hf-radio-slot"><div class="hf-radio-meta"><span>0'+(i+1)+' / 04</span><span>'+escapeHtml(time)+'</span></div><h3>'+escapeHtml(slot.name)+'</h3><p class="hf-radio-genre">'+escapeHtml(genre)+'</p><div class="hf-radio-artists">'+buttons+'</div></article>';
 }).join('');
}
el('hf-radio-list')?.addEventListener('click',e=>{
 const button=e.target.closest('button[data-hf-index]');if(!button)return;
 const index=Number(button.dataset.hfIndex);
 if(!Number.isInteger(index)||index<0||index>=items.length)return;
 filter.value='all';load(index,started);
 if(!started)start.click();
 document.querySelector('.radio-station')?.scrollIntoView({block:'start',behavior:'smooth'});
});

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
 soundCount=Array.isArray(sounds)?sounds.length:0;
});
}
function load(index,autoplay=false){
if(!items.length)return;
selected=(index+items.length)%items.length;
soundCount=0;soundIndex=0;finishBusy=false;
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
 const guestArtists=new Set(events.flatMap(e=>Array.isArray(e.artists)?e.artists.flatMap(a=>String(a.name||'').split(/\s*[×&]\s*/)):[]).filter(Boolean).map(a=>a.trim().toLowerCase()));
 items=raw.filter(t=>t&&typeof t.title==='string'&&typeof t.artist==='string'&&guestArtists.has(t.artist.toLowerCase())&&validUrl(t.url)&&(t.format==='track'||t.format==='playlist'));
 if(!items.length)throw Error('Empty guest playlist');
 filter.querySelectorAll('option:not([value="all"])').forEach(option=>option.remove());
 [...new Set(items.map(t=>t.artist))].sort((a,b)=>a.localeCompare(b)).forEach(name=>{
   const option=document.createElement('option');option.value=name;option.textContent=name;filter.appendChild(option);
 });
 hardFrequencies=events.find(event=>event.id==='hard-frequencies'&&Array.isArray(event.artists))||null;
 renderHardFrequencies();
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
 renderHardFrequencies();
 paint();if(!started)start.textContent=tr('radioStart');else start.textContent=tr('radioListening');
 if(status.dataset.messageKey)status.textContent=tr(status.dataset.messageKey);
});
init();
})();
