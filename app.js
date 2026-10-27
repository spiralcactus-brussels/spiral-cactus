/* SpiralCactus — static GitHub Pages site. Public event/blog data lives in content/*.json. */
(() => {
  'use strict';
  const langs = ['en', 'fr', 'nl'];
  const locales = {en:'en-GB', fr:'fr-BE', nl:'nl-BE'};
  const i18n = window.SC_TRANSLATIONS || {};
  const dynamic = {
    en:{tickets:'Tickets',photos:'View photos',poster:'Lineup poster',past:'Past event',upcoming:'Upcoming event',artists:'On the lineup',emptyEvents:'No events in this month.',readMore:'Read more',emptyBlog:'The first stories are coming soon.',monthEvent:'Event',submitError:'Please complete all fields.',openPhoto:'Open photograph',closePhoto:'Close photograph',venue:'Venue',thisMonth:'This month',shopBuy:'Buy securely',ticketOnSite:'Buy tickets on this page',ticketHelp:'Secure checkout provided by WeTicket. If the embedded shop does not load, use the direct link.',ticketExternal:'Open ticket shop',shopNoLink:'Ordering will open when checkout is configured.'},
    fr:{tickets:'Billetterie',photos:'Voir les photos',poster:'Affiche du line-up',past:'Événement passé',upcoming:'À venir',artists:'Au line-up',emptyEvents:'Aucun événement pour ce mois.',readMore:'Lire la suite',emptyBlog:'Les premiers articles arrivent bientôt.',monthEvent:'Événement',submitError:'Veuillez remplir tous les champs.',openPhoto:'Ouvrir la photo',closePhoto:'Fermer la photo',venue:'Lieu',thisMonth:'Ce mois-ci',shopBuy:'Acheter en toute sécurité',ticketOnSite:'Acheter des billets ici',ticketHelp:'Paiement sécurisé géré par WeTicket. Si la billetterie ne s’affiche pas, utilisez le lien direct.',ticketExternal:'Ouvrir la billetterie',shopNoLink:'Les commandes seront disponibles une fois le paiement configuré.'},
    nl:{tickets:'Tickets',photos:'Bekijk de foto’s',poster:'Line-up poster',past:'Voorbij',upcoming:'Binnenkort',artists:'Op de line-up',emptyEvents:'Geen evenementen in deze maand.',readMore:'Lees meer',emptyBlog:'De eerste verhalen verschijnen binnenkort.',monthEvent:'Evenement',submitError:'Vul alle velden in.',openPhoto:'Open foto',closePhoto:'Sluit foto',venue:'Locatie',thisMonth:'Deze maand',shopBuy:'Veilig kopen',ticketOnSite:'Koop tickets op deze pagina',ticketHelp:'Veilig afrekenen via WeTicket. Gebruik de rechtstreekse link als de ingebedde shop niet opent.',ticketExternal:'Open ticketshop',shopNoLink:'Bestellen is mogelijk zodra de betaalfunctie is ingesteld.'}
  };
  const page = document.body.dataset.page;
  let current = 'en', events = [], posts = [], galleryPhotos = [], products = [], month = new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const languageVal = obj => typeof obj === 'string' ? obj : (obj?.[current] || obj?.en || '');
  const l = key => dynamic[current]?.[key] || key;
  const localDate = date => new Date(`${date}T12:00:00`);
  function fullDate(date){return new Intl.DateTimeFormat(locales[current],{day:'numeric',month:'long',year:'numeric'}).format(localDate(date));}
  function shortDate(date){return new Intl.DateTimeFormat(locales[current],{day:'numeric',month:'short'}).format(localDate(date));}
  function isPast(e){ const now=new Date();return e.date < dateKey(now.getFullYear(),now.getMonth(),now.getDate()); }
  function renderText(){
    const words=i18n[current] || i18n.en || {};
    document.querySelectorAll('[data-i18n]').forEach(el=>{const w=words[el.dataset.i18n];if(w!==undefined)el.textContent=w;});
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const w=words[el.dataset.i18nPlaceholder];if(w!==undefined)el.placeholder=w;});
    document.querySelectorAll('[data-i18n-content]').forEach(el=>{const w=words[el.dataset.i18nContent];if(w!==undefined)el.setAttribute('content',w);});
    document.documentElement.lang=current;
    document.getElementById('langselect').value=current;
    const titlePage = document.querySelector('nav a.active')?.textContent || 'SpiralCactus';
    const homeTitles={en:'SpiralCactus Brussels | Underground Raves & Radio',fr:'SpiralCactus Bruxelles | Raves underground et radio',nl:'SpiralCactus Brussel | Undergroundraves en radio'};
    document.title=page==='index'?homeTitles[current]:`SpiralCactus Brussels | ${titlePage}`;
    document.querySelectorAll('[data-dynamic-lang]').forEach(el=>{const w=dynamic[current]?.[el.dataset.dynamicLang];if(w!==undefined)el.textContent=w;});
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el=>{const w=words[el.dataset.i18nAriaLabel];if(w!==undefined)el.setAttribute('aria-label',w);});
    document.querySelectorAll('[data-i18n-title]').forEach(el=>{const w=words[el.dataset.i18nTitle];if(w!==undefined)el.title=w;});
  }
  function changeLang(lang){
    current=langs.includes(lang)?lang:'en';
    try{localStorage.setItem('sc-lang',current)}catch(_){/* private browsing */}
    renderText(); renderHome(); renderEvents(); renderEventDetail(); renderArtists(); renderBlog(); renderCalendar(); renderGallery(); renderShop(); setupGallery();
  }
  try{current=localStorage.getItem('sc-lang') || 'en';}catch(_){current='en'}
  if(!langs.includes(current))current='en';
  document.getElementById('langselect')?.addEventListener('change',e=>changeLang(e.target.value));
  // Website permanently uses the original dark theme, regardless of old saved preference.
  document.body.classList.remove('light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#08090c');
  try{localStorage.removeItem('sc-theme')}catch(_){}
  document.getElementById('menubtn')?.addEventListener('click',e=>{
    const links=document.getElementById('mainlinks');links.classList.toggle('opened');e.currentTarget.setAttribute('aria-expanded',String(links.classList.contains('opened')));
  });
  const mainLinks=document.getElementById('mainlinks');
  const navMore=mainLinks?.querySelector('.nav-more');
  const closeMobileMenu=()=>{
    mainLinks?.classList.remove('opened');
    document.getElementById('menubtn')?.setAttribute('aria-expanded','false');
    if(navMore)navMore.open=false;
  };
  document.querySelectorAll('#mainlinks a').forEach(a=>a.addEventListener('click',closeMobileMenu));
  // Close the secondary navigation on Escape and outside clicks; keep keyboard navigation intact.
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileMenu();});
  document.addEventListener('pointerdown',e=>{
    if(navMore?.open && !navMore.contains(e.target))navMore.open=false;
    if(mainLinks?.classList.contains('opened') && !e.target.closest('.site-header'))closeMobileMenu();
  });
  // AJAX contact delivery using FormSubmit; HTML form.action is a no-JavaScript fallback.
  const contact = document.getElementById('contactform');
  if(contact){
    const params=new URLSearchParams(location.search);
    if(params.get('subject')==='dj')contact.elements.subject.value='DJ / Live act booking';
    const status=contact.querySelector('#contact-status');
    const submit=contact.querySelector('button[type="submit"]');
    const contactText=(key)=>i18n[current]?.[key]||i18n.en?.[key]||key;
    let sending=false;
    const showStatus=(key,state)=>{
      if(!status)return;
      status.hidden=false;
      status.dataset.state=state;
      status.dataset.messageKey=key;
      status.textContent=contactText(key);
    };
    contact.addEventListener('submit',async(e)=>{
      e.preventDefault();
      if(sending||!contact.reportValidity())return;
      const fd=new FormData(contact);
      const email=String(fd.get('email')||'').trim();
      const subject=String(fd.get('subject')||'').trim();
      const message=String(fd.get('message')||'').trim();
      if(fd.get('_honey'))return; // Hidden honeypot: ignore automated spam.
      if(!email||!subject||!message){showStatus('contactInvalid','error');return;}
      sending=true;
      submit.disabled=true;
      submit.textContent=contactText('contactSending');
      showStatus('contactSending','info');
      try{
        const response=await fetch('https://formsubmit.co/ajax/spiralcactus24@gmail.com',{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({
            email,subject,message,
            _subject:'SpiralCactus — '+subject,
            _template:'table',
            _honey:'',
            source:'SpiralCactus website contact form',
            _url:'https://spiralcactus.be/contact.html'
          })
        });
        const result=await response.json();
        if(!response.ok||!(result?.success===true||result?.success==='true')){
          throw new Error(result?.message||'FormSubmit did not confirm submission.');
        }
        contact.reset();
        showStatus('contactSent','success');
      }catch(error){
        console.warn('SpiralCactus contact form submission failed:',error);
        showStatus('contactSendError','error');
      }finally{
        sending=false;
        submit.disabled=false;
        submit.textContent=contactText('formSend');
      }
    });
    // Keep the inline message translated when visitors switch languages.
    document.getElementById('langselect')?.addEventListener('change',()=>{
      if(status&&!status.hidden&&status.dataset.messageKey){
        status.textContent=contactText(status.dataset.messageKey);
      }
      if(sending)submit.textContent=contactText('contactSending');
    });
  }
  // Faster atmospheric dots, with a reduced-motion option and battery-aware pausing.
  const canvas=document.getElementById('particles'), ctx=canvas?.getContext('2d');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let dots=[],raf=0,prev=0;
  function sizeDots(){
    if(!ctx)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);
    canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.setTransform(ratio,0,0,ratio,0,0);
    dots=Array.from({length:Math.min(135,Math.floor(innerWidth/11))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,v:.50+Math.random()*1.12,r:.4+Math.random()*1.35,a:.17+Math.random()*.40,c:['#b7ff22','#ff5722','#b394fa','#c5d6ff'][Math.floor(Math.random()*4)]}));
  }
  function draw(t){
    if(!ctx)return;
    const delta=Math.min((t-prev)/16.67||1,3);prev=t;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const d of dots){ctx.globalAlpha=d.a;ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();if(!reduced){d.y-=d.v*delta;d.x+=Math.sin(t/2500+d.y/110)*.10*delta;if(d.y<0){d.y=innerHeight;d.x=Math.random()*innerWidth;}}}
    ctx.globalAlpha=1;if(!reduced&& !document.hidden)raf=requestAnimationFrame(draw);
  }
  if(ctx){sizeDots();addEventListener('resize',sizeDots,{passive:true});raf=requestAnimationFrame(draw);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else{prev=0;raf=requestAnimationFrame(draw)}});
  }
  async function loadJson(path){
    try{const response=await fetch(path,{cache:'no-cache'});if(!response.ok)throw Error(`${response.status}`);return await response.json();}
    catch(e){console.warn(`Unable to load ${path}; preview through a local HTTP server or GitHub Pages.`,e);return []}
  }
  function artistNames(e){return (e.artists||[]).map(a=>a.name).join(' · ')}
  function posterHTML(e){
    if(e.poster){return `<div class="event-poster"><img src="${esc(e.poster)}" alt="${esc(languageVal(e.name))} — ${esc(l('poster'))}" loading="lazy"></div>`}
    if(e.id==='acid-edition')return `<div class="event-poster acid-poster" role="img" aria-label="Brussels Rave Night Acid Edition lineup: ${esc(artistNames(e))}"><div class="poster-top">SPIRALCACTUS PRESENTS / BXL</div><div class="poster-rings" aria-hidden="true"></div><div class="poster-content"><span class="poster-series">BRUSSELS RAVE NIGHT</span><strong>ACID<br>EDITION</strong><span class="poster-lineup">${(e.artists||[]).map(a=>`<b>${esc(a.name)}</b>`).join('')}</span><span class="poster-bottom">16.10.2026 · BARRIO BRUSSELS · 22—07H</span></div></div>`;
    return `<div class="event-poster poster-simple" aria-hidden="true"><span>SPIRAL<br>CACTUS</span><b>BRUSSELS<br>RAVE NIGHT</b><small>28.08.2026</small></div>`;
  }
  function eventInfo(e,small=false){
    const inPageTickets=!!safePaymentUrl(e.ticketEmbed)&&!isPast(e);
    const ticket=inPageTickets
      ? `<button class="btn" type="button" data-open-ticketshop>${esc(l('ticketOnSite'))} ↓</button>`
      : (!isPast(e) && safePaymentUrl(e.ticket)?`<a class="btn" href="${esc(safePaymentUrl(e.ticket))}" target="_blank" rel="noopener noreferrer">${esc(l('tickets'))} ↗</a>`:'');
    return `<span class="eyebrow">${esc(fullDate(e.date))} · ${esc(isPast(e)?l('past'):l('upcoming'))}</span><h3>${esc(languageVal(e.name))}</h3><p class="meta">${esc(e.venue)} · ${esc(e.start)}—${esc(e.end)}</p><p>${esc(languageVal(e.description))}</p><p class="muted artist-lineup">${esc(artistNames(e))}</p><div class="buttons">${ticket}<a class="btn alt" href="${eventUrl(e)}">${esc(t('eventsViewDetail'))}</a></div>`;
  }

  // Only embed known hosted payment providers. No card details are handled by GitHub Pages.
  function safePaymentUrl(raw){
    if(typeof raw!=='string'||!raw)return '';
    try {
      const u=new URL(raw),host=u.hostname.toLowerCase();
      const allowed=host.endsWith('.weticket.io')||['buy.stripe.com','checkout.stripe.com','pay.mollie.com','paypal.com','www.paypal.com'].includes(host);
      return u.protocol==='https:' && allowed ? u.href : '';
    }catch(_){return ''}
  }
  function ticketEmbedHTML(e){
    const url=safePaymentUrl(e.ticketEmbed);
    if(!url||isPast(e))return '';
    const fallback=safePaymentUrl(e.ticket)||url;
    return '<details class="ticket-embed"><summary>'+esc(l('ticketOnSite'))+' ↓</summary>'
      +'<p class="note">'+esc(l('ticketHelp'))+'</p>'
      +'<iframe src="'+esc(url)+'" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" title="'+esc(l('ticketOnSite'))+'"></iframe>'
      +'<p><a class="btn alt" href="'+esc(fallback)+'" target="_blank" rel="noopener noreferrer">'+esc(l('ticketExternal'))+' ↗</a></p>'
      +'</details>';
  }
  // Release 01: a unified, event-first homepage and shareable event detail view.
  // Published editions get event-specific previews on social networks.
  // Future editions still work with the generic detail route until promoted.
  const staticEventPages=new Set(['acid-edition','first-rave']);
  const eventUrl=e=>staticEventPages.has(e.id)
    ? 'event-'+e.id+'.html'
    : 'event.html?id='+encodeURIComponent(e.id);
  const t = k => i18n[current]?.[k] || i18n.en?.[k] || k;
  const dateAndVenue = e => fullDate(e.date)+' · '+(e.venue||'');

  // RFC 5545 calendar downloads for public upcoming events. Timezone is fixed to
  // Brussels, including the overnight end time of a rave (next calendar day).
  const calendarTime = value => /^\d{2}:\d{2}$/.test(value||'') && +value.slice(0,2)<24 && +value.slice(3)<60;
  const icsEscape = value => String(value||'').replace(/[\r\n]+/g,' ').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function eventCalendar(e){
    if(!e || !/^\d{4}-\d{2}-\d{2}$/.test(e.date||'') || !calendarTime(e.start) || !calendarTime(e.end))return null;
    const start=e.date.replaceAll('-',''),endNext=e.end<=e.start;
    const endDay=endNext?new Date(new Date(e.date+'T12:00:00Z').getTime()+86400000).toISOString().slice(0,10).replaceAll('-',''):start;
    const link=new URL(eventUrl(e),location.href).href;
    const description=languageVal(e.description);
    const parts=[
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SpiralCactus//Events//EN',
      'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
      'UID:'+icsEscape(e.id)+'@spiralcactus.brussels',
      'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
      'DTSTART;TZID=Europe/Brussels:'+start+'T'+e.start.replace(':','')+'00',
      'DTEND;TZID=Europe/Brussels:'+endDay+'T'+e.end.replace(':','')+'00',
      'SUMMARY:'+icsEscape(languageVal(e.name)),
      'DESCRIPTION:'+icsEscape(description),
      'LOCATION:'+icsEscape(e.venue||'Brussels'),
      'URL:'+link,'END:VEVENT','END:VCALENDAR',''
    ];
    return parts.join('\r\n');
  }
  function downloadEventCalendar(e){
    const ics=eventCalendar(e);
    if(!ics)return;
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='spiralcactus-'+e.id+'.ics';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }

  function posterImage(e,cssClass,loading='lazy'){
    if(!e.poster)return '<div class="'+cssClass+' home-poster-placeholder" aria-hidden="true">SC / SPIRALCACTUS</div>';
    return '<img class="'+cssClass+'" src="'+esc(e.poster)+'" alt="'+esc(languageVal(e.name))+' — '+esc(l('poster'))+'" loading="'+loading+'" decoding="async">';
  }
  function homeStageCard(e,isUpcoming){
    const shop=isUpcoming?safePaymentUrl(e.ticket):'';
    const category=t(isUpcoming?'homeUpcomingLabel':'homeLatestLabel');
    const title=languageVal(e.name);
    const detail='<a class="btn alt" href="'+eventUrl(e)+'">'+esc(t(isUpcoming?'homeEventMore':'homePastEdition'))+'</a>';
    const ticket=shop?'<a class="btn" href="'+esc(shop)+'" target="_blank" rel="noopener noreferrer">'+esc(t('homeTickets'))+'</a>':'';
    const update=isUpcoming?'':'<div class="home-stage-coming"><span class="eyebrow">'+esc(t('homeComingLabel'))+'</span><p>'+esc(t('homeComingText'))+'</p></div>';
    return '<div class="home-feature-poster">'+posterImage(e,'home-feature-image','eager')+'</div>'
      +'<div class="home-feature-copy">'+update+'<p class="eyebrow">'+esc(category)+'</p>'
      +'<h2>'+esc(title)+'</h2><p class="home-feature-meta">'+esc(dateAndVenue(e))+'</p>'
      +'<div class="home-feature-actions">'+ticket+detail+'</div></div>';
  }
  function renderHome(){
    if(page!=='index')return;
    const featured=document.getElementById('home-event-stage');
    const archive=document.getElementById('home-latest-events');
    if(!featured||!archive)return;
    const ordered=[...events].filter(e=>e&&e.id&&e.date).sort((a,b)=>a.date.localeCompare(b.date));
    const next=ordered.find(e=>!isPast(e));
    const previous=ordered.filter(isPast).reverse();
    if(next)featured.innerHTML=homeStageCard(next,true);
    else if(previous.length)featured.innerHTML=homeStageCard(previous[0],false);
    else featured.innerHTML='<div class="home-stage-empty"><span class="eyebrow">'+esc(t('homeComingLabel'))+'</span><h2>'+esc(t('homeComingTitle'))+'</h2><p>'+esc(t('homeEventMissing'))+'</p><a class="btn alt" href="events.html">'+esc(t('homeFirstCta'))+'</a></div>';
    archive.innerHTML=previous.slice(0,3).map(e=>'<a class="home-history-card" href="'+eventUrl(e)+'">'
      +posterImage(e,'home-history-poster')+'<div class="home-history-info"><span class="eyebrow">'+esc(fullDate(e.date))+'</span>'
      +'<h3>'+esc(languageVal(e.name))+'</h3><p>'+esc(e.venue||'')+'</p>'
      +'<span class="home-history-cta">'+esc(t('eventsViewDetail'))+'</span></div></a>').join('');
    if(!previous.length)archive.innerHTML='<p class="home-history-empty">'+esc(t('homeEventMissing'))+'</p>';
  }
  function renderEvents(){
    if(page!=='events')return;
    const featured=document.getElementById('featured-event'),list=document.getElementById('event-list');
    if(!featured||!list)return;
    const upcoming=[...events].filter(e=>!isPast(e)).sort((a,b)=>a.date.localeCompare(b.date));
    const pastEvents=[...events].filter(isPast).sort((a,b)=>b.date.localeCompare(a.date));
    if(upcoming.length){
      const next=upcoming[0];
      featured.innerHTML='<article class="eventbox"><div class="event-info">'+eventInfo(next)+'</div>'+posterHTML(next)+'</article>'
        +ticketEmbedHTML(next)+upcoming.slice(1).map(e=>'<article class="archive-card"><div class="archive-copy"><span class="eyebrow">'+esc(fullDate(e.date))+'</span><h3>'+esc(languageVal(e.name))+'</h3><p>'+esc(e.venue)+'</p></div><a class="btn alt" href="'+eventUrl(e)+'">'+esc(t('eventsViewDetail'))+'</a></article>').join('');
    } else {
      featured.innerHTML='<div class="events-coming"><span class="eyebrow">'+esc(t('eventsUpcomingEmpty'))+'</span><h3>'+esc(t('eventsComingTitle'))+'</h3><p>'+esc(t('eventsComingDescription'))+'</p><a class="btn alt" href="radio.html">'+esc(t('homeSecondCta'))+'</a></div>';
    }
    list.innerHTML=pastEvents.map(e=>'<article class="archive-card">'+(e.poster?'<a class="archive-poster-link" href="'+eventUrl(e)+'">'+posterImage(e,'archive-poster')+'</a>':'')
      +'<div class="archive-copy"><span class="eyebrow">'+esc(fullDate(e.date))+'</span><h3><a href="'+eventUrl(e)+'">'+esc(languageVal(e.name))+'</a></h3>'
      +'<p>'+esc(languageVal(e.description))+'</p><p class="muted">'+esc(artistNames(e))+'</p></div>'
      +'<a class="btn alt" href="'+eventUrl(e)+'">'+esc(t('eventsViewDetail'))+'</a></article>').join('');
    if(!pastEvents.length)list.innerHTML='<p class="muted">'+esc(t('homeEventMissing'))+'</p>';
  }
  function renderEventDetail(){
    if(page!=='event')return;
    const root=document.getElementById('event-detail-root');
    if(!root)return;
    const id=document.body.dataset.eventId || new URLSearchParams(location.search).get('id');
    const e=events.find(item=>item.id===id && /^[a-z0-9-]{1,100}$/.test(item.id));
    if(!e){
      root.innerHTML='<h1>'+esc(t('eventDetailsTitle'))+'</h1><p class="lead">'+esc(t('eventDetailInvalid'))+'</p><a class="btn" href="events.html">'+esc(t('eventDetailsBack'))+'</a>';
      return;
    }
    const historical=isPast(e),shop=!historical?safePaymentUrl(e.ticket):'';
    const safeEmbed=!historical?safePaymentUrl(e.ticketEmbed):'';
    const heading=languageVal(e.name);
    const descr=languageVal(e.description);
    const lineup=(e.artists||[]).map((a,n)=>'<li><span class="detail-artist-count">'+String(n+1).padStart(2,'0')+'</span><div><strong>'+esc(a.name||'')+'</strong>'
      +(a.genre||a.crew?'<small>'+esc(a.genre||a.crew)+'</small>':'')+'</div></li>').join('');
    const calendarAction=!historical && eventCalendar(e)
      ? '<button class="btn alt" id="event-calendar" type="button">'+esc(t('eventDetailCalendar'))+'</button>' : '';
    const ctas=calendarAction+'<a class="btn alt" href="gallery.html?event='+encodeURIComponent(e.gallery)+'">'+esc(t('eventDetailPhotos'))+'</a>'
      +(!historical?'<a class="btn alt" href="members.html">'+esc(t('memberProfileTab'))+' ↗</a>':'');
    const checkout=shop?'<a class="btn" href="'+esc(shop)+'" target="_blank" rel="noopener noreferrer">'+esc(t('eventDetailTicketShop'))+'</a>':'';
    const dates='<div><span class="eyebrow">'+esc(t('eventInfoWhen'))+'</span><strong>'+esc(fullDate(e.date))+'</strong></div>'
      +'<div><span class="eyebrow">'+esc(t('eventInfoWhere'))+'</span><strong>'+esc(e.venue||'')+'</strong></div>'
      +'<div><span class="eyebrow">'+esc(t('eventInfoHours'))+'</span><strong>'+esc((e.start||'')+(e.end?' — '+e.end:''))+'</strong></div>';
    root.innerHTML='<div class="detail-hero"><div class="detail-head"><span class="eyebrow">'+esc(historical?l('past'):l('upcoming'))+' / '+esc(t('eventDetailsTitle'))+'</span>'
      +'<h1>'+esc(heading)+'</h1><p class="lead">'+esc(descr)+'</p><div class="detail-date-line">'+dates+'</div>'
      +'<div class="buttons">'+checkout+ctas+'</div>'
      +(historical?'<p class="detail-ticket-note">'+esc(t('eventDetailNotOnSale'))+'</p>'
        :(shop||safeEmbed?'<p class="detail-ticket-note">'+esc(t('eventDetailTicketIssued'))+'</p>':''))
      +'<button id="event-share" type="button" class="event-share">'+esc(t('eventDetailShare'))+' ↗</button></div>'
      +'<div class="detail-poster">'+posterImage(e,'detail-poster-img','eager')+'</div></div>'
      +'<div class="detail-content-grid"><section class="detail-lineup"><p class="eyebrow">'+esc(t('homeLineupLabel'))+'</p>'
      +'<h2>'+esc(t('eventDetailLineup'))+'</h2><p>'+esc(t('eventDetailLineupLead'))+'</p>'
      +(lineup?'<ol class="detail-artist-list">'+lineup+'</ol>':'<p>'+esc(t('eventDetailArtistsEmpty'))+'</p>')+'</section>'
      +'<aside class="detail-guidance"><p class="eyebrow">'+esc(t('eventDetailPractical'))+'</p><h2>'+esc(t('eventDetailCareTitle'))+'</h2>'
      +'<p>'+esc(t('eventDetailCareText'))+'</p><a class="btn alt" href="discover.html#philosophy">'+esc(t('eventDetailCareCta'))+'</a>'
      +(!historical?'<p class="detail-help">'+esc(t('eventDetailFutureInfo'))+'</p>':'')+'</aside></div>'
      +(safeEmbed?ticketEmbedHTML(e):'');
    const headline=heading+' | SpiralCactus Brussels';
    document.title=headline;
    for(const [sel,val] of [['meta[property="og:title"]',headline],['meta[name="description"]',descr],['meta[property="og:description"]',descr]]){
      const node=document.querySelector(sel);if(node)node.content=val;
    }
    const absolute=new URL(eventUrl(e),location.href).href;
    document.querySelector('meta[property="og:url"]')?.setAttribute('content',absolute);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href',absolute);
    document.getElementById('event-calendar')?.addEventListener('click',()=>downloadEventCalendar(e));
    const btn=document.getElementById('event-share');
    btn?.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(absolute);btn.textContent=t('eventDetailCopied');}
      catch(_){btn.textContent=t('eventDetailCopyFailed');}
    });
  }
  if(page==='events'){
    document.getElementById('featured-event')?.addEventListener('click',event=>{
      const trigger=event.target.closest('[data-open-ticketshop]');
      if(!trigger)return;
      const checkout=document.querySelector('#featured-event .ticket-embed');
      if(!checkout)return;
      checkout.open=true;
      checkout.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    });
  }
  function renderArtists(){
    if(page!=='artists')return;
    for(const [id,box] of [['acid-edition','artists-current'],['first-rave','artists-past']]){
      const e=events.find(x=>x.id===id);const el=document.getElementById(box);if(!el)continue;
      el.innerHTML=(e?.artists||[]).map(a=>`<article class="card artist-card">${a.image?`<img class="artist-image" src="${esc(a.image)}" alt="${esc(a.name)}" loading="lazy">`:""}<span class="num">${esc(e?.name?.en || '')}</span><h3>${esc(a.name)}</h3><p>${esc(a.genre||a.crew||'')}</p></article>`).join('');
    }
  }
  function renderBlog(){
    if(page!=='blog')return;
    const list=document.getElementById('blog-list'),empty=document.getElementById('blog-empty');if(!list||!empty)return;
    const published=posts.filter(p=>p.published!==false).sort((a,b)=>b.date.localeCompare(a.date));
    const selected=new URLSearchParams(location.search).get('post');
    const detail=document.getElementById('blog-detail');
    const selectedPost=published.find(p=>p.slug===selected);
    const coverHTML=p=>{
      const cover=String(p?.image||'');
      return /^assets\/blog\/[a-z0-9_./ -]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(cover) && !cover.includes('..')
        ? '<img class="blog-cover" loading="lazy" src="'+esc(cover)+'" alt="'+esc(languageVal(p.title))+'">'
        : '';
    };
    if(selectedPost){
      list.hidden=true;empty.hidden=true;detail.hidden=false;
      const paragraphs=String(languageVal(selectedPost.body||selectedPost.excerpt)).split(/\n\s*\n/).map(para=>`<p>${esc(para).replace(/\n/g,'<br>')}</p>`).join('');
      detail.innerHTML=`<a class="btn alt" href="blog.html">${esc(i18n[current]?.blogBack||'Back')} ↗</a><span class="eyebrow">${esc(fullDate(selectedPost.date))}</span><h2>${esc(languageVal(selectedPost.title))}</h2>${coverHTML(selectedPost)}${paragraphs}`;
      return;
    }
    list.hidden=false;detail.hidden=true;empty.hidden=!!published.length;
    list.innerHTML=published.map(p=>`<article class="card blog-card">${coverHTML(p)}<span class="num">${esc(fullDate(p.date))}</span><h3>${esc(languageVal(p.title))}</h3><p>${esc(languageVal(p.excerpt||p.body))}</p>${p.slug?`<a href="blog.html?post=${encodeURIComponent(p.slug)}">${esc(l('readMore'))} ↗</a>`:''}${p.url?` <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">↗</a>`:''}</article>`).join('');
  }
  const dateKey=(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  function renderCalendar(){
    if(page!=='calendar')return;
    const grid=document.getElementById('calendar-grid'), heading=document.getElementById('calendar-month'),list=document.getElementById('calendar-events');if(!grid||!heading||!list)return;
    const y=month.getFullYear(),m=month.getMonth();
    heading.textContent=new Intl.DateTimeFormat(locales[current],{month:'long',year:'numeric'}).format(month);
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weekdays=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locales[current],{weekday:'short'}).format(new Date(2026,0,5+i)));
    const first=(new Date(y,m,1).getDay()+6)%7,total=new Date(y,m+1,0).getDate();
    let html=weekdays.map(d=>`<div class="cal-weekday">${esc(d)}</div>`).join('');
    for(let i=0;i<first;i++)html+='<div class="cal-blank" aria-hidden="true"></div>';
    for(let d=1;d<=total;d++){
      const key=dateKey(y,m,d),matches=events.filter(e=>e.date===key),today=key===dateKey(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());
      html+=`<div class="cal-cell ${matches.length?'has-event':''} ${today?'is-today':''}"><span class="cal-date">${d}</span>${matches.map(e=>`<a class="cal-event" href="${eventUrl(e)}" title="${esc(languageVal(e.name))}">${esc(languageVal(e.name))}</a>`).join('')}</div>`;
    }
    grid.innerHTML=html;
    const monthEvents=events.filter(e=>localDate(e.date).getFullYear()===y&&localDate(e.date).getMonth()===m).sort((a,b)=>a.date.localeCompare(b.date));
    list.innerHTML=monthEvents.length?monthEvents.map(e=>`<article class="archive-card"><div><span class="eyebrow">${esc(fullDate(e.date))}</span><h3>${esc(languageVal(e.name))}</h3><p>${esc(e.venue)} · ${esc(e.start)}—${esc(e.end)}</p></div><a class="btn alt" href="${eventUrl(e)}">${esc(l('monthEvent'))} ↗</a></article>`).join(''):`<p class="muted">${esc(l('emptyEvents'))}</p>`;
  }
  if(page==='calendar'){
    document.getElementById('calendar-prev')?.addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderCalendar()});
    document.getElementById('calendar-next')?.addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderCalendar()});
    document.getElementById('calendar-today')?.addEventListener('click',()=>{month=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar()});
  }

  function renderShop(){
    if(page!=='shop')return;
    const grid=document.getElementById('shop-items'),empty=document.getElementById('shop-empty');
    if(!grid||!empty)return;
    const valid=products.filter(p=>p && p.published!==false && p.name && safePaymentUrl(p.checkout));
    grid.innerHTML=valid.map(p=>{
      const img=(typeof p.image==='string' && p.image.startsWith('assets/shop/') && ['.jpg','.jpeg','.png','.webp','.avif'].some(ext=>p.image.toLowerCase().endsWith(ext)) && !p.image.includes('..') && !p.image.includes('"') && !p.image.includes('<'))
        ? '<img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(languageVal(p.name))+'">' : '';
      return '<article class="shop-product">'+img+'<h2>'+esc(languageVal(p.name))+'</h2><p>'+esc(languageVal(p.description||''))+'</p>'
        +'<p class="shop-price">'+esc(p.price||'')+'</p><a class="btn" href="'+esc(safePaymentUrl(p.checkout))+'" rel="noopener noreferrer" target="_blank">'+esc(l('shopBuy'))+' ↗</a></article>';
    }).join('');
    empty.hidden=valid.length>0;
  }
  // Photo entries are authored in content/gallery.json, never injected as raw template syntax.
  function allowedGalleryImage(file){
    return typeof file==='string' &&
      /^assets\/gallery\/[a-z0-9_./ :()-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(file) &&
      !file.includes('..');
  }
  function renderGallery(){
    if(page!=='gallery')return;
    const grid=document.getElementById('gallery-grid');if(!grid)return;
    grid.innerHTML=galleryPhotos.filter(p=>allowedGalleryImage(p?.file)).map(p=>{
      const caption=languageVal(p.caption||p.alt||'') || p.file.split('/').pop().replace(/[-_]/g,' ').replace(/\.[^.]+$/,'');
      const album=String(p.album||p.file.split('/').slice(-2,-1)[0]||'');
      return `<figure class="gallery-item" data-album="${esc(album)}"><button class="gallery-open" type="button" aria-label="${esc(l('openPhoto'))}"><img loading="lazy" decoding="async" src="${esc(p.file)}" alt="${esc(caption)}"></button><figcaption>${esc(caption)}</figcaption></figure>`;
    }).join('');
  }
  function setupGallery(){
    if(page!=='gallery')return;
    const input=document.getElementById('gallery-filter'),figures=[...document.querySelectorAll('.gallery-item')];
    if(!input)return;
    const galleryControls=document.querySelector('.gallery-controls');
    if(galleryControls)galleryControls.hidden=figures.length===0;
    const previouslySelected=input.value;
    input.querySelectorAll('option:not([value="all"])').forEach(o=>o.remove());
    const albums=new Map(events.map(e=>[e.gallery,languageVal(e.name)]));
    figures.forEach(f=>{if(f.dataset.album&&!albums.has(f.dataset.album))albums.set(f.dataset.album,f.dataset.album.replaceAll('-',' '))});
    [...albums.entries()].forEach(([slug,name])=>{const opt=document.createElement('option');opt.value=slug;opt.textContent=name;input.appendChild(opt)});
    const q=new URLSearchParams(location.search).get('event') || previouslySelected || 'all';
    if([...input.options].some(o=>o.value===q))input.value=q;
    function filter(){
      let count=0;figures.forEach(f=>{const show=input.value==='all'||f.dataset.album===input.value;f.hidden=!show;if(show)count++});
      document.getElementById('gallery-empty').hidden=count>0;
    }
    input.onchange=()=>{const url=new URL(location.href);if(input.value==='all')url.searchParams.delete('event');else url.searchParams.set('event',input.value);history.replaceState(null,'',url);filter()};
    filter();
  }
  if(page==='gallery'){
    document.getElementById('gallery-grid')?.addEventListener('click',e=>{
      const btn=e.target.closest('.gallery-open');if(!btn)return;
      const img=btn.querySelector('img'),modal=document.getElementById('photo-modal');
      document.getElementById('photo-full').src=img.currentSrc||img.src;document.getElementById('photo-full').alt=img.alt;
      document.getElementById('photo-caption').textContent=btn.closest('figure')?.querySelector('figcaption')?.textContent || '';
      modal.hidden=false;document.body.classList.add('modal-open');document.getElementById('photo-close').focus();
    });
    function closeModal(){document.getElementById('photo-modal').hidden=true;document.body.classList.remove('modal-open')}
    document.getElementById('photo-close')?.addEventListener('click',closeModal);
    document.getElementById('photo-modal')?.addEventListener('click',e=>{if(e.target.id==='photo-modal')closeModal()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  }
  renderText(); setupGallery(); renderCalendar();
  Promise.all([
    loadJson('content/events.json'),
    loadJson('content/blog.json'),
    loadJson('content/gallery.json'),
    loadJson('content/gallery-albums.json'),
    loadJson('content/gallery-auto.json'),
    loadJson('content/shop.json')
  ]).then(([ev,po,photos,albums,autoPhotos,merch])=>{
    events=Array.isArray(ev)?ev:[];
    posts=Array.isArray(po)?po:[];
    products=Array.isArray(merch)?merch:[];
    // Both gallery workflows coexist:
    //   gallery.json          — manually captioned individual photographs
    //   gallery-albums.json   — an entire batch of pictures tied to one event
    // Preserve manual entries/captions if the same picture is also in a bulk album.
    const manual=Array.isArray(photos)?photos.filter(p=>p&&typeof p.file==='string'):[];
    const seen=new Set(manual.map(p=>p.file.toLowerCase()));
    const batch=[];
    if(Array.isArray(albums))for(const group of albums){
      if(!group||typeof group.album!=='string'||!Array.isArray(group.photos))continue;
      for(const file of group.photos){
        if(typeof file!=='string'||seen.has(file.toLowerCase()))continue;
        seen.add(file.toLowerCase());
        batch.push({file,album:group.album});
      }
    }
    // Jekyll finds all images in event folders during each GitHub Pages build.
    // Manual captions and existing album records are retained and deduplicated.
    if(Array.isArray(autoPhotos))for(const photo of autoPhotos){
      if(!photo||typeof photo.file!=='string'||typeof photo.album!=='string')continue;
      if(seen.has(photo.file.toLowerCase()))continue;
      seen.add(photo.file.toLowerCase());
      batch.push({file:photo.file,album:photo.album});
    }
    galleryPhotos=[...manual,...batch];
    renderHome();renderEvents();renderEventDetail();renderArtists();renderBlog();renderCalendar();renderGallery();renderShop();setupGallery();

  });
})();
