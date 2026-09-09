# Tejas AI — Complete Project Explanation

## 1. Project क्या है?

**Tejas AI** एक multi-model AI chat application है। User account बनाकर chat कर सकता है, OmniRoute/OpenRouter से models load कर सकता है, files/images/code attach कर सकता है, AI-generated code copy कर सकता है और HTML का preview/download कर सकता है।

Project में तीन मुख्य layers हैं:

```text
┌──────────────────────────────────────────────┐
│ Frontend: React + TypeScript + Tailwind CSS  │
│ Landing, Login, Chat, Model UI, Admin modal  │
└──────────────────────┬───────────────────────┘
                       │ HTTPS / JSON
                       ▼
┌──────────────────────────────────────────────┐
│ Backend: Vercel Serverless Functions         │
│ Auth, Chats, Admin, Payment, AI Proxy         │
└───────────────┬──────────────────┬───────────┘
                │                  │
                ▼                  ▼
┌─────────────────────────┐  ┌──────────────────────┐
│ Supabase PostgreSQL     │  │ OmniRoute/OpenRouter │
│ Users, chats, payments  │  │ Models + AI response │
└─────────────────────────┘  └──────────────────────┘
                │
                ▼
       ┌──────────────────┐
       │ Razorpay         │
       │ ₹199 Pro payment │
       └──────────────────┘
```

---

## 2. Technology stack

| Technology | काम |
|---|---|
| React | User interface और components |
| TypeScript | Type safety और development errors कम करना |
| Tailwind CSS | Styling और responsive layout |
| Vite | Frontend development/build tool |
| Lucide React | Icons |
| Vercel Functions | Server-side APIs |
| Supabase | PostgreSQL database |
| bcryptjs | User PIN hash करना |
| jose | Signed JWT session बनाना |
| Razorpay | ₹199 Pro payment |
| OmniRoute/OpenRouter | AI models और chat completions |

---

## 3. Project folder structure

```text
tejas-ai/
├── src/
│   ├── components/ui/
│   │   └── bolt-style-chat.tsx  # Main landing और chat UI
│   ├── config/
│   │   └── omniroute.ts         # Local AI configuration template
│   ├── auth-gate.tsx            # Login/register screen
│   ├── demo.tsx                 # AuthGate के अंदर main app
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind और animations
│
├── api/
│   ├── _lib/core.js             # DB, JWT, cookies, safe errors
│   ├── auth/[action].js         # Register/login/me/logout
│   ├── chats/[action].js        # Chat save/list/delete
│   ├── admin/[action].js        # Admin users/chats/credits
│   ├── payments/[action].js     # Razorpay order/webhook
│   └── omniroute/[action].js    # Production AI proxy
│
├── supabase/
│   └── schema.sql               # Database tables और RLS
├── AI_BRAIN/PROJECT_BRAIN.md     # Project decisions और bug memory
├── SECURITY_AUDIT.md             # Security status/checklist
├── .env.example                  # Environment variable template
├── vercel.json                   # Deployment और security headers
├── package.json                  # Dependencies और scripts
└── vite.config.ts                # Vite config और local proxy
```

---

## 4. Frontend flow

```text
User website खोलता है
        │
        ▼
AuthGate /api/auth/me call करता है
        │
   ┌────┴─────┐
   │          │
Session है   Session नहीं है
   │          │
   ▼          ▼
Tejas App   Login/Register form
              │
              ▼
      Mobile + PIN submit
              │
              ▼
     Server verification
              │
              ▼
       Signed cookie set
              │
              ▼
         Tejas App open
```

### `main.tsx`

React application को HTML के `#root` element में mount करता है।

### `demo.tsx`

```tsx
<AuthGate>
  <BoltStyleChat />
</AuthGate>
```

इसका अर्थ: authenticated user ही main Tejas UI देख सकता है।

### `auth-gate.tsx`

