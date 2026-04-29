function readRuntimeConfig() {
  const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
    uid: import.meta.env.VITE_TEST_UID || '',
    room: import.meta.env.VITE_ROOM || '',
    roomType: import.meta.env.VITE_ROOM_TYPE || '',
    ig: import.meta.env.VITE_IG || '',
    preferRemote: import.meta.env.VITE_PREFER_REMOTE === '1',
    serverMode: import.meta.env.VITE_PREFER_REMOTE === '1' ? 'real' : 'auto',
  };

  if (typeof window === 'undefined') return config;

  const params = new URLSearchParams(window.location.search);
  const stored = window.localStorage;
  const hasRuntimeParams = ['apiBaseUrl', 'api', 'uid', 'room', 'roomType', 'ig', 'server', 'preferRemote'].some((key) => params.has(key));

  const explicitServer = params.get('server');
  const explicitMode = params.get('preferRemote') ?? explicitServer;
  const storedMode = stored.getItem('cocogames.server');
  let serverMode = storedMode || config.serverMode;
  if (explicitMode !== null) {
    const modeValue = explicitMode.toLowerCase();
    serverMode = ['1', 'true', 'real', 'remote'].includes(modeValue) ? 'real' : 'local';
  }
  const preferRemote = serverMode === 'real';

  const runtime = {
    apiBaseUrl: params.get('apiBaseUrl') || params.get('api') || stored.getItem('cocogames.apiBaseUrl') || config.apiBaseUrl,
    uid: params.get('uid') || stored.getItem('cocogames.uid') || config.uid,
    room: params.get('room') || stored.getItem('cocogames.room') || config.room,
    roomType: params.get('roomType') || stored.getItem('cocogames.roomType') || config.roomType,
    ig: params.get('ig') || stored.getItem('cocogames.ig') || config.ig,
    preferRemote,
    serverMode,
  };

  if (hasRuntimeParams) {
    stored.setItem('cocogames.apiBaseUrl', runtime.apiBaseUrl);
    stored.setItem('cocogames.uid', runtime.uid);
    stored.setItem('cocogames.room', runtime.room);
    stored.setItem('cocogames.roomType', runtime.roomType);
    stored.setItem('cocogames.ig', runtime.ig);
    stored.setItem('cocogames.server', runtime.serverMode);
  }

  return runtime;
}

export const RUNTIME_CONFIG = readRuntimeConfig();
export const API_BASE_URL = RUNTIME_CONFIG.apiBaseUrl.replace(/\/$/, '');
export const API_TIMEOUT = 10000;
export const TEST_UID = RUNTIME_CONFIG.uid;
export const ROOM = RUNTIME_CONFIG.room;
export const roomType = RUNTIME_CONFIG.roomType || null;
export const ig = RUNTIME_CONFIG.ig;

export function shouldPreferRemote() {
  return RUNTIME_CONFIG.preferRemote;
}

export function shouldUseLocalOnly() {
  return RUNTIME_CONFIG.serverMode === 'local';
}

export const API_ENDPOINTS = {
  lobby: '/game/lobby/login',
  init: '/game/lobby/InitReq',
  games: '/game/list',
  gameDetail: (id) => `/game/${id}`,

  user: '/user/profile',
  userBalance: '/user/balance',

  arena: '/arena/list',
  arenaJoin: (id) => `/arena/${id}/join`,
  arenaLeaderboard: (id) => `/arena/${id}/leaderboard`,

  activities: '/activity/list',
  checkin: '/activity/checkin',
  tasks: '/activity/tasks',
  claimTask: '/activity/task/claim',
  wheelSpin: '/activity/wheel/spin',

  products: '/store/products',
  purchase: '/store/purchase',
  redeem: '/store/redeem',

  leaderboard: '/leaderboard/winners',
  wsToken: '/ws/token',
};

