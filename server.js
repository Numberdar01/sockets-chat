import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
// Production me CORS_ORIGIN set karo (e.g. https://yourapp.onrender.com). Default '*' sirf demo ke liye.
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const ROOM = 'rooms';
const MAX_NAME = 20;
const MAX_TEXT = 500;

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: CORS_ORIGIN } });

// socket.id -> username (in-memory, restart par reset)
const users = new Map();

const cleanName = (v) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '';

const onlineList = () => [...users.values()];
const reply = (ack, data) => typeof ack === 'function' && ack(data);

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinroom', async (username, ack) => {
    const name = cleanName(username);
    if (!name) return reply(ack, { ok: false, error: 'Name required hai.' });

    const taken = onlineList().some((n) => n.toLowerCase() === name.toLowerCase());
    if (taken && users.get(socket.id) !== name) {
      return reply(ack, { ok: false, error: 'Ye name pehle se use me hai.' });
    }

    console.log(`${name} is connected to the room`);
    users.set(socket.id, name);
    await socket.join(ROOM);
    socket.to(ROOM).emit('noticeall', name);
    io.to(ROOM).emit('presence', onlineList());
    reply(ack, { ok: true, name, online: onlineList() });
  });

  socket.on('sendmsg', (msg, ack) => {
    const sender = users.get(socket.id);
    if (!sender) return reply(ack, { ok: false, error: 'Pehle room join karo.' });

    const text = typeof msg?.text === 'string' ? msg.text.trim().slice(0, MAX_TEXT) : '';
    if (!text) return reply(ack, { ok: false, error: 'Empty message.' });

    // Sender server decide karta hai, client ka bheja hua sender trust nahi karte.
    const payload = { id: msg.id || randomUUID(), text, sender, sentAt: new Date().toISOString() };
    socket.to(ROOM).emit('sendmsg', payload); // sender ko chhodkar baaki sabko
    reply(ack, { ok: true, message: payload });
  });

  socket.on('typing', (isTyping) => {
    const name = users.get(socket.id);
    if (name) socket.to(ROOM).emit('typing', { name, isTyping: Boolean(isTyping) });
  });

  socket.on('disconnect', () => {
    const name = users.get(socket.id);
    if (!name) return;
    users.delete(socket.id);
    socket.to(ROOM).emit('leftroom', name);
    io.to(ROOM).emit('presence', onlineList());
    console.log(`${name} disconnected`);
  });
});

app.use(express.static(path.join(__dirname, 'chat-frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat-frontend/dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