- `/api/auth/me` से existing session check करता है।
- Session नहीं हो तो login/register form दिखाता है।
- Successful login के बाद app render करता है।
- Logout cookie clear करता है।

---

## 5. Authentication कैसे काम करता है?

### Registration

```text
Name + Mobile + PIN
        │
        ▼
Server strict validation
        │
        ▼
bcrypt.hash(PIN, 12 rounds)
        │
        ▼
Supabase profiles table
        │
        ▼
Signed JWT session
        │
        ▼
HttpOnly Secure cookie
```

PIN plain text में database में store नहीं होता। केवल hash store होता है।

### Login

```text
Mobile + PIN
      │
      ▼
Mobile से profile find
      │
      ▼
bcrypt.compare(PIN, hash)
      │
   ┌──┴───┐
Match    Wrong
  │        │
Cookie   Failed attempt count
  │        │
Login    Exponential backoff
```

### Session cookie

```text
HttpOnly  = JavaScript cookie नहीं पढ़ सकता
Secure    = HTTPS पर ही send होगी
SameSite  = CSRF risk कम होता है
Max-Age   = 7 days
```

### Important limitation

Mobile + PIN phone ownership verify नहीं करता। Production security के लिए SMS OTP बेहतर है।

---

## 6. Database design

```text
profiles
  │ 1
  ├─────────── * chats
  │
  ├─────────── 1 user_api_keys
  │
  └─────────── * payments
```

### `profiles`

```text
id
name
mobile (unique)
pin_hash
role: user/admin
plan: free/pro
admin_ai_enabled
credit_limit
credits_used
created_at
updated_at
```

### `chats`

```text
id
user_id → profiles.id
title
messages (JSON)
created_at
updated_at
```

### `user_api_keys`

User की encrypted AI API key रखने के लिए table structure। Encryption routes अभी pending हैं।

### `payments`

```text
user_id
razorpay_order_id
razorpay_payment_id
amount_paise = 19900
status
paid_at
```

### `login_attempts`

Repeated wrong login attempts और temporary blocking track करता है।

---

## 7. User data isolation

Frontend से `userId` लेकर blindly database query नहीं की जाती। Server signed session से user ID निकालता है:

```text
Request cookie
     │
     ▼
JWT signature verify
     │
     ▼
Trusted user ID
     │
     ▼
WHERE user_id = session.userId
```

इससे user URL/request body में दूसरे user का ID डालकर उसकी chats नहीं देख सकता। इसे IDOR protection कहते हैं।

---

## 8. AI model detection

```text
Admin/User API URL + key add करता है
                │
                ▼
GET /api/omniroute/models
                │
                ▼
Server proxy Authorization header लगाता है
                │
                ▼
GET AI_GATEWAY/v1/models
                │
                ▼
Model IDs normalize + duplicate remove
                │
                ▼
:batch models real-time dropdown से remove
                │
                ▼
Dropdown में API से आए models
```

App model names invent नहीं करता। AI gateway की `/v1/models` response source of truth है।

### Selected model memory

Selected model ID browser storage में save होती है। Dropdown दोबारा खुलने पर:

- वही model selected रहता है।
- Green dot/tick दिखाई देता है।
- List उसी model तक automatically scroll होती है।

---

## 9. Agent Mode

```text
User prompt
   │
   ▼
Selected model try
   │
   ├── Success → answer दिखाओ, model working mark करो
   │
   └── Failure → next available model
                     │
                     ▼
               अधिकतम 8 models
```

Agent Mode temporary provider failure, invalid chat model या rate limits में fallback देता है।

लेकिन अगर OmniRoute endpoint key ही invalid है, सभी models `401 Unauthorized` देंगे। Code invalid credentials bypass नहीं कर सकता।

---

## 10. AI chat request

Frontend request:

```json
{
  "model": "selected-model-id",
  "messages": [
    { "role": "system", "content": "Tejas instructions" },
    { "role": "user", "content": "User prompt" }
  ],
  "stream": false,
  "max_tokens": 2048
}
```

Backend proxy:

