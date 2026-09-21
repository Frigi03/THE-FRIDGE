<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `ANTHROPIC_API_KEY` in [.env.local](.env.local) to your Anthropic API key
3. Run the app:
   `npm run dev`

## Testing on your phone

The dev server already listens on your whole LAN, not just `localhost`.
On the same Wi-Fi as your computer:

1. Find your computer's local IP (e.g. `192.168.1.23`) — `ipconfig getifaddr en0` on
   Mac, `hostname -I` on Linux, `ipconfig` on Windows.
2. On the phone, open `http://<that-ip>:3000`.

This works for everything **except the camera scan feature**: mobile browsers
only allow camera access on `localhost` or a secure (HTTPS) origin, and a
plain `http://192.168.x.x` address doesn't count. To test the camera too,
run `npm run dev:https` instead of `npm run dev` — it serves the same app
over HTTPS with a self-signed certificate, printing a `Network:` URL like
`https://192.168.1.23:3000`. Open that on the phone; the browser will warn
that the certificate isn't trusted (expected, it's self-signed) — tap
"Advanced" → "Proceed" to continue, then the camera permission prompt works
normally.

## ⚠️ Before deploying this publicly

The Anthropic API key is currently baked into the client-side JS bundle
(`vite.config.ts` + `dangerouslyAllowBrowser: true` in `services/claudeService.ts`).
This is fine for local development, but **anyone who opens the deployed
site's devtools can extract the key and use it at your expense**, with no
rate limiting.

Before putting this online, move the Anthropic calls behind a small
serverless backend (e.g. a Vercel/Cloudflare function) that holds the key
server-side and proxies requests from the client. Do not deploy the
current build with a real key set.
