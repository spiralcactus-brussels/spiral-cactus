/* Member dashboard (Supabase RLS bookmarks, no ticket-provider impersonation).
   Saved events express interest only; past saves are not verified attendance. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const L = {
    en: {
      hello: "WELCOME BACK", upcoming:"UPCOMING", past:"PAST EVENT", saved:"SAVED",
      save:"SAVE EVENT +", remove:"REMOVE SAVED", tickets:"TICKETS ↗",
      emptyUpcoming:"No upcoming SpiralCactus events have been announced yet.",
      emptySaved:"Nothing saved yet. Save an upcoming event to keep it in your personal list.",
      emptyFuture:"Your saved upcoming events will appear here.",
      emptyArchive:"No past events to show yet.",
      noSaved:"You haven't saved any events yet.", 
      loading:"Loading your events…", loadError:"Events could not be loaded. Please refresh the page.",
      saveError:"Could not update your saved events. Please try again.",
      saveDone:"Event added to your personal list.",removeDone:"Event removed from your personal list.",
      historic:"Saved earlier · not proof of attendance",
      interested:"Saved for later · not a booking",
      poster:"Event poster", openShop:"OPEN TICKET SHOP ↗", viewEvents:"EXPLORE ALL EVENTS ↗"
    },
    fr: {
      hello:"BON RETOUR", upcoming:"À VENIR",past:"ÉVÉNEMENT PASSÉ",saved:"ENREGISTRÉ",
      save:"ENREGISTRER +",remove:"RETIRER",tickets:"BILLETS ↗",
      emptyUpcoming:"Aucun prochain événement SpiralCactus n'est annoncé pour le moment.",
      emptySaved:"Aucun événement enregistré. Ajoutez un événement à venir à votre liste personnelle.",
      emptyFuture:"Vos prochains événements enregistrés apparaîtront ici.",
      emptyArchive:"Aucun événement passé à afficher.",
      noSaved:"Vous n'avez encore enregistré aucun événement.",
      loading:"Chargement de vos événements…",loadError:"Impossible de charger les événements. Actualisez la page.",
      saveError:"Impossible de modifier vos événements enregistrés. Réessayez.",
      saveDone:"Événement ajouté à votre liste personnelle.",removeDone:"Événement retiré de votre liste.",
      historic:"Enregistré auparavant · ne prouve pas la présence",
      interested:"Enregistré pour plus tard · pas une réservation",
      poster:"Affiche de l'événement",openShop:"OUVRIR LA BILLETTERIE ↗",viewEvents:"VOIR LES ÉVÉNEMENTS ↗"
    },
    nl: {
      hello:"WELKOM TERUG",upcoming:"BINNENKORT",past:"VOORBIJ",saved:"BEWAARD",
      save:"EVENEMENT BEWAREN +",remove:"VERWIJDEREN",tickets:"TICKETS ↗",
      emptyUpcoming:"Er zijn momenteel geen nieuwe SpiralCactus-evenementen aangekondigd.",
      emptySaved:"Nog geen evenementen bewaard. Bewaar een aankomend evenement in je persoonlijke lijst.",
      emptyFuture:"Je bewaarde toekomstige evenementen verschijnen hier.",
      emptyArchive:"Nog geen voorbije evenementen beschikbaar.",
      noSaved:"Je hebt nog geen evenementen bewaard.",
      loading:"Je evenementen laden…",loadError:"Kan de evenementen niet laden. Ververs de pagina.",
      saveError:"Kan bewaarde evenementen niet aanpassen. Probeer opnieuw.",
      saveDone:"Evenement toegevoegd aan je lijst.",removeDone:"Evenement verwijderd uit je lijst.",
      historic:"Eerder bewaard · geen bewijs van aanwezigheid",
      interested:"Bewaard voor later · geen reservering",
      poster:"Evenementposter",openShop:"OPEN TICKETSHOP ↗",viewEvents:"BEKIJK EVENEMENTEN ↗"
    }
  };
  const locale = {en:"en-GB",fr:"fr-BE",nl:"nl-BE"};
  const lang = () => {
    try { const x=localStorage.getItem("sc-lang"); return L[x] ? x : "en"; }
    catch (_) { return "en"; }
  };
  const t = key => L[lang()][key];
  const text = (id,value) => { if ($(id)) $(id).textContent = value; };
  const node = (tag,cls,txt) => {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(txt!==undefined)el.textContent=txt;
    return el;
  };
  const show = (id,on) => { if($(id))$(id).hidden = !on; };
  let client=null, userId=null, events=[],saved=new Set(),loaded=false, generation=0;
  let selectedTab="overview", displayName="", busy=new Set(), handlersAdded=false, loadFailed=false;
  const eventName = e => typeof e.name==="string" ? e.name : (e.name?.[lang()] || e.name?.en || e.id);
  const validEvent = e => e && /^[a-z0-9][a-z0-9-]{0,99}$/.test(e.id) && /^\d{4}-\d{2}-\d{2}$/.test(e.date);
  const today = () => {
    const n=new Date();
    return [n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),String(n.getDate()).padStart(2,"0")].join("-");
  };
  const past = e => e.date < today();
  function dateLabel(e){
    const d=new Date(e.date+"T12:00:00");
    return isNaN(d.getTime()) ? e.date : new Intl.DateTimeFormat(locale[lang()],{day:"numeric",month:"short",year:"numeric"}).format(d);
  }
  const safePoster = str => {
    if(typeof str!=="string")return "";
    if(str.startsWith("assets/") && !str.includes("..") && !str.includes("\\") && !str.includes("<"))return str;
    try{const u=new URL(str);return u.protocol==="https:"?u.href:"";}
    catch(_){return "";}
  };
  const safeShop = str => {
    try {const u=new URL(str);return u.protocol==="https:"?u.href:"";}
    catch(_){return "";}
  };
  function feedback(message,error=false){
    const el=$("member-events-status");
    if(!el)return;
    el.textContent=message;
    el.dataset.state=error?"error":"success";
    el.hidden=!message;
  }
  function clear(nodeId){const el=$(nodeId);if(el)el.replaceChildren();return el;}
  function empty(container,message){
    const p=node("p","member-empty",message);
    container?.append(p);
  }
  function eventCard(e,mode){
    const card=node("article","member-event-card");
    const poster=safePoster(e.poster);
    if(poster){
      const img=node("img","member-event-poster");
      img.src=poster;img.alt=t("poster")+": "+eventName(e);
      img.loading="lazy";img.decoding="async";
      card.append(img);
    }
    const body=node("div","member-event-body");
    const tag=node("span","member-event-tag",past(e)?t("past"):t("upcoming"));
    body.append(tag,node("h4","member-event-name",eventName(e)));
    const details=node("p","member-event-meta",dateLabel(e)+(e.start?" · "+e.start:"")+(e.venue?" · "+e.venue:""));
    body.append(details);
    if(mode==="saved")body.append(node("p","member-event-note",past(e)?t("historic"):t("interested")));
    const actions=node("div","member-event-actions");
    const isSaved=saved.has(e.id);
    if((mode==="browse"&&!past(e))||mode==="saved"){
      const btn=node("button","btn member-save-button"+(isSaved?" member-saved":""),isSaved?t("remove"):t("save"));
      btn.type="button";
      btn.dataset.saveEventId=e.id;
      btn.disabled=busy.has(e.id);
      btn.setAttribute("aria-pressed",String(isSaved));
      actions.append(btn);
    }
    const shop=safeShop(e.ticket);
    if(shop&&!past(e)){
      const a=node("a","btn alt",t("openShop"));
      a.href=shop;a.rel="noopener noreferrer";a.target="_blank";
      actions.append(a);
    }
    if(actions.childNodes.length)body.append(actions);
    card.append(body);
    return card;
  }
  function list(id,data,mode,missing){
    const container=clear(id);
    if(!container)return;
    if(loadFailed){empty(container,t("loadError"));return;}
    if(!data.length){empty(container,missing);return;}
    for(const e of data)container.append(eventCard(e,mode));
  }
  function render(){
    if(!userId || !loaded)return;
    const sorted=events.slice().sort((a,b)=>a.date.localeCompare(b.date));
    const upcoming=sorted.filter(e=>!past(e));
    const previous=sorted.filter(past).reverse();
    const savedAll=sorted.filter(e=>saved.has(e.id));
    const futureSaved=savedAll.filter(e=>!past(e));
    text("member-greeting",t("hello")+(displayName?", "+displayName.toLocaleUpperCase(lang()):""));
    text("member-summary-saved",String(savedAll.length));
    text("member-summary-upcoming",String(futureSaved.length));
    list("member-upcoming-list",futureSaved,"saved",t("emptyFuture"));
    list("member-saved-list",savedAll,"saved",t("emptySaved"));
    list("member-discover-list",upcoming,"browse",t("emptyUpcoming"));
    list("member-archive-list",previous,"archive",t("emptyArchive"));
    setTab(selectedTab);
  }
  function setTab(which){
    selectedTab=["overview","events","tickets","profile"].includes(which)?which:"overview";
    document.querySelectorAll("[data-member-tab]").forEach(btn=>{
      const isOn=btn.dataset.memberTab===selectedTab;
      btn.classList.toggle("selected",isOn);
      btn.setAttribute("aria-selected",String(isOn));
      btn.tabIndex=isOn?0:-1;
    });
    for(const x of ["overview","events","tickets","profile"])show("member-panel-"+x,x===selectedTab);
  }
  async function saveEvent(id){
    if(!client||!userId||busy.has(id))return;
    const item=events.find(e=>e.id===id);
    if(!item)return;
    const wasSaved=saved.has(id);
    if(!wasSaved&&past(item))return;
    const current=userId;
    busy.add(id);render();
    try{
      const query=wasSaved
        ?client.from("member_saved_events").delete().eq("user_id",current).eq("event_id",id)
        :client.from("member_saved_events").insert({user_id:current,event_id:id});
      const {error}=await query;
      if(error)throw error;
      if(userId!==current)return;
      if(wasSaved)saved.delete(id);else saved.add(id);
      feedback(t(wasSaved?"removeDone":"saveDone"));
    }catch(error){
      console.error("Unable to save event",error);
      if(userId===current)feedback(t("saveError"),true);
    }finally{
      busy.delete(id);
      if(userId===current)render();
    }
  }
  function attach(){
    if(handlersAdded)return;
    handlersAdded=true;
    const tabs=Array.from(document.querySelectorAll("[data-member-tab]"));
    tabs.forEach((btn,index)=>{
      btn.addEventListener("click",()=>setTab(btn.dataset.memberTab));
      btn.addEventListener("keydown",evt=>{
        let next=index;
        if(evt.key==="ArrowRight")next=(index+1)%tabs.length;
        else if(evt.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;
        else if(evt.key==="Home")next=0;
        else if(evt.key==="End")next=tabs.length-1;
        else return;
        evt.preventDefault();
        setTab(tabs[next].dataset.memberTab);
        tabs[next].focus();
      });
    });
    $("member-dashboard")?.addEventListener("click",evt=>{
      const btn=evt.target.closest("[data-save-event-id]");
      if(btn)saveEvent(btn.dataset.saveEventId);
    });
    $("langselect")?.addEventListener("change",()=>{
      Promise.resolve().then(()=>{if(userId)render();});
    });
  }
  async function open(nextClient,user){
    if(!user?.id)return;
    attach();
    if(userId===user.id&&loaded){render();return;}
    const n=++generation;
    userId=user.id;client=nextClient;loaded=false;loadFailed=false;saved=new Set();busy.clear();displayName="";
    feedback(t("loading"));
    try{
      const [res,rows]=await Promise.all([
        fetch("content/events.json",{cache:"no-store"}),
        client.from("member_saved_events").select("event_id").eq("user_id",user.id)
      ]);
      if(!res.ok)throw new Error("Events could not be fetched");
      const catalog=await res.json();
      if(!Array.isArray(catalog))throw new Error("Invalid event catalogue");
      if(rows.error)throw rows.error;
      if(n!==generation||userId!==user.id)return;
      events=catalog.filter(validEvent);
      saved=new Set((rows.data||[]).map(x=>x.event_id));
      feedback("");
    }catch(error){
      console.error("Member dashboard failed to load",error);
      if(n!==generation||userId!==user.id)return;
      events=[];saved=new Set();loadFailed=true;feedback(t("loadError"),true);
    }finally{
      if(n===generation&&userId===user.id){loaded=true;render();}
    }
  }
  function close(){
    ++generation;userId=null;client=null;events=[];saved.clear();busy.clear();
    displayName="";loaded=false;loadFailed=false;feedback("");
    for(const id of ["member-upcoming-list","member-saved-list","member-discover-list","member-archive-list"])clear(id);
    selectedTab="overview";
  }
  function profile(name){
    displayName=String(name||"").slice(0,60);
    if(userId&&loaded)render();
  }
  window.SC_MEMBER_DASHBOARD={open,close,profile};
})();
