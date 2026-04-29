import protobuf from 'protobufjs';
import { writeFileSync } from 'node:fs';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || '1'];
  }),
);

const uid = args.get('uid') || process.env.REAL_UID;
const ig = args.get('ig') || process.env.REAL_IG || '';
const apiBaseUrl = (args.get('api') || process.env.REAL_API_BASE_URL || '').replace(/\/$/, '');
const room = args.get('room') || process.env.REAL_ROOM || '';
const out = args.get('out') || 'docs/REAL_SERVER_WS_PROBE.json';

if (!uid) {
  console.error('Missing --uid. Example: node scripts/probe-real-server.mjs --api=https://your-api.example --uid=REAL_UID --ig=REAL_IG');
  process.exit(1);
}

if (!apiBaseUrl) {
  console.error('Missing --api or REAL_API_BASE_URL.');
  process.exit(1);
}

const root = await protobuf.load('public/proto/lobby.proto');
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function numberToUint8Array(num, len) {
  if (len == null || len === 0) {
    len = Math.ceil(num.toString(16).length / 2);
  }
  const array = new Uint8Array(len);
  for (let index = len - 1; index >= 0; index -= 1) {
    array[index] = num % 256;
    num = Math.floor(num / 256);
    if (num === 0) break;
  }
  return array;
}

function encodeFrame(type, data = null) {
  let payload = new Uint8Array(0);
  if (data) {
    const Message = root.lookupType(type);
    const error = Message.verify(data);
    if (error) throw new Error(error);
    payload = Message.encode(Message.create(data)).finish();
  }

  const stamp = numberToUint8Array(Date.now());
  const action = encoder.encode(type);
  const prefix = new Uint8Array([type.includes('Req') ? 1 : 0, 0]);
  const output = new Uint8Array(prefix.length + stamp.length + 1 + action.length + payload.length);
  let offset = 0;
  output.set(prefix, offset);
  offset += prefix.length;
  output.set(stamp, offset);
  offset += stamp.length;
  output[offset] = action.length;
  offset += 1;
  output.set(action, offset);
  offset += action.length;
  output.set(payload, offset);
  return output;
}

function decodeFrame(input) {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input);
  const actionLength = data[8];
  const action = decoder.decode(data.slice(9, 9 + actionLength));
  const payload = data.slice(9 + actionLength);
  const Message = root.lookupType(action);
  const decoded = Message.decode(payload);
  return {
    action,
    payload: Message.toObject(decoded, { longs: String, enums: String, defaults: true }),
  };
}

const query = new URLSearchParams({ uid, room, ig });
const loginUrl = `${apiBaseUrl}/game/lobby/login?${query.toString()}`;
const loginResponse = await fetch(loginUrl);
const wsUrl = await loginResponse.text();
const report = {
  uidMasked: `${uid.slice(0, 8)}...${uid.slice(-6)}`,
  ig,
  apiBaseUrl,
  loginStatus: loginResponse.status,
  websocketReturned: wsUrl.startsWith('ws'),
  messages: [],
  summary: {},
};

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.split(uid).join('<uid>');
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]),
    );
  }

  return value;
}

if (!report.websocketReturned) {
  report.error = `Login did not return websocket URL: ${sanitizeValue(wsUrl.slice(0, 160))}`;
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

await new Promise((resolve) => {
  const ws = new WebSocket(wsUrl);
  const timer = setTimeout(() => {
    report.timeout = true;
    try { ws.close(); } catch {
      // Ignore close errors during timeout cleanup.
    }
    resolve();
  }, Number(args.get('timeout') || 10000));

  ws.addEventListener('open', () => {
    ws.send(encodeFrame('InitReq'));
    setTimeout(() => {
      try {
        ws.send(encodeFrame('GetApnsReq', { gid: 0 }));
      } catch (error) {
        report.getApnsSendError = error.message;
      }
    }, 400);
  });

  ws.addEventListener('message', async (event) => {
    try {
      const raw = event.data.arrayBuffer ? await event.data.arrayBuffer() : event.data;
      const message = decodeFrame(new Uint8Array(raw));
      report.messages.push(sanitizeValue(message));

      if (message.action === 'InitRet') {
        report.summary.user = {
          uidMasked: `${message.payload.user?.uid?.slice(0, 8) || ''}...${message.payload.user?.uid?.slice(-6) || ''}`,
          nickname: message.payload.user?.nickname || '',
          hasAvatar: Boolean(message.payload.user?.avatar),
          token: message.payload.user?.token || 0,
        };
        report.summary.gameCount = message.payload.gameList?.length || 0;
        report.summary.firstGames = sanitizeValue((message.payload.gameList || []).slice(0, 8));
      }

      if (message.action === 'GetApnsRet') {
        report.summary.apnsCount = message.payload.apns?.length || 0;
      }

      if (report.messages.length >= 2) {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    } catch (error) {
      report.messages.push({ error: error.message });
    }
  });

  ws.addEventListener('error', (error) => {
    report.websocketError = String(error.message || error.type || error);
    clearTimeout(timer);
    resolve();
  });
});

writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  loginStatus: report.loginStatus,
  websocketReturned: report.websocketReturned,
  actions: report.messages.map((message) => message.action || `error:${message.error}`),
  summary: report.summary,
}, null, 2));