```http
Authorization: Bearer API_KEY
X-API-Key: API_KEY
Content-Type: application/json
```

Target:

```text
POST {BASE_URL}/v1/chat/completions
```

Response parser अलग formats support करता है:

```text
choices[0].message.content
choices[0].text
output_text
response
content
```

---

## 11. Black screen bug क्या था?

पुराना code:

```tsx
useEffect(() => element.scrollIntoView(), [messages])
```

कुछ environment में `scrollIntoView()` Promise return कर रहा था। React ने Promise को cleanup function समझा। Unmount/update पर React ने Promise को function की तरह call किया:

```text
TypeError: destroy is not a function
```

सही code:

```tsx
useEffect(() => {
  element?.scrollIntoView({ behavior: 'smooth' })
}, [messages])
```

Block body कुछ return नहीं करती, इसलिए React crash नहीं करता।

---

## 12. File, image और code upload

```text
Plus button
  ├── Upload file
  ├── Add image
  └── Import code
```

- Text/code file `FileReader.readAsText()` से पढ़ी जाती है।
- Image `FileReader.readAsDataURL()` से multimodal `image_url` content बनाती है।
- Attachment chip filename दिखाती है।
- User send करने से पहले attachment remove कर सकता है।
- Maximum four client attachments रखे जाते हैं।

Production में server-side MIME/magic-byte validation और object storage अभी required है। Client validation को security boundary नहीं मानना चाहिए।

---

## 13. Code copy और HTML preview

AI fenced code block देता है:

````text
```html
<!doctype html>
...
```
````

UI parser language और code अलग करता है।

### Buttons

- **Copy** → केवल code clipboard में।
- **Copy response** → पूरा AI response।
- **Copy prompt** → user का prompt।
- **Preview** → HTML नए isolated document/tab में render।
- **Download** → Blob बनाकर `.html` file download।

```text
HTML string
   │
   ▼
new Blob([html], {type: 'text/html'})
   │
   ▼
URL.createObjectURL(blob)
   │
   ├── Preview tab
   └── Download anchor
```

---

## 14. Prompt Specialist

System prompt short request को internally improve करने के लिए model को instruct करता है।

User:

```text
restaurant website banao
```

Tejas internally consider करता है:

```text
Responsive layout
Hero section
Menu cards
Reservation flow
Animations
Accessibility
Complete runnable output
```

फिर user को final useful result देता है। HTML माँगने पर complete standalone HTML fenced block में देने की instruction है।

---

## 15. Chat history

Prototype UI अभी browser local storage में current chat history भी रखती है। Secure production API अलग उपलब्ध है:

```text
GET    /api/chats/list
POST   /api/chats/save
DELETE /api/chats/delete?id=CHAT_ID
```

Production finalization में UI को local storage से पूरी तरह Supabase chat APIs पर switch करना pending है। यह जरूरी है ताकि अलग device पर history मिले और users का data server-side isolated रहे।

---

## 16. Admin system

Admin APIs signed session की role check करती हैं:

```text
Session → role === admin?
               │
       ┌───────┴────────┐
       │                │
      Yes              No
       │                │
Admin endpoint       403 Forbidden
```

Available backend operations:

```text
GET  /api/admin/users
GET  /api/admin/chats?userId=...
POST /api/admin/usage
```

Admin user-wise:

- Name/mobile देख सकता है।
- Plan और usage देख सकता है।
- Admin AI access enable/disable कर सकता है।
- Credit limit set कर सकता है।
- Chat metadata देख सकता है।

Full visual admin dashboard अभी pending है। पुराना hidden client PIN production authorization नहीं है; real authorization server role से होती है।

---

## 17. Razorpay ₹199 payment

```text
User Buy Pro दबाता है
        │
        ▼
POST /api/payments/create
        │
        ▼
Server amount fix करता है: ₹199
        │
        ▼
Razorpay order
        │
        ▼
User payment
        │
        ▼
Razorpay signed webhook
        │
        ▼
Server HMAC signature verify
        │
   ┌────┴─────┐
 Valid      Invalid
   │           │
plan=pro     Reject 401
```

