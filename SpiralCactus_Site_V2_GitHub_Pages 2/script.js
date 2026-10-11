
(() => {
  'use strict';
  const b=document.body;
  const switcher=document.getElementById('language');
  const dictionary=window.SPIRAL_TRANSLATIONS||{};
  let lang;
  try { lang=localStorage.getItem('spiral-language')||'en'; }
  catch(_){lang='en'}
  const applyLanguage=(value)=>{
    lang=value;
    document.documentElement.lang=value;
    document.querySelectorAll('[data-t]').forEach(el=>{
      const pair=dictionary[el.dataset.t];
      if(pair) el.textContent = value==='fr'?pair[1]:pair[0];
    });
    if(switcher){switcher.innerHTML=value==='fr'?'<strong>FR</strong> <span>/</span> EN':'FR <span>/</span> <strong>EN</strong>';}
    try{localStorage.setItem('spiral-language',value)}catch(_){ }
  };
  applyLanguage(lang);
  switcher?.addEventListener('click',()=>applyLanguage(lang==='en'?'fr':'en'));
  const menu=document.querySelector('.menu-button');
  const nav=document.getElementById('navigation');
  menu?.addEventListener('click',()=>{
    const open=nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded',String(open));
    b.classList.toggle('menu-open',open);
  });
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('is-open');b.classList.remove('menu-open');menu?.setAttribute('aria-expanded','false');
  }));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{ entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}) },{threshold:.075});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
  const ticketButton=document.getElementById('ticket-btn');
  // Once the featured date is in the past, replace the sales CTA with archive access.
  if(ticketButton && Date.now()>Date.parse('2026-10-17T07:00:00+02:00')) {
    ticketButton.href='gallery.html';ticketButton.removeAttribute('target');
    const setEnded=()=>ticketButton.textContent=lang==='fr'?'VOIR LES VISUELS ↗':'VIEW VISUALS ↗';
    setEnded();switcher?.addEventListener('click',setEnded);
  }
})();
