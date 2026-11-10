# TradeLine Agency website

A responsive one-page website for TradeLine Agency, built as a static site for Vercel. It includes the missed-call calculator, 14-day appointment-guarantee hero, WhatsApp notification and multilingual messaging, PDPA-conscious setup section, legal links, cookie preferences, and a custom branded browser voice assistant.

## Run locally

Requirements: Node.js 18 or newer.

1. Extract this folder.
2. For local voice-demo testing, create `.env.local` in this folder with your existing public configuration values:

   ```env
   RETELL_PUBLIC_KEY=your_retell_public_key
   RETELL_AGENT_ID=your_existing_voice_agent_id
   TRADECALL_PHONE=+60102688557
   ```

3. In a terminal opened in this folder, run:

   ```bash
   npm install
   npm run dev
   ```

4. Open **http://localhost:3000**. Microphone access works on `localhost` and on deployed HTTPS domains.

The project has no npm runtime dependencies. The custom voice UI loads Retell's pinned `retell-client-js-sdk` 3.0.2 browser module from the ESM CDN. `npm run build` creates the deployment-ready static output in `dist/`.

## Retell custom voice assistant

The website no longer embeds Retell's hosted website widget. It uses a fully custom TradeLine-branded launcher and call panel titled **TradeLine 24/7 Call Assistant**, powered by the current `RetellClient` Web SDK API:

- It uses the existing `RETELL_PUBLIC_KEY` and `RETELL_AGENT_ID` environment variables.
- A browser call is created only after a visitor clicks **Start voice call**. The microphone permission prompt therefore follows a clear user action.
- Visitors can mute/unmute their microphone and end the call.
- The panel handles connecting/live/ended states, common microphone permission and missing-device errors, and Retell key/domain errors.
- The interface includes a speaking animation and repeats the existing brief welcome nudge until dismissed.
- The interface does not collect or persist a transcript.

The browser SDK uses a **Retell public key**, not a private Retell API key. Do not put a Retell private API key in frontend files. Restrict the public key in Retell's Public Keys settings to `localhost` for local testing and your deployed Vercel domain (plus any custom production domain). Calls will be rejected if the domain is not allowed. If reCAPTCHA v3 protection is enabled for that public key, a fresh reCAPTCHA token must also be integrated into the `createWebCall` request; this project does not currently implement that token flow.

SDK source and current API reference: https://github.com/RetellAI/retell-client-js-sdk

## Deploy free on Vercel without using the command line

1. Create or open your existing GitHub repository.
2. Upload the project files through GitHub's **Add file → Upload files** screen. Do **not** upload `.env.local`; `.gitignore` keeps it out of Git.
3. In Vercel, import the repository or use the existing project.
4. Select the **Other** framework preset. Use `npm install` for Install Command, `npm run build` for Build Command and `dist` for Output Directory. `vercel.json` already specifies these settings.
5. In Vercel's project **Settings → Environment Variables**, keep these values configured for Production (and Preview if desired):
   - `RETELL_PUBLIC_KEY` — your Retell public key.
   - `RETELL_AGENT_ID` — your existing voice agent ID.
   - `TRADECALL_PHONE` — `+60102688557`.
   - `SITE_URL` — optional; set your custom domain as `https://your-domain` for canonical Open Graph URLs. Without it, the build uses the Vercel deployment URL.
6. Save changes and redeploy. Open the live Vercel URL over HTTPS and test the voice assistant.

## Vercel Web Analytics

The plain-HTML Vercel Web Analytics snippet is included in `index.html`:

```html
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

Enable Web Analytics in the Vercel project before deploying. Vercel provisions its analytics route after the next deployment.

## Site design and features

- Mostly white light-mode styling with black typography and cyan/lavender accents.
- Translucent floating navigation and supplied `logo.svg` branding.
- CSS-rendered 3D glass-form hero scene, staggered page entrance, scroll reveals and hover effects.
- Missed Call Revenue Calculator with defaults of 5 missed calls/day, 26 working days/month, 10 calls per paying customer and RM1,200 average job revenue.
- Hero offer: 3 booked service appointments within the first 14 days for eligible Selangor contractors, or the onboarding fee is refunded. Publish clear written guarantee terms before making the offer live.
- WhatsApp notification feature and conversations in English, Malay, Chinese and Manglish.
- PDPA-conscious data-handling messaging, Cookie Consent banner with accept/reject/customize options, saved preferences and footer Cookie Settings control.
- Footer links to Terms & Conditions, Privacy Policy and Cookie Policy Google Docs.

The page is positioned for Malaysian trades businesses. The privacy section does not promise blanket legal compliance; actual PDPA obligations depend on the deployment's data handling and business practices.

## Configuration and security

`.env.local` is only for local development and is excluded from Git. The build injects the Retell **public** key, voice agent ID and business phone into `runtime-config.js`; these values are intentionally client-visible. Keep any private Retell API key, Gemini key or other secret off the frontend and out of the repository. Rotate any secret key previously shared in chat.
