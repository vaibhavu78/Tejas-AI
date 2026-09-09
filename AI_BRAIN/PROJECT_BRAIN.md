# Tejas AI — Project Brain

## Fixed bugs
- Black screen after sending: a `useEffect` returned the result of `scrollIntoView`; React treated it as cleanup and threw `destroy is not a function`. Fixed with a block-body effect.
- Model mismatch: removed guessed model catalog; `/v1/models` is the source of truth, duplicates and `:batch` models are excluded for real-time chat.
- Slow model 502: chat proxy timeout increased; Agent Mode retries up to 8 available models.
- Authentication forwarding: backend proxy sends Bearer and API-key headers.

## Product decisions
- React + TypeScript + Tailwind + shadcn-compatible `src/components/ui` structure.
- Landing page opens a ChatGPT-style workspace.
- Model selection is persisted; dropdown scrolls to selected model and marks it green.
- Chat data is currently local-browser data, not secure multi-user cloud data.
- Vercel cannot connect to a user computer's localhost OmniRoute. Production requires a public HTTPS gateway.

## Security decisions
- Never commit live API keys, Supabase service keys, Razorpay secrets, session secrets, or encryption keys.
- Public production auth requires server-side sessions and database ownership checks.
- Name + phone + PIN does not verify phone ownership; OTP is recommended before production.
- Razorpay access must only be granted after server-side webhook signature verification.

## Do not regress
- Never return a Promise from a React effect.
- Never guess model IDs when a models endpoint exists.
- Never expose service-role/payment/admin secrets through `VITE_` variables.
- Never trust user IDs, prices, roles, token usage, or payment success from the client.

## Added production foundation
- Supabase schema for profiles, user-owned chats, encrypted-key records, payments and login attempts.
- Server-side mobile+PIN registration/login with bcrypt hashing, signed httpOnly sessions and exponential login backoff.
- Ownership-enforced chat list/save/delete APIs.
- Server-role protected admin user/chat/access APIs.
- Fixed-price ₹199 Razorpay order creation and signature-verified payment webhook.
- Login UI and authenticated app gate.

## Pending activation/hardening
- Add real Supabase/Razorpay environment values and run the migration.
- Implement encrypted user API-key vault operations (table exists; encryption route pending).
- Wire the current local chat UI to cloud chat CRUD APIs.
- Replace mobile+PIN with Phone OTP before public production.
- Add distributed rate limiting (Upstash recommended on Vercel); current login attempt control is database-backed.
- Complete admin dashboard UI and Razorpay checkout UI.
