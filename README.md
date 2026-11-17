# Real-Time Group Chat (React + Socket.IO)

Report ke hisaab se: ek shared room ("rooms"), `joinroom` / `noticeall` / `sendmsg` events,
Express se built frontend serve hota hai, server port 5000 par.

## Report me "future scope" tha, ab implement hai
- Server-side validation (name max 20, message max 500, empty reject)
- Acknowledgements (`ack`) + error feedback
- Unique usernames, server khud sender decide karta hai
- Typing indicator, join/leave notices, online count
- Reconnect par auto re-join, listener cleanup on unmount
- `CORS_ORIGIN` env variable (wildcard sirf default demo ke liye)
- Automated tests (T03, T04, T05, T09 of the test plan)

## Abhi bhi nahi hai (honestly): auth, DB persistence, multiple rooms, private chat, read receipts

## Run karna
```bash
npm install
npm run build        # frontend install + build -> chat-frontend/dist
npm start            # http://localhost:5000
```
Do browser tabs kholo, alag names se join karo, chat karo.

### Dev mode (hot reload)
```bash
npm install
npm run dev                         # terminal 1: server on :5000
cd chat-frontend && npm install && npm run dev   # terminal 2: Vite on :5173
```

### Tests
```bash
npm start     # ek terminal me
npm test      # doosre me
```

## Deploy (Render)
Build command: `npm install && npm run build`  |  Start command: `npm start`
Env: `CORS_ORIGIN=https://<your-app>.onrender.com`

## Structure
```
server.js              Express + Socket.IO server
tests/chat.test.js     socket.io-client tests
chat-frontend/
  src/connectws.js     socket helper
  src/App.jsx          name entry <-> chat
  src/NameEntry.jsx    name screen
  src/Chat.jsx         chat UI + socket events
```
