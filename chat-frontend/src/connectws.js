import { io } from 'socket.io-client';

// Dev me server alag port (5000) par hota hai; production me same origin.
export function connectws() {
  const url =
    import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : undefined);
  return io(url);
}
