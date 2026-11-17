import { useState } from 'react';
import NameEntry from './NameEntry.jsx';
import Chat from './Chat.jsx';

export default function App() {
  const [name, setName] = useState('');
  return name ? <Chat name={name} onExit={() => setName('')} /> : <NameEntry onContinue={setName} />;
}