export class ApiError extends Error {
  constructor(message, status, code, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function parsePayload(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let websocketConnector = null;

export function setWebSocketConnector(connector) {
  websocketConnector = typeof connector === 'function' ? connector : null;
}

async function maybeConnectWebSocket(text) {
  if (!text || !text.startsWith('ws')) return;
  // Lobby login returns a raw ws/wss URL. The connector is registered by
  // server/index.js so this module does not dynamically import socketClient.
  if (!websocketConnector) {
    console.warn('[API] WebSocket URL received before connector registration.');
    return;
  }
  try {
    await websocketConnector(text);
  } catch (error) {
    console.warn('[API] WebSocket auto-connect failed:', error);
  }
}

async function handleResponse(xhr, endpoint) {
  const text = xhr.responseText || '';
  await maybeConnectWebSocket(text);
  const payload = parsePayload(text);

  if (xhr.status >= 200 && xhr.status < 300) {
    if (payload?.success === 0 && Number(payload?.status || 0) >= 400) {
      const message = payload.message || `Business error ${payload.status}`;
      throw new ApiError(message, payload.status, 'BUSINESS_ERROR', payload);
    }
    console.log(`[API] ${endpoint} ->`, payload);
    return payload;
  }

  const message = payload?.message || payload?.error || `HTTP error ${xhr.status}`;
  const code = payload?.code || 'HTTP_ERROR';
  console.log(`[API] ${endpoint} <- Error:`, payload);
  throw new ApiError(message, xhr.status, code, payload);
}

function appendDefaultParams(params) {
  params.append('uid', TEST_UID);
  params.append('room', ROOM);
  if (roomType !== null && roomType !== undefined) params.append('type', roomType);
  params.append('ig', ig);
}

function buildUrl(endpoint, method, data) {
  const url = new URL(endpoint, `${API_BASE_URL}/`);
  appendDefaultParams(url.searchParams);

  if (method === 'GET' && data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

function request(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = buildUrl(endpoint, method, data);

    xhr.timeout = API_TIMEOUT;
    xhr.ontimeout = () => reject(new ApiError('Request timeout', 408, 'TIMEOUT'));
    xhr.onerror = () => reject(new ApiError('Network error', 0, 'NETWORK_ERROR'));
    xhr.onload = () => {
      handleResponse(xhr, endpoint).then(resolve).catch(reject);
    };

    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    if (method === 'GET') {
      xhr.send();
      return;
    }

    const body = data
      ? { ...data, uid: TEST_UID, roomId: ROOM, roomType, ig }
      : { uid: TEST_UID, roomId: ROOM, roomType, ig };
    xhr.send(JSON.stringify(body));
  });
}

export async function get(endpoint, options = {}) {
  return request('GET', endpoint, options);
}

export async function post(endpoint, data = {}) {
  return request('POST', endpoint, data);
}

export async function fetchLobbyData() {
  return get(API_ENDPOINTS.lobby);
}

export async function initReq() {
  return get(API_ENDPOINTS.init);
}

export async function fetchGames() {
  return get(API_ENDPOINTS.games);
}

export async function fetchGameDetail(gameId) {
  return get(API_ENDPOINTS.gameDetail(gameId));
}

export async function fetchUserProfile() {
  return get(API_ENDPOINTS.user);
}

export async function fetchUserBalance() {
  return get(API_ENDPOINTS.userBalance);
}

export async function fetchArenaList() {
  return get(API_ENDPOINTS.arena);
}

export async function joinArena(arenaId) {
  return post(API_ENDPOINTS.arenaJoin(arenaId), {});
}

export async function fetchArenaLeaderboard(arenaId) {
  return get(API_ENDPOINTS.arenaLeaderboard(arenaId));
}

export async function fetchActivities() {
  return get(API_ENDPOINTS.activities);
}

export async function doCheckin(day) {
  return post(API_ENDPOINTS.checkin, { day });
}

export async function fetchTasks() {
  return get(API_ENDPOINTS.tasks);
}

export async function claimTaskReward(taskId) {
  return post(API_ENDPOINTS.claimTask, { taskId });
}

export async function spinWheel() {
  return post(API_ENDPOINTS.wheelSpin, {});
}

export async function fetchProducts() {
  return get(API_ENDPOINTS.products);
}

export async function purchaseProduct(productId) {
  return post(API_ENDPOINTS.purchase, { productId });
}

export async function redeemCode(code) {
  return post(API_ENDPOINTS.redeem, { code });
}

export async function fetchLeaderboard() {
  return get(API_ENDPOINTS.leaderboard);
}

export default {
  get,
  post,
  ApiError,
  RUNTIME_CONFIG,
  API_ENDPOINTS,
  setWebSocketConnector,
  shouldPreferRemote,
  shouldUseLocalOnly,
  fetchLobbyData,
  initReq,
  fetchGames,
  fetchGameDetail,
  fetchUserProfile,
  fetchUserBalance,
  fetchArenaList,
  joinArena,
  fetchArenaLeaderboard,
  fetchActivities,
  doCheckin,
  fetchTasks,
  claimTaskReward,
  spinWheel,
  fetchProducts,
  purchaseProduct,
  redeemCode,
  fetchLeaderboard,
};
