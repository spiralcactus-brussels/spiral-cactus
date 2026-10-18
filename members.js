/* SpiralCactus member accounts: Supabase Auth (browser publishable key only).
   Private records are protected in Supabase by row-level security.
   Email campaign delivery is separate (Brevo) and not simulated here. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const config = window.SC_MEMBERS_CONFIG || {};
  const T = {
    en: {registrationClosed:"Account creation is not active yet. Existing members can sign in.", loading:"Checking membership availability…", unavailable:"The account service is temporarily unavailable.", signupDone:"Registration submitted, but you are not signed in yet. If you are asked to confirm your email, verification is still enabled in Supabase.", signedIn:"Welcome to the SpiralCactus community.", signInError:"Unable to sign in. Check your email and password.", checkEmail:"If this address has an account, a password-reset email will be sent.", needEmail:"Please enter your email address first.", resetDone:"Password updated. You're signed in.", saved:"Your profile has been saved.", profileError:"Your account is active, but profile settings are not available yet. Please contact us.", tryAgain:"Something went wrong. Please try again.", signedOut:"You have signed out.", accountReady:"Your SpiralCactus account is ready."},
    fr: {registrationClosed:"La création de compte n’est pas encore active. Les membres existants peuvent se connecter.", loading:"Vérification du service membres…", unavailable:"Le service de comptes est temporairement indisponible.", signupDone:"Inscription envoyée, mais votre session n’est pas encore ouverte. Si une confirmation e-mail est requise, elle est encore activée dans Supabase.", signedIn:"Bienvenue dans la communauté SpiralCactus.", signInError:"Connexion impossible. Vérifiez votre adresse et votre mot de passe.", checkEmail:"Si un compte existe pour cette adresse, un e-mail de réinitialisation sera envoyé.", needEmail:"Indiquez d'abord votre adresse e-mail.", resetDone:"Mot de passe modifié. Vous êtes connecté.", saved:"Votre profil a été enregistré.", profileError:"Votre compte est actif, mais votre profil est temporairement indisponible. Contactez-nous.", tryAgain:"Une erreur est survenue. Réessayez.", signedOut:"Vous avez été déconnecté.", accountReady:"Votre compte SpiralCactus est prêt."},
    nl: {registrationClosed:"Registratie is nog niet actief. Bestaande leden kunnen inloggen.", loading:"Ledenservice controleren…", unavailable:"De accountdienst is tijdelijk niet beschikbaar.", signupDone:"Registratie verzonden, maar je bent nog niet aangemeld. Als een e-mailbevestiging nodig is, staat die nog aan in Supabase.", signedIn:"Welkom bij SpiralCactus.", signInError:"Inloggen is mislukt. Controleer je e-mail en wachtwoord.", checkEmail:"Als dit e-mailadres een account heeft, sturen we een herstellink.", needEmail:"Vul eerst je e-mailadres in.", resetDone:"Wachtwoord bijgewerkt. Je bent ingelogd.", saved:"Je profiel is opgeslagen.", profileError:"Je account is actief, maar profielinstellingen zijn nog niet beschikbaar. Neem contact op.", tryAgain:"Er ging iets mis. Probeer het opnieuw.", signedOut:"Je bent uitgelogd.", accountReady:"Je SpiralCactus-account is klaar."}
  };
  const lang = () => {
    let value = "en";
    try { value = localStorage.getItem("sc-lang") || "en"; } catch (_) {}
    return T[value] ? value : "en";
  };
  const tr = id => T[lang()][id];
  const words = id => (window.SC_TRANSLATIONS && window.SC_TRANSLATIONS[lang()] && window.SC_TRANSLATIONS[lang()][id]) || id;
  const show = (id, visible) => { const e = $(id); if (e) e.hidden = !visible; };
  function status(id, message, type) {
    const e = $(id);
    if (!e) return;
    e.textContent = message || "";
    e.dataset.state = type || "success";
    e.hidden = !message;
  }
  const safeUrl = value => {
    try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "sibforms.com" ? url.href : null; } catch (_) { return null; }
  };
  const embed = safeUrl(config.newsletterEmbedUrl);
  if (embed) {
    const frame = document.createElement("iframe");
    frame.src = embed;
    frame.title = "SpiralCactus newsletter subscription";
    frame.loading = "lazy";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    $("member-newsletter-embed").append(frame);
    show("member-newsletter-embed", true);
    show("member-newsletter-pending", false);
  }
  const domain = String(config.supabaseUrl || "").trim();
  const key = String(config.supabasePublishableKey || "").trim();
  const validConfig = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(domain) && key.length > 30;
  if (!validConfig) {
    show("member-loading", false);
    show("member-wait", true);
    return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    $("member-loading").textContent = tr("unavailable");
    return;
  }
  const client = window.supabase.createClient(domain, key, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  // The website shows registration; Supabase Auth remains the authority that
  // accepts or rejects new users based on its project settings.
  const registrationOpen = config.registrationOpen === true;
  let mode = "signup";
  let recovering = false;
  let activeUser = null;
  let updating = false;
  function authMode(next) {
    const signingUp = next === "signup" && registrationOpen;
    mode = signingUp ? "signup" : "signin";
    $("member-tab-signup").disabled = !registrationOpen;
    $("member-tab-signup").title = registrationOpen ? "" : tr("registrationClosed");
    show("member-name-wrap", signingUp);
    show("member-optin-wrap", signingUp && config.newsletterEnabled === true);
    show("member-forgot", !signingUp && config.emailRecoveryEnabled === true);
    $("member-tab-signup").classList.toggle("selected", signingUp);
    $("member-tab-signin").classList.toggle("selected", !signingUp);
    $("member-tab-signup").setAttribute("aria-pressed", String(signingUp));
    $("member-tab-signin").setAttribute("aria-pressed", String(!signingUp));
    $("member-password").autocomplete = signingUp ? "new-password" : "current-password";
    $("member-submit").textContent = words(signingUp ? "memberSubmitSignup" : "memberSubmitSignin");
    status("member-auth-status", registrationOpen ? "" : tr("registrationClosed"), registrationOpen ? "success" : "error");
  }
  $("member-tab-signup").addEventListener("click", () => authMode("signup"));
  $("member-tab-signin").addEventListener("click", () => authMode("signin"));
  $("langselect")?.addEventListener("change", () => authMode(mode));
  function resetView() {
    recovering = true;
    show("member-loading", false);
    show("member-wait", false);
    show("member-access", false);
    show("member-dashboard", false);
    show("member-recovery", true);
    status("member-shared-status", "");
  }
  async function refresh() {
    if (recovering) return;
    let user = null;
    try {
      // getUser() without a session can return "Auth session missing" and must not
      // be mistaken for a server outage; unauthenticated visitors see Sign in.
      const {data: sessionData, error: sessionError} = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session) {
        // Always verify an existing session with the Auth server before reading profile data.
        const {data, error} = await client.auth.getUser();
        if (error) throw error;
        user = data.user;
      }
    } catch (_) {
      show("member-loading", false);
      show("member-wait", true);
      $("member-wait").textContent = tr("unavailable");
      return;
    }
    activeUser = user || null;
    show("member-loading", false);
    show("member-wait", false);
    show("member-recovery", false);
    show("member-access", !user);
    show("member-dashboard", !!user);
    document.body.classList.toggle("member-logged-in", !!user);
    if (!user) window.SC_MEMBER_DASHBOARD?.close();
    show("member-profile-optin-wrap", !!user && config.newsletterEnabled === true);
    if (user) {
      $("member-identity").textContent = user.email || "";
      window.SC_MEMBER_DASHBOARD?.open(client, user);
      let profile = null;
      const {data, error} = await client.from("member_profiles").select("display_name, newsletter_opt_in, created_at").eq("id", user.id).maybeSingle();
      if (error || !data) { status("member-shared-status", tr("profileError"), "error"); return; }
      profile = data;
      window.SC_MEMBER_DASHBOARD?.profile(profile.display_name || "");
      $("member-profile-name").value = profile.display_name || "";
      $("member-profile-optin").checked = !!profile.newsletter_opt_in;
      $("member-since").textContent = new Intl.DateTimeFormat(lang()==="fr"?"fr-BE":lang()==="nl"?"nl-BE":"en-GB",{day:"numeric",month:"long",year:"numeric"}).format(new Date(profile.created_at));
    }
  }
  $("member-auth-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (updating || !event.currentTarget.reportValidity()) return;
    updating = true;
    const button = $("member-submit");
    button.disabled = true;
    const email = $("member-email").value.trim();
    const password = $("member-password").value;
    const name = $("member-name").value.trim().slice(0,60);
    status("member-auth-status", "");
    try {
      if (mode === "signup" && !registrationOpen) {
        status("member-auth-status", tr("registrationClosed"), "error");
        return;
      }
      if (mode === "signup") {
        const {data, error} = await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{display_name:name,newsletter_opt_in:$("member-optin").checked}}});
        if (error) throw error;
        if (data.session) { await refresh(); status("member-shared-status", tr("accountReady")); }
        else status("member-auth-status",tr("signupDone"));
        $("member-password").value = "";
      } else {
        const {error} = await client.auth.signInWithPassword({email,password});
        if (error) throw error;
        $("member-password").value = "";
        await refresh();
        status("member-shared-status",tr("signedIn"));
      }
    } catch (error) {
      status("member-auth-status", error?.message || (mode==="signin" ? tr("signInError") : tr("tryAgain")), "error");
    } finally { button.disabled = false; updating = false; }
  });
  $("member-forgot").addEventListener("click", async () => {
    const email = $("member-email").value.trim();
    if (!email || !$("member-email").checkValidity()) { status("member-auth-status", tr("needEmail"),"error"); $("member-email").focus(); return; }
    const button = $("member-forgot");
    button.disabled = true;
    try {
      const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if (error) throw error;
      status("member-auth-status",tr("checkEmail"));
    } catch (error) { status("member-auth-status",error?.message || tr("tryAgain"),"error"); }
    finally { button.disabled = false; }
  });
  $("member-recovery-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (updating || !event.currentTarget.reportValidity()) return;
    updating = true;
    const button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true;
    try {
      const {error} = await client.auth.updateUser({password:$("member-new-password").value});
      if (error) throw error;
      $("member-new-password").value = "";
      recovering = false;
      await refresh();
      status("member-shared-status",tr("resetDone"));
    } catch (error) { status("member-shared-status",error?.message || tr("tryAgain"),"error"); }
    finally { updating = false; button.disabled = false; }
  });
  $("member-profile-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (!activeUser || updating || !event.currentTarget.reportValidity()) return;
    const name = $("member-profile-name").value.trim().slice(0,60);
    updating = true;
    const button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true;
    try {
      const updates = {display_name:name};
      if (config.newsletterEnabled === true) updates.newsletter_opt_in = $("member-profile-optin").checked;
      const {error} = await client.from("member_profiles").update(updates).eq("id",activeUser.id);
      if (error) throw error;
      window.SC_MEMBER_DASHBOARD?.profile(name);
      status("member-shared-status",tr("saved"));
    } catch (error) { status("member-shared-status",error?.message || tr("tryAgain"),"error"); }
    finally { updating = false; button.disabled = false; }
  });
  $("member-signout").addEventListener("click", async () => {
    const {error} = await client.auth.signOut();
    if (error) { status("member-shared-status",error.message,"error"); return; }
    activeUser = null;
    window.SC_MEMBER_DASHBOARD?.close();
    await refresh();
    status("member-auth-status",tr("signedOut"));
  });
  client.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") { resetView(); return; }
    if (!recovering && (event==="SIGNED_IN" || event==="SIGNED_OUT")) Promise.resolve().then(refresh);
  });
  authMode(registrationOpen ? "signup" : "signin");
  refresh();
})();
