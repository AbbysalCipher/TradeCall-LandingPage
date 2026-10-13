# TradeCall Agency website

A responsive, one-page website for TradeCall Agency. It includes the missed-call problem section, live voice-demo entry point, three-step setup explanation, consultation-led pricing card, niche positioning and a Vercel-ready static build.

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

The project has no npm runtime dependencies. `npm run build` creates the deployment-ready static output in `dist/`.

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

The site is configured for Malaysia-wide service. Replace this positioning if the business serves a narrower territory. The supplied phone number `+60102688557` is configured for click-to-call in the footer and microphone-error guidance. The footer now includes Terms & Conditions and Privacy Policy links that open your supplied Google Docs in a new tab.

## Motion and interactions

The page includes a staggered vertical fade-in on initial load, scroll-triggered section/card reveals, subtle hover lift and highlight effects for cards and calls-to-action, an animated call waveform, and a softly pulsing demo visual. Motion is disabled or reduced for visitors whose device requests reduced motion.

## Image note

The build environment could not resolve Google's Gemini API endpoint, so the page uses a generated HVAC rooftop visual as a fallback. No Gemini API key is stored in this project. Rotate the key that was shared in the chat before using it elsewhere.
