import { io } from 'socket.io-client';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { url, token } = JSON.parse(input);
if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(url) || typeof token !== 'string') {
  throw new Error('Expected a generated Quick Tunnel HTTPS origin and a temporary test token');
}
const socket = io(url, {
  transports: ['websocket'],
  auth: { token },
  extraHeaders: { Origin: url },
  reconnection: false,
  timeout: 15000,
});
try {
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', () => reject(new Error('Authenticated public WebSocket failed')));
  });
  console.log(JSON.stringify({ status: 'passed', transport: socket.io.engine.transport.name }));
} finally {
  socket.disconnect();
}
