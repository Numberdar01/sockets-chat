import { useEffect, useRef, useState } from 'react';
import { connectws } from './connectws.js';

const time = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Chat({ name, onExit }) {
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const [items, setItems] = useState([]); // messages + system notices
  const [text, setText] = useState('');
  const [typers, setTypers] = useState([]);
  const [online, setOnline] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | online | offline
  const [error, setError] = useState('');

  const push = (item) => setItems((prev) => [...prev, item]);

  useEffect(() => {
    const socket = connectws();
    socketRef.current = socket;

    const join = () =>
      socket.emit('joinroom', name, (res) => {
        if (!res.ok) {
          setError(res.error);
          socket.close();
          return setStatus('offline');
        }
        setError('');
        setStatus('online');
        setOnline(res.online);
      });

    socket.on('connect', join); // reconnect par bhi dobara join
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('noticeall', (n) => push({ kind: 'notice', id: crypto.randomUUID(), text: `${n} joined the chat` }));
    socket.on('leftroom', (n) => push({ kind: 'notice', id: crypto.randomUUID(), text: `${n} left the chat` }));
    socket.on('sendmsg', (m) => push({ kind: 'msg', ...m }));
    socket.on('presence', setOnline);
    socket.on('typing', ({ name: who, isTyping }) =>
      setTypers((prev) => (isTyping ? [...new Set([...prev, who])] : prev.filter((n) => n !== who)))
    );

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  const onType = (e) => {
    setText(e.target.value);
    const s = socketRef.current;
    if (!s) return;
    s.emit('typing', true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => s.emit('typing', false), 1200);
  };

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || status !== 'online') return;
    const draft = { kind: 'msg', id: crypto.randomUUID(), text: body, sender: name, sentAt: new Date().toISOString(), mine: true };
    push(draft); // optimistic: sender ko server wapas nahi bhejta
    setText('');
    clearTimeout(typingTimer.current);
    socketRef.current.emit('typing', false);
    socketRef.current.emit('sendmsg', { id: draft.id, text: body }, (res) => {
      if (!res?.ok) setItems((prev) => prev.map((m) => (m.id === draft.id ? { ...m, failed: true } : m)));
    });
  };

  const typingLabel =
    typers.length === 0 ? '' : typers.length === 1 ? `${typers[0]} is typing…` : 'Several people are typing…';

  return (
    <main className="page">
      <section className="card chat">
        <header className="chat-head">
          <span className="avatar">{name[0].toUpperCase()}</span>
          <div className="head-mid">
            <strong>Realtime group chat</strong>
            <span className="muted small">
              {typingLabel || (status === 'online' ? `${online.length} online` : status === 'connecting' ? 'Connecting…' : 'Reconnecting…')}
            </span>
          </div>
          <span className="small">Signed in as <strong>{name}</strong></span>
          <button className="link" onClick={onExit}>Leave</button>
        </header>

        {error && <p className="error banner" role="alert">{error} <button className="link" onClick={onExit}>Change name</button></p>}

        <div className="msgs" aria-live="polite">
          {items.length === 0 && <p className="muted empty">No messages yet. Say hello to the room.</p>}
          {items.map((m) =>
            m.kind === 'notice' ? (
              <p key={m.id} className="notice">{m.text}</p>
            ) : (
              <div key={m.id} className={`bubble ${m.mine ? 'mine' : 'theirs'} ${m.failed ? 'failed' : ''}`}>
                <span className="text">{m.text}</span>
                <span className="meta">
                  {m.sender} · {time(m.sentAt)}{m.failed ? ' · not sent' : ''}
                </span>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={send}>
          <input
            value={text}
            onChange={onType}
            maxLength={500}
            placeholder="Type a message…"
            aria-label="Message"
            disabled={status !== 'online'}
          />
          <button className="btn" type="submit" disabled={status !== 'online' || !text.trim()}>Send</button>
        </form>
      </section>
    </main>
  );
}
