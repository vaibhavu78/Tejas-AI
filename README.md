# Tejas AI — GitHub Pages Edition

Static React + TypeScript + Tailwind app designed for GitHub Pages. Vercel, Supabase and server-only code have been removed.

## Local run
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## Push and deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Deploy Tejas AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```
Then open GitHub repository → **Settings → Pages → Source → GitHub Actions**. The included `.github/workflows/deploy-pages.yml` builds and publishes automatically.

## AI on the public link
GitHub Pages has no backend. The app calls the configured public HTTPS AI endpoint directly from the visitor's browser. Use an endpoint that permits browser CORS, such as OpenRouter:

```text
https://openrouter.ai/api/v1
```

A local URL such as `http://localhost:20128/v1` works only on the same local computer and cannot work from a public GitHub Pages link.

## Static-mode privacy
- Login profiles, chats, limits, selected model and API key are stored in that browser's localStorage.
- Different visitors cannot see each other's browser data.
- The first account in each browser becomes that browser's local admin.
- This is not a central multi-user admin/database system.
- The API Vault password is a UI convenience, not cryptographic security.
- Never embed a shared private API key in source code. Each user should add their own key.
