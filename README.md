# MAX Web — Chat Client for GREEN-API

A minimal web messenger for **sending and receiving text messages** through the [GREEN-API](https://green-api.com/) service. The interface follows the look of [web.max.ru](https://web.max.ru/) (WhatsApp is used as the underlying messenger).
Built with **React 19**, **TypeScript** and **Vite** as a test assignment for the position *Frontend Developer (React)*.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)

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
5. **The reply appears in the chat** → picked up by polling `receiveNotification`, then removed from the queue with `deleteNotification`.

---

## 2. Quick start (local run)

**Requirements:** Node.js 18+ and npm; a GREEN-API instance in state *authorized* ([console.green-api.com](https://console.green-api.com)).

```bash
git clone https://github.com/bbaymistery/task_green_api_message_max_wp.git
cd task_green_api_message_max_wp
npm install
cp .env.example    # optional, see below
npm run dev              # http://localhost:5173
```

### Credentials

Either type them in the app (**Settings**), or put them in `.env`:

```env
VITE_GREEN_API_URL=https://api.green-api.com      # or your instance host, e.g. https://7107.api.greenapi.com
VITE_GREEN_ID_INSTANCE=1101000000
VITE_GREEN_API_TOKEN_INSTANCE=your_api_token
```

Resolution order: **Settings (LocalStorage) → `.env`**. Never commit a real token; `.env` is git-ignored.
Note: `VITE_*` variables are embedded in the browser bundle, so a frontend-only app cannot hide the token from the user of that browser.

### Scripts

| Command           | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Dev server with HMR                                   |
| `npm run build`   | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally                    |
| `npm run lint`    | Lint with oxlint                                      |

### GREEN-API instance settings

For receiving messages, notifications must be enabled for the instance (console → instance settings):
`incomingWebhook`, `outgoingWebhook`, `outgoingMessageWebhook` = **yes**. Messages typed on the phone then also appear in the app.

---

## 3. How it works

```
 send:     MessageInput → App.handleSendMessage → sendMessage (POST)
           optimistic message (temp id) → replaced by real idMessage / marked "failed"

 receive:  useGreenApiPolling ── receiveNotification (GET, every 2.5s, fast drain when queue is non-empty)
                              └─ deleteNotification (DELETE) after every handled notification
           → useMessages / useChats (state, persisted in LocalStorage)

 open chat: useChatSync ── getChatHistory (POST) once, merged without duplicates
```

Design decisions:

- **One source of live updates.** Polling (`receiveNotification`) is the only live channel; `getChatHistory` runs **once** when a chat is opened. This keeps API traffic low (free-plan rate limits) and avoids duplicate messages.
- **Recursive `setTimeout`, not `setInterval`**: the next request starts only after the previous one finished.
- **Optimistic UI** with temporary ids (`temp-…`), reconciled with the server copy in `deduplicateMessages` (O(n log n), Map-based; identical texts with different ids are never merged).
- **Debounced persistence** (500 ms, flushed on tab close) of chats and messages to LocalStorage via `useDebouncedStorage`.
- **Cancellation:** in-flight requests are aborted with `AbortController` when switching chats, changing credentials or unmounting.
- **Delivery status:** one tick = sent, two ticks = delivered/read, red icon = failed.

### GREEN-API methods used

| Method                | HTTP   | Where                                             |
| --------------------- | ------ | ------------------------------------------------- |
| `sendMessage`         | POST   | sending a text message                            |
| `receiveNotification` | GET    | polling for new messages                          |
| `deleteNotification`  | DELETE | removing a handled notification from the queue    |
| `getChatHistory`      | POST   | loading recent messages of an opened chat         |
| `getStateInstance`    | GET    | available in the API client (authorization check) |

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
│   ├── Sidebar/                 # navigation rail, theme toggle, settings button
│   └── common/                  # Avatar, Modal, Icons
├── hooks/
│   ├── useCredentials.ts        # credentials: Settings (LocalStorage) → .env
│   ├── useChats.ts              # chat list, active chat, unread badges
│   ├── useMessages.ts           # messages per chat, optimistic updates, de-duplication
│   ├── useGreenApiPolling.ts    # receiveNotification / deleteNotification loop
│   ├── useChatSync.ts           # one-time getChatHistory when a chat is opened
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

**Vercel** (or Netlify): import the GitHub repo, preset **Vite**, build command `npm run build`, output `dist`.
Optionally set the environment variables `VITE_GREEN_API_URL`, `VITE_GREEN_ID_INSTANCE`, `VITE_GREEN_API_TOKEN_INSTANCE`; otherwise users enter credentials in Settings.

- Live demo: _https://green-api-task-mu.vercel.app/_
- Screenshots / video: _add to `docs/` and link here_

---

## 6. Submission checklist (hr@green-api.com)

**Subject:** `Тестовое задание на должность - Фронтенд разработчик React`

1. **CV / Portfolio:** [elgun.vercel.app](https://elgun.vercel.app/) *(Telegram contacts included)*
2. **GitHub Repository:** [bbaymistery/GreenApiTask](https://github.com/bbaymistery/GreenApiTask)
3. **Live Deployed App:** [green-api-task-mu.vercel.app](https://green-api-task-mu.vercel.app/)
4. **Screenshots / Video Demo:** _[Add your demo video/screenshots link here]_
5. **Work Format Preference:** Remote 
6. **Local Run Guide:** See [Section 2: Quick start (local run)](#2-quick-start-local-run) above
