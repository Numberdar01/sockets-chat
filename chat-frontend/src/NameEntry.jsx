import { useState } from 'react';

export default function NameEntry({ onContinue }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return setError('Apna naam likho, tabhi chat shuru hogi.');
    onContinue(name.slice(0, 20));
  };

  return (
    <main className="page">
      <form className="card entry" onSubmit={submit}>
        <h1>Enter your name</h1>
        <p className="muted">This will be used to identify you</p>
        <input
          autoFocus
          value={value}
          maxLength={20}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          placeholder="Your name (e.g. Yash)"
          aria-label="Your name"
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit">Continue</button>
      </form>
    </main>
  );
}
