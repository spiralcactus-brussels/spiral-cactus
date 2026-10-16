// SpiralCactus member integration: public/browser-safe values only.
// Private keys and passwords must never be committed to a public repository.
window.SC_MEMBERS_CONFIG = {
  supabaseUrl: "https://ygeybkxvigippdtrgqej.supabase.co",
  supabasePublishableKey: "sb_publishable_q9Rlmw-2jJfsnrwisQdHQw_U4doIKnK",
  // Set to true only after disabling Confirm Email in Supabase and testing signup.
  registrationOpen: false,
  // Postpone newsletters and email-based password recovery until a real sender is ready.
  newsletterEnabled: false,
  emailRecoveryEnabled: false,
  // Optional Brevo iframe sign-up URL from https://sibforms.com/serve/...
  newsletterEmbedUrl: ""
};