Client से price accept नहीं होता। Server fixed `19900 paise` इस्तेमाल करता है। इससे कोई browser request edit करके ₹1 payment नहीं कर सकता।

Razorpay checkout UI अभी pending है; order और webhook backend foundation मौजूद है।

---

## 18. Security controls

### Implemented

- PIN hashing
- Signed session
- HttpOnly/Secure/SameSite cookies
- Database ownership filters
- Admin role checks
- Login backoff
- Generic client errors + correlation IDs
- `.env` ignored by Git
- Security headers
- HSTS
- CSP
- Frame denial
- MIME sniffing protection
- Razorpay signature verification
- Fixed server-side payment amount
- Dependency audit: zero known vulnerabilities at last run

### Still required before public production

- Phone OTP
- Distributed rate limiting such as Upstash
- Encrypted API-key vault route
- Server-side upload validation/object storage
- Complete admin dashboard UI
- Razorpay checkout UI
- Supabase chat API wiring in frontend
- Privacy policy, retention policy and account deletion UI
- Penetration/security testing

---

## 19. Environment variables

Public-safe frontend values:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RAZORPAY_KEY_ID=
```

Server-only secrets:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
API_ENCRYPTION_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY`, session secret, encryption key और Razorpay secret कभी `VITE_` prefix में नहीं रखने हैं। Vite-prefixed variables browser bundle में public हो जाती हैं।

---

## 20. Local और Vercel deployment

### Complete local stack

```bash
npm install
npx vercel dev
```

सिर्फ:

```bash
npm run dev
```

Vite UI चलाता है, लेकिन Vercel auth/payment functions execute नहीं करता।

### Vercel

```text
Private GitHub repo
       │
       ▼
Import into Vercel
       │
       ▼
Environment variables
       │
       ▼
Build: npm run build
       │
       ▼
Output: dist
```

Vercel user computer का `localhost:20128` access नहीं कर सकता। Production AI gateway public HTTPS URL होना चाहिए।

---

## 21. Interview/viva में short explanation

> “Tejas AI एक React और TypeScript based multi-model chat application है। Frontend Tailwind से बनाया गया है और backend Vercel serverless functions पर है। User registration में PIN bcrypt से hash होता है और authentication signed HttpOnly JWT cookie से होती है। Supabase PostgreSQL users, chats और payments store करता है। हर chat query signed session के user ID से filter होती है, जिससे users एक-दूसरे का data नहीं देख सकते। AI requests server proxy के through OmniRoute/OpenRouter तक जाती हैं। Models `/v1/models` से dynamically detect होते हैं और Agent Mode failure पर अधिकतम आठ models तक fallback करता है। Razorpay का ₹199 Pro order server-side fixed amount से बनता है और Pro access केवल signature-verified webhook के बाद मिलता है। Secrets environment variables में रहते हैं।”

---

## 22. अगर कोई पूछे “आपने इसमें सबसे मुश्किल क्या solve किया?”

उत्तर:

1. Multiple AI providers/models को एक OpenAI-compatible proxy से handle करना।
2. Invalid/batch/unavailable model पर automatic Agent fallback।
3. User chat isolation और IDOR prevention।
4. Black-screen React effect cleanup bug identify करना।
5. Generated HTML को safely copy, preview और download करना।
6. Payment entitlement client पर trust न करके signed webhook पर करना।

---

## 23. Honest project status

यह बताना सही रहेगा:

> “Frontend, AI proxy, login backend foundation, database schema, admin APIs और Razorpay verification foundation तैयार हैं। Supabase/Razorpay credentials configure करना, frontend chat को cloud CRUD से जोड़ना, complete admin dashboard और Phone OTP production launch से पहले बाकी हैं।”

Incomplete modules को complete बताना interview और security दोनों के लिए गलत होगा।
