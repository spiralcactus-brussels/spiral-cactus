// SpiralCactus member integration: public/browser-safe values only.
// Private keys and passwords must never be committed to a public repository.
window.SC_MEMBERS_CONFIG = {
  supabaseUrl: "https://ygeybkxvigippdtrgqej.supabase.co",
  supabasePublishableKey: "sb_publishable_q9Rlmw-2jJfsnrwisQdHQw_U4doIKnK",
  // Website form is enabled. In Supabase Authentication > Email, turn OFF
  // Confirm Email to allow immediate sign-in until email delivery is ready.
  // Supabase backend settings always decide if sign-up succeeds.
  registrationOpen: true,
  // Postpone newsletters and email-based password recovery until a real sender is ready.
  newsletterEnabled: false,
  emailRecoveryEnabled: false,
  // Optional Brevo iframe sign-up URL from https://sibforms.com/serve/...
  newsletterEmbedUrl: ""
};
