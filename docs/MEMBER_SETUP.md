# SpiralCactus — activate member accounts and newsletter

The live website remains on GitHub Pages. Membership authentication requires an external secure provider: Supabase Auth. The members page is intentionally **not accepting credentials** until the configuration below is complete.

## 1. Create Supabase project (free tier)

1. Open https://supabase.com/dashboard and create a free project for SpiralCactus.
2. In the project's SQL Editor, execute the contents of \`supabase/members.sql\` once. The SQL creates member profiles, email-consent timestamps and row-level security.
3. In **Authentication → Providers → Email**, leave email confirmation **enabled**. Consider CAPTCHA / rate-limit configuration as your audience grows.
4. Under **Authentication → URL Configuration**, set **Site URL** to:
   \`https://spiralcactus-brussels.github.io/spiral-cactus/members.html\`
5. Add this exact **Redirect URL**:
   \`https://spiralcactus-brussels.github.io/spiral-cactus/members.html\`
   When \`spiralcactus.be\` has been registered and connected, also add \`https://spiralcactus.be/members.html\` and change Site URL to it.

## 2. Activate client configuration

In \`members-config.js\`, set:
- \`supabaseUrl\`: Project URL from Project Settings / API (for example \`https://YOUR-PROJECT.supabase.co\`).
- \`supabasePublishableKey\`: the project's **publishable** key (or legacy anon key if needed).

The publishable key is designed to be exposed to the browser. **Never put service_role, secret API keys, database password or SMTP credentials in GitHub.** The SQL policies are required before publishing the configuration.

## 3. Test before promoting publicly

Create a test account on \`members.html\`, confirm the email, sign in, edit the display name and newsletter preference, sign out, reset the password. Confirm one test account cannot read or change another's profile. Check spam folders and email sending limits. **Free-tier outbound Auth emails can be rate-limited**; set up appropriate SMTP for production volume.

## 4. Newsletter delivery is separate

An account's optional newsletter preference is stored in the protected member profile but **is not automatically a Brevo subscription**. To launch independent newsletter sign-up:

1. Register for Brevo (https://www.brevo.com/) and create an email sign-up form with GDPR fields and double opt-in.
2. In Brevo copy the **iframe form URL** starting \`https://sibforms.com/serve/...\`.
3. Enter that URL in \`members-config.js\` as \`newsletterEmbedUrl\`. The page will display the embedded Brevo registration form.
4. Configure SPF/DKIM/DMARC and the \`@spiralcactus.be\` sending identity in Brevo once the domain is purchased. Send a test email to yourself.
5. Do not automatically import account holders into marketing lists unless the consent/notice covers this and an appropriate auditable subscription workflow is in place.

## 5. Discounts / early access

Member accounts do **not** directly create discounted tickets. Set up any applicable promotional ticket codes in WeTicket and communicate codes only to eligible members through an approved, secure distribution method. Do not embed supposedly "member-only" codes in public JavaScript or JSON.

## Privacy and administration

Keep only necessary data. Add a project-specific privacy policy detailing the controller/contact email, Supabase and Brevo as processors, purpose, retention, rights requests and unsubscribe handling before launching real registrations. Do not use GitHub as a database. Admin editing of members is through the Supabase dashboard, not Pages CMS.
