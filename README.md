# MAX Web — Chat Client for GREEN-API

A minimal web messenger for **sending and receiving text messages** through the [GREEN-API](https://green-api.com/) service. The interface follows the look of [web.max.ru](https://web.max.ru/) (WhatsApp is used as the underlying messenger).
Built with **React 19**, **TypeScript** and **Vite** as a test assignment for the position *Frontend Developer (React)*.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Telegram](https://img.shields.io/badge/Telegram-@baymistery-2CA5E0?logo=telegram&logoColor=white)](https://t.me/baymistery)
[![Portfolio](https://img.shields.io/badge/Portfolio-elgun.vercel.app-blue)](https://elgun.vercel.app/)

---

## 1. The assignment and how it is solved

The task (`htmls/task.png`) asks for a UI for sending and receiving messages in MAX / WhatsApp / Telegram using GREEN-API.

| #   | Requirement                                   | Implementation                                                                   |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | UI for sending and receiving messages         | Chat list + conversation window (`src/components/`)                              |
| 2   | Use the GREEN-API service                     | `src/api/greenApiClient.ts` (plain `fetch`, no SDK)                              |
| 3   | Text messages only                            | Text is sent/received; media is shown as a placeholder like `[imageMessage]`     |
| 4   | Take the look of web.max.ru                   | Sidebar rail, chat list, dark/light theme, message bubbles                       |
| 5   | As simple as possible, minimal feature set    | Only what the flow below needs (plus search and emoji)                           |
| 6   | Send with the **SendMessage** method          | `POST /sendMessage` → `sendMessage()`                                            |
| 7   | Receive with the **HTTP API** (notifications) | `GET /receiveNotification` + `DELETE /deleteNotification` → `useGreenApiPolling` |
| 8   | React                                         | React 19                                                                         |

### Expected user flow

1. **Open the site and enter GREEN-API credentials** (`idInstance`, `apiTokenInstance`): Settings (gear icon in the sidebar) or `.env`.
2. **Enter the recipient's phone number** → *New chat* (**+**), pick the country, type the number.
3. **Write a text message and send it** → `sendMessage`. The message appears immediately (optimistic UI) and is confirmed with the real `idMessage`.
4. **The recipient replies in the messenger.**
5. **The reply appears in the chat** → picked up in real-time by HTTP polling (`receiveNotification` / `deleteNotification`) and synced without requiring page reload.

---

## 2. Quick start (local run)

### Step 1: Getting GREEN-API credentials

To communicate with WhatsApp through GREEN-API, you need an authorized instance:

1. **Sign up / Sign in**: Go to [console.green-api.com](https://console.green-api.com) and create an account.
2. **Select or create an instance**: Use the free *Developer* plan instance provided upon registration.
3. **Scan the QR Code to authorize**:
   - In your GREEN-API personal dashboard, open your instance and navigate to the **QR Code** section.
   - Open WhatsApp on your smartphone: navigate to **Settings** (or ⋮ menu) → **Linked Devices** → **Link a Device**.
   - Point your phone camera at the QR code displayed in the GREEN-API console and scan it.
   - Wait a few seconds for the instance status to change to **`authorized`**.
4. **Copy your credentials**:
   - **`idInstance`**: Your unique numeric instance identifier (e.g. `7107...` or `1101...`).
   - **`apiTokenInstance`**: Your instance's private access token.
   - **`apiUrl` / Host**: The API host endpoint assigned to your instance (e.g. `https://7107.api.greenapi.com` or `https://api.green-api.com`).
5. **Enable Webhook Notifications (Required for receiving messages)**:
   - In the GREEN-API console, open **Instance Settings**.
   - Make sure the following notification options are enabled (**yes**):
     - `incomingWebhook` = **yes**
     - `outgoingWebhook` = **yes**
     - `outgoingMessageWebhook` = **yes**
   *(Enabling these allows the application to retrieve incoming and outgoing messages in real-time via HTTP notification polling).*

---

### Step 2: Clone and install locally

**Requirements:** Node.js 18+ and npm.

```bash
git clone https://github.com/bbaymistery/GreenApiTask.git
cd GreenApiTask
npm install
cp .env.example .env     # optional, configure credentials
npm run dev              # opens http://localhost:5173
```

### Step 3: Providing credentials to the application

You can provide your credentials in either of two ways:

- **Option A — Web UI Settings modal (Recommended)**:
  Open the app in your browser, click the **Settings** gear icon in the lower-left navigation rail, fill in `idInstance`, `apiTokenInstance`, and API URL (host), then click **Save**. The values are saved locally in browser `LocalStorage`.
- **Option B — `.env` file**:
  Create `.env` by copying `.env.example`:
  ```env
  VITE_GREEN_ID_INSTANCE=your_id_instance_here
  VITE_GREEN_API_TOKEN_INSTANCE=your_api_token_instance_here
  VITE_GREEN_API_URL=https://api.green-api.com      # or your specific host, e.g. https://7107.api.greenapi.com
  ```

> **Resolution order:** **Settings (LocalStorage) → `.env`**.
> Never commit real tokens to git. `.env` is ignored by `.gitignore`.

### Scripts

| Command           | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Dev server with HMR                                   |
| `npm run build`   | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally                    |
| `npm run lint`    | Lint with oxlint                                      |

---

## 3. How it works

```
 send:     MessageInput → App.handleSendMessage → sendMessage (POST)
           optimistic message (temp id) → replaced by real idMessage / marked "failed"

 receive:  useGreenApiPolling ── receiveNotification (GET, every 2.5s, fast drain when queue is non-empty)
                              └─ deleteNotification (DELETE) after every handled notification
           → useMessages / useChats (state, persisted in LocalStorage)

 sync:     useChatSync ── getChatHistory (active chat synchronization)
                       └─ lastIncomingMessages (multi-conversation delta sync for unread badges)
```

Design decisions:

- **Dual-Channel Reliability**: HTTP API long-polling (`receiveNotification` + `deleteNotification`) handles real-time notification events. Background delta sync (`lastIncomingMessages` + active `getChatHistory`) prevents dropped or stalled messages under free-tier queue delays, eliminating the need for page reloads.
- **Recursive `setTimeout`, not `setInterval`**: the next request starts only after the previous one finishes, preventing stampedes and rate limiting.
- **Render Bailout & Memoization**: State updaters bail out (`return prev`) when data is unchanged, avoiding unnecessary React re-renders and maintaining 60 FPS performance.
- **Optimistic UI** with temporary ids (`temp-…`), reconciled with the server copy in `deduplicateMessages` (O(n log n), Map-based; identical texts with different ids are never merged).
- **Debounced persistence** (500 ms, flushed on tab close) of chats and messages to LocalStorage via `useDebouncedStorage`.
- **Cancellation:** in-flight requests are aborted with `AbortController` when switching chats, changing credentials or unmounting.
- **Delivery status:** one tick = sent, two ticks = delivered/read, red icon = failed.

### GREEN-API methods used

| Method                 | HTTP   | Where                                                          |
| ---------------------- | ------ | -------------------------------------------------------------- |
| `sendMessage`          | POST   | sending a text message                                         |
| `receiveNotification`  | GET    | polling for incoming message notifications                     |
| `deleteNotification`   | DELETE | removing a handled notification from the FIFO queue            |
| `lastIncomingMessages` | GET    | multi-chat journal sync for immediate unread badges & previews |
| `getChatHistory`       | POST   | loading conversation messages of an opened chat                |
| `getStateInstance`     | GET    | instance authorization verification check                      |

### Known limitation: GREEN-API Developer plan

The free **Developer** plan allows messaging with only **3 phone numbers per month** (HTTP `466 CORRESPONDENTS_QUOTE_EXCEEDED`). Sending to another number fails and the message gets the red "failed" icon. The *New chat* dialog lists the allowed test numbers as shortcuts. A paid tariff removes the limit.

---

## 4. Project structure

```
src/
├── api/
│   ├── greenApiClient.ts        # fetch wrappers for the GREEN-API methods above
│   └── index.ts
├── components/
│   ├── Auth/                    # credentials (Settings) modal
│   ├── ChatList/                # chat list, search, new-chat modal with phone input
│   ├── ChatWindow/              # conversation header, message bubbles, input with emoji picker
│   ├── Sidebar/                 # navigation rail, theme toggle, settings button, version badge
│   └── common/                  # Avatar, Modal, Icons
├── hooks/
│   ├── useCredentials.ts        # credentials: Settings (LocalStorage) → .env
│   ├── useChats.ts              # chat list, active chat, unread badges
│   ├── useMessages.ts           # messages per chat, optimistic updates, de-duplication
│   ├── useGreenApiPolling.ts    # receiveNotification / deleteNotification loop
│   ├── useChatSync.ts           # active chat history & multi-chat journal sync
│   └── useDebouncedStorage.ts   # debounced JSON persistence to LocalStorage
├── styles/                      # reset.css, design tokens (variables.css)
├── types/                       # chat, UI and GREEN-API payload types
├── utils/
│   ├── chatHelpers.ts           # phone → chatId, isSameChat, deduplicateMessages
│   └── time.ts                  # cached Intl.DateTimeFormat
├── App.tsx                      # wires hooks and layout together
├── constants.ts                 # intervals, limits, storage keys
└── main.tsx
```

---

## 5. Deployment

**Netlify** / **Vercel**: import the GitHub repo, preset **Vite**, build command `npm run build`, output directory `dist`.
Optionally set the environment variables `VITE_GREEN_API_URL`, `VITE_GREEN_ID_INSTANCE`, `VITE_GREEN_API_TOKEN_INSTANCE`; otherwise users can enter credentials directly in Settings.

- **Live demo:** [https://green-api-task-max-web.netlify.app/](https://green-api-task-max-web.netlify.app/)
- **Repository:** [https://github.com/bbaymistery/GreenApiTask](https://github.com/bbaymistery/GreenApiTask)
- **Video demo:** [Google Drive Video Demo](https://drive.google.com/file/d/1y8Cguj2Qi2MbUGUxfwpdroY9G_suPrjg/view?usp=sharing)

---

## 6. Submission checklist (hr@green-api.com)

**Subject:** `Job application test assignment - Frontend Developer React`  

1. **Resume & Contacts:** Attached PDF resume
   - **Telegram:** [@baymistery](https://t.me/baymistery) (`https://t.me/baymistery`)
   - **Portfolio:** [https://elgun.vercel.app/](https://elgun.vercel.app/)
2. **GitHub Repository:** [https://github.com/bbaymistery/GreenApiTask](https://github.com/bbaymistery/GreenApiTask)
3. **Local setup instructions:** See [Section 2: Quick start (local run)](#2-quick-start-local-run)
4. **Live deployment:** [https://green-api-task-max-web.netlify.app/](https://green-api-task-max-web.netlify.app/)
5. **Video presentation:** [Google Drive Video Demo](https://drive.google.com/file/d/1y8Cguj2Qi2MbUGUxfwpdroY9G_suPrjg/view?usp=sharing)
6. **Preferred work format:** Remote
