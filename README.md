# TradeLine Agency website

A responsive, one-page website for TradeLine Agency. It includes the missed-call problem section, live voice-demo entry point, WhatsApp notifications for incoming calls, spoken conversations in English, Malay, Chinese and Manglish, a three-step setup explanation, consultation-led pricing card, niche positioning and a Vercel-ready static build.

## Run locally

Requirements: Node.js 18 or newer.

1. Extract this folder.
2. For local voice-demo testing, copy `.env.example` to `.env.local` and fill in your Retell public key and agent ID. Keep `.env.local` private and do not upload it to GitHub or share it.
3. In a terminal opened in this folder, run:

   ```bash
   npm install
   npm run dev
   ```

4. Open **http://localhost:3000**.

The project has no npm runtime dependencies. `npm run build` creates the deployment-ready static output in `dist/`. The current light-mode art direction uses a translucent floating navigation bar, your supplied `logo.svg`, and a CSS-rendered 3D glass-form hero scene with slow movement and iridescent highlights. The current light-mode art direction uses a translucent floating navigation bar, your supplied `logo.svg`, and a CSS-rendered 3D glass-form hero scene with slow movement and iridescent highlights.

## Deploy free on Vercel without using the command line

1. Create a private GitHub repository in the GitHub website.
2. Upload the project files through GitHub's **Add file → Upload files** screen. Do **not** upload `.env.local`; `.gitignore` is set to keep it out of Git.
3. In Vercel, select **Add New → Project**, import that GitHub repository, then open the project's build settings.
4. Select the **Other** framework preset. Use `npm install` for Install Command, `npm run build` for Build Command and `dist` for Output Directory. `vercel.json` already specifies these settings.
5. In Vercel's project **Settings → Environment Variables**, add:
   - `RETELL_PUBLIC_KEY` — the Retell public key for the website widget.
   - `RETELL_AGENT_ID` — the existing voice agent ID.
   - `TRADECALL_PHONE` — `+60102688557` (configured for click-to-call).
   - `SITE_URL` — optional; set your custom domain as `https://your-domain` for canonical Open Graph URLs. Without it, the build uses the Vercel deployment URL.
6. Save the variables and redeploy. Open the live Vercel URL and test the demo over HTTPS.

## Retell setup checklist

In Retell's dashboard, open **Public Keys** and add both `localhost` (for local testing) and the deployed Vercel domain to the allowed domains list. The widget may not load if a domain is missing. The embed uses Retell's official website widget script with the supplied voice agent and public key.

The site is configured for Malaysia-wide service. Replace this positioning if the business serves a narrower territory. The receptionist is presented as speaking and listening in English, Malay, Chinese and Manglish, and sending a WhatsApp notification to the designated business number whenever a call comes in. The supplied phone number `+60102688557` is configured for click-to-call in the footer and microphone-error guidance. The footer now includes Terms & Conditions and Privacy Policy links that open your supplied Google Docs in a new tab.

## Visual design, motion and interactions

The page uses a bright, mostly white palette with black typography and cyan/lavender highlights. The navigation is a centered, translucent glass pill. The header and footer use the supplied `logo.svg`. The hero background is built from CSS 3D-style cubes, prisms, spheres, orbital rings, soft lighting, and slowly moving reflections; it does not depend on a remote animation library. The page also includes a staggered vertical fade-in on initial load, scroll-triggered section/card reveals, subtle hover lift effects, an animated call waveform, a softly pulsing demo visual, and a visible “Talk to our receptionist / Available 24/7” text overlay in the Retell floating launcher. The overlay leaves pointer events untouched so clicks pass through to the native Retell button. Motion is reduced for visitors whose device requests reduced motion.

## Asset and key note

The logo asset is copied from the supplied `logo.svg`. The hero 3D visual is CSS-rendered; the older HVAC rooftop photo remains in `public/images/` as a project asset but is no longer the hero centerpiece. No Gemini API key is stored in this project. Rotate the key that was shared in the chat before using it elsewhere.
