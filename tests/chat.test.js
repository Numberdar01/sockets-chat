// Run: npm test  (server pehle `npm start` se chalu hona chahiye, port 5000)
import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const URL = process.env.TEST_URL || 'http://localhost:5000';
const connect = () =>
  new Promise((res) => {
    const s = io(URL, { transports: ['websocket'] });
    s.on('connect', () => res(s));
  });
const once = (s, ev) => new Promise((res) => s.once(ev, res));
const join = (s, n) => new Promise((res) => s.emit('joinroom', n, res));

test('T03 join notice peers ko milta hai', async () => {
  const a = await connect(); const b = await connect();
  await join(a, 'TestA' + Date.now());
  const notice = once(a, 'noticeall');
  const name = 'TestB' + Date.now();
  await join(b, name);
  assert.equal(await notice, name);
  a.close(); b.close();
});

test('T04/T05 message peers ko jata hai, sender ko nahi', async () => {
  const a = await connect(); const b = await connect();
  await join(a, 'A' + Date.now()); await join(b, 'B' + Date.now());
  let echoed = false;
  a.on('sendmsg', () => (echoed = true));
  const got = once(b, 'sendmsg');
  a.emit('sendmsg', { text: 'hello' });
  assert.equal((await got).text, 'hello');
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(echoed, false);
  a.close(); b.close();
});

test('T09 empty message reject hota hai', async () => {
  const a = await connect();
  await join(a, 'C' + Date.now());
  const res = await new Promise((r) => a.emit('sendmsg', { text: '   ' }, r));
  assert.equal(res.ok, false);
  a.close();
});
