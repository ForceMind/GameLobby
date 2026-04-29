import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrap } from './mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 8787);

const state = bootstrap();
const adminCollections = [
  'user',
  'wallet',
  'jackpot',
  'hero',
  'games',
  'tournaments',
  'events',
  'shop',
  'vip',
  'dailyRewards',
  'wheel',
  'profile',
  'redeemCodes',
  'leaderboard',
];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function headers(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    ...extra,
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, headers({ 'Content-Type': 'application/json; charset=utf-8' }));
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message, code = 'REQUEST_ERROR') {
  sendJson(res, status, { code, message });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

function publicGame(game) {
  return {
    ...game,
  };
}

function getGame(id) {
  return state.games.find((game) => String(game.id) === String(id));
}

function getTournament(id) {
  return state.tournaments.find((item) => item.id === id);
}

function getEvent(id) {
  return state.events.find((item) => item.id === id);
}

function getProduct(productId) {
  return (
    state.shop.coins.find((item) => item.id === productId)
    || state.shop.items.find((item) => item.id === productId)
    || state.shop.deals.find((item) => item.id === productId)
  );
}

function nowLabel() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function addTransaction(title, coinsDelta = 0, eventCoinsDelta = 0) {
  const parts = [];
  if (coinsDelta) parts.push(`${coinsDelta > 0 ? '+' : ''}${coinsDelta.toLocaleString()} Coins`);
  if (eventCoinsDelta) parts.push(`${eventCoinsDelta > 0 ? '+' : ''}${eventCoinsDelta.toLocaleString()} Event Coins`);
  const transaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    amount: parts.join(' / ') || '0',
    time: nowLabel(),
  };
  state.profile.transactions = [transaction, ...(state.profile.transactions || [])].slice(0, 50);
  return transaction;
}

function applyWalletDelta({ coins = 0, eventCoins = 0, title = 'Wallet update' }) {
  const coinsDelta = Number(coins || 0);
  const eventCoinsDelta = Number(eventCoins || 0);
  state.wallet.coins = Math.max(0, Number(state.wallet.coins || 0) + coinsDelta);
  state.wallet.eventCoins = Math.max(0, Number(state.wallet.eventCoins || 0) + eventCoinsDelta);
  const transaction = addTransaction(title, coinsDelta, eventCoinsDelta);
  return { wallet: state.wallet, transaction };
}

function applyPurchase(product) {
  if (!product) return null;

  const coins = Number(product.coins || 0);
  const eventCoins = Number(product.eventCoins || 0) - Number(product.cost || 0);
  const result = applyWalletDelta({
    coins,
    eventCoins,
    title: `Shop purchase: ${product.title || product.id}`,
  });

  return {
    product,
    ...result,
  };
}

async function routeApi(req, res, pathname) {
  const method = req.method || 'GET';
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const query = requestUrl.searchParams;
  const body = method === 'GET' ? {} : await readBody(req);

  if (method === 'OPTIONS') {
    res.writeHead(204, headers());
    res.end();
    return true;
  }

  if (method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'cocogames-lobby',
      mode: 'mock-compatible',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (method === 'GET' && pathname === '/api/lobby/bootstrap') {
    sendJson(res, 200, state);
    return true;
  }

  if (method === 'GET' && pathname === '/api/admin/snapshot') {
    sendJson(res, 200, {
      collections: adminCollections,
      data: Object.fromEntries(adminCollections.map((key) => [key, state[key]])),
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  const adminCollectionMatch = pathname.match(/^\/api\/admin\/collections\/([^/]+)$/);
  if (adminCollectionMatch && method === 'GET') {
    const collection = adminCollectionMatch[1];
    if (!adminCollections.includes(collection)) {
      sendError(res, 404, 'Admin collection not found', 'ADMIN_COLLECTION_NOT_FOUND');
    } else {
      sendJson(res, 200, { collection, data: state[collection] });
    }
    return true;
  }

  if (adminCollectionMatch && ['PUT', 'POST', 'PATCH'].includes(method)) {
    const collection = adminCollectionMatch[1];
    if (!adminCollections.includes(collection)) {
      sendError(res, 404, 'Admin collection not found', 'ADMIN_COLLECTION_NOT_FOUND');
    } else if (!Object.prototype.hasOwnProperty.call(body, 'data')) {
      sendError(res, 400, 'Request body must include data field', 'ADMIN_INVALID_BODY');
    } else {
      state[collection] = body.data;
      sendJson(res, 200, { saved: true, collection, data: state[collection] });
    }
    return true;
  }

  if (method === 'POST' && pathname === '/api/admin/reset') {
    const fresh = bootstrap();
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, fresh);
    sendJson(res, 200, { reset: true, data: state });
    return true;
  }

  if (method === 'GET' && pathname === '/api/config') {
    sendJson(res, 200, state.configMeta);
    return true;
  }

  if (method === 'GET' && ['/api/user/profile', '/user/profile'].includes(pathname)) {
    sendJson(res, 200, { user: state.user });
    return true;
  }

  if (method === 'GET' && ['/api/user/balance', '/user/balance'].includes(pathname)) {
    sendJson(res, 200, { wallet: state.wallet });
    return true;
  }

  if (method === 'GET' && ['/api/games', '/game/list'].includes(pathname)) {
    sendJson(res, 200, { games: state.games.map(publicGame), gameList: state.games.map(publicGame) });
    return true;
  }

  const gameMatch = pathname.match(/^\/(?:api\/games|game)\/([^/]+)$/);
  if (method === 'GET' && gameMatch) {
    const game = getGame(gameMatch[1]);
    if (!game) sendError(res, 404, 'Game not found', 'GAME_NOT_FOUND');
    else sendJson(res, 200, { game: publicGame(game) });
    return true;
  }

  if (method === 'GET' && ['/api/tournaments', '/arena/list'].includes(pathname)) {
    const status = query.get('status');
    const tournaments = status ? state.tournaments.filter((item) => item.status === status) : state.tournaments;
    sendJson(res, 200, { tournaments, arenaList: tournaments });
    return true;
  }

  const tournamentMatch = pathname.match(/^\/api\/tournaments\/([^/]+)$/);
  if (method === 'GET' && tournamentMatch) {
    const tournament = getTournament(tournamentMatch[1]);
    if (!tournament) sendError(res, 404, 'Tournament not found', 'TOURNAMENT_NOT_FOUND');
    else sendJson(res, 200, { tournament });
    return true;
  }

  const joinTournamentMatch = pathname.match(/^\/(?:api\/tournaments|arena)\/([^/]+)\/join$/);
  if (method === 'POST' && joinTournamentMatch) {
    const tournament = getTournament(joinTournamentMatch[1]);
    if (!tournament) sendError(res, 404, 'Tournament not found', 'TOURNAMENT_NOT_FOUND');
    else {
      tournament.players = Math.min(tournament.capacity, tournament.players + 1);
      sendJson(res, 200, { joined: true, tournament, user: state.user });
    }
    return true;
  }

  if (method === 'GET' && ['/api/events', '/activity/list', '/activity/tasks'].includes(pathname)) {
    const type = query.get('type');
    const events = type ? state.events.filter((item) => item.type === type) : state.events;
    sendJson(res, 200, { events, tasks: events });
    return true;
  }

  const eventMatch = pathname.match(/^\/api\/events\/([^/]+)$/);
  if (method === 'GET' && eventMatch) {
    const event = getEvent(eventMatch[1]);
    if (!event) sendError(res, 404, 'Event not found', 'EVENT_NOT_FOUND');
    else sendJson(res, 200, { event });
    return true;
  }

  const claimEventMatch = pathname.match(/^\/api\/events\/([^/]+)\/claim$/);
  if (method === 'POST' && claimEventMatch) {
    const event = getEvent(claimEventMatch[1]);
    if (!event) sendError(res, 404, 'Event not found', 'EVENT_NOT_FOUND');
    else {
      event.completed = true;
      const result = applyWalletDelta({ coins: 5000, title: `Event reward: ${event.title}` });
      sendJson(res, 200, { claimed: true, event, ...result });
    }
    return true;
  }

  const eventMissionMatch = pathname.match(/^\/api\/events\/([^/]+)\/missions\/([^/]+)\/complete$/);
  if (method === 'POST' && eventMissionMatch) {
    const event = getEvent(eventMissionMatch[1]);
    if (!event) {
      sendError(res, 404, 'Event not found', 'EVENT_NOT_FOUND');
      return true;
    }
    const mission = (event.missions || []).find((item) => String(item.id || item.title) === decodeURIComponent(eventMissionMatch[2]));
    if (!mission) {
      sendError(res, 404, 'Mission not found', 'MISSION_NOT_FOUND');
      return true;
    }
    const step = Number(body.step || 1);
    const before = Number(mission.progress || 0);
    mission.progress = Math.min(Number(mission.target || before + step), before + step);
    const pointGain = mission.progress >= mission.target && before < mission.target
      ? Number(mission.points || 0)
      : Math.max(50, Math.floor(Number(mission.points || 100) * 0.1));
    event.progress = Math.min(Number(event.target || 0), Number(event.progress || 0) + pointGain);
    const current = (event.leaderboard || []).find((item) => item.current) || { name: state.user.nickname, points: 0, current: true };
    current.points = event.progress;
    if (!(event.leaderboard || []).some((item) => item.current)) event.leaderboard = [...(event.leaderboard || []), current];
    event.leaderboard.sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    event.rank = event.leaderboard.findIndex((item) => item.current) + 1;
    sendJson(res, 200, { completed: mission.progress >= mission.target, pointGain, event, leaderboard: event.leaderboard });
    return true;
  }

  const eventRankingMatch = pathname.match(/^\/api\/events\/([^/]+)\/ranking$/);
  if (method === 'GET' && eventRankingMatch) {
    const event = getEvent(eventRankingMatch[1]);
    if (!event) sendError(res, 404, 'Event not found', 'EVENT_NOT_FOUND');
    else sendJson(res, 200, { eventId: event.id, rank: event.rank, leaderboard: event.leaderboard || [], rankRewards: event.rankRewards || [] });
    return true;
  }

  if (method === 'POST' && pathname === '/activity/task/claim') {
    const event = getEvent(body.taskId);
    if (!event) sendError(res, 404, 'Task not found', 'TASK_NOT_FOUND');
    else {
      event.completed = true;
      const result = applyWalletDelta({ coins: 5000, title: `Activity reward: ${event.title}` });
      sendJson(res, 200, { claimed: true, task: event, ...result });
    }
    return true;
  }

  if (method === 'GET' && ['/api/shop/products', '/store/products'].includes(pathname)) {
    sendJson(res, 200, { shop: state.shop, products: state.shop });
    return true;
  }

  const productMatch = pathname.match(/^\/api\/shop\/products\/([^/]+)$/);
  if (method === 'GET' && productMatch) {
    const product = getProduct(productMatch[1]);
    if (!product) sendError(res, 404, 'Product not found', 'PRODUCT_NOT_FOUND');
    else sendJson(res, 200, { product });
    return true;
  }

  if (method === 'POST' && ['/api/shop/purchase', '/store/purchase'].includes(pathname)) {
    const product = getProduct(body.productId);
    const result = applyPurchase(product);
    if (!result) sendError(res, 404, 'Product not found', 'PRODUCT_NOT_FOUND');
    else sendJson(res, 200, { purchased: true, ...result });
    return true;
  }

  if (method === 'GET' && ['/api/leaderboard', '/leaderboard/winners'].includes(pathname)) {
    sendJson(res, 200, { leaderboard: state.leaderboard });
    return true;
  }

  if (method === 'GET' && pathname === '/api/jackpot') {
    sendJson(res, 200, { jackpot: state.jackpot });
    return true;
  }

  if (method === 'GET' && pathname === '/api/jackpot/slots') {
    const jackpotSlots = state.games.filter((game) => (
      game.category === 'Slots'
      && /jackpot|vault|top wins/i.test(`${game.tags?.join(' ')} ${game.features?.join(' ')} ${game.rules?.join(' ')}`)
    ));
    sendJson(res, 200, { games: jackpotSlots.length ? jackpotSlots : state.games.filter((game) => game.category === 'Slots') });
    return true;
  }

  if (method === 'GET' && pathname === '/api/daily-rewards') {
    sendJson(res, 200, { dailyRewards: state.dailyRewards });
    return true;
  }

  if (method === 'POST' && pathname === '/api/daily-rewards/makeup') {
    const cost = Number(body.cost || 1000);
    const reward = state.dailyRewards.find((item) => !item.collected) || state.dailyRewards.at(-1);
    if (reward) reward.collected = true;
    const result = applyWalletDelta({
      coins: Number(reward?.coins || 0) - cost,
      eventCoins: Number(reward?.eventCoins || 0),
      title: 'Daily reward make-up',
    });
    sendJson(res, 200, {
      madeUp: true,
      cost,
      reward,
      ...result,
    });
    return true;
  }

  if (method === 'GET' && pathname === '/api/wheel') {
    sendJson(res, 200, { wheel: state.wheel });
    return true;
  }

  const profileSectionMatch = pathname.match(/^\/api\/profile\/([^/]+)$/);
  if (method === 'GET' && profileSectionMatch) {
    const section = profileSectionMatch[1];
    if (section === 'wallet' || section === 'assets') {
      sendJson(res, 200, { wallet: state.wallet, transactions: state.profile.transactions });
    } else if (section === 'vip') {
      sendJson(res, 200, { vip: state.vip, status: state.vip?.active ? 'purchased' : 'not_purchased' });
    } else if (section in state.profile) {
      sendJson(res, 200, { section, data: state.profile[section] });
    } else {
      sendError(res, 404, 'Profile section not found', 'PROFILE_SECTION_NOT_FOUND');
    }
    return true;
  }

  if (method === 'POST' && pathname === '/api/profile/feedback') {
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!title || !content) {
      sendError(res, 400, 'Feedback title and content are required', 'FEEDBACK_INVALID_BODY');
      return true;
    }
    const feedback = {
      id: `fb-${Date.now()}`,
      title,
      content,
      status: 'open',
      time: nowLabel(),
    };
    state.profile.feedbacks = [feedback, ...(state.profile.feedbacks || [])];
    sendJson(res, 200, { submitted: true, feedback, feedbacks: state.profile.feedbacks });
    return true;
  }

  if (method === 'GET' && pathname === '/api/profile/vip') {
    sendJson(res, 200, { vip: state.vip });
    return true;
  }

  if (method === 'POST' && pathname === '/api/profile/vip/reward') {
    const level = String(body.level || state.vip.currentLevel || '').toUpperCase();
    const levelConfig = (state.vip.levels || []).find((item) => item.level === level);
    if (!levelConfig) {
      sendError(res, 404, 'VIP level not found', 'VIP_LEVEL_NOT_FOUND');
      return true;
    }
    if (levelConfig.status === 'locked') {
      sendError(res, 403, 'VIP level reward is locked', 'VIP_REWARD_LOCKED');
      return true;
    }
    if (levelConfig.status === 'claimed') {
      sendError(res, 409, 'VIP reward already claimed', 'VIP_REWARD_CLAIMED');
      return true;
    }
    levelConfig.status = 'claimed';
    const reward = levelConfig.dailyReward || {};
    const result = applyWalletDelta({
      coins: Number(reward.coins || 0),
      eventCoins: Number(reward.eventCoins || 0),
      title: `VIP ${level} daily reward`,
    });
    sendJson(res, 200, { claimed: true, vip: state.vip, ...result });
    return true;
  }

  const arenaLeaderboardMatch = pathname.match(/^\/arena\/([^/]+)\/leaderboard$/);
  if (method === 'GET' && arenaLeaderboardMatch) {
    sendJson(res, 200, {
      tournamentId: arenaLeaderboardMatch[1],
      leaderboard: state.leaderboard,
    });
    return true;
  }

  if (method === 'POST' && ['/api/checkin', '/activity/checkin'].includes(pathname)) {
    const result = applyWalletDelta({ coins: 1000, title: 'Daily check-in' });
    sendJson(res, 200, { checkedIn: true, reward: { coins: 1000 }, ...result });
    return true;
  }

  if (method === 'POST' && ['/api/wheel/spin', '/activity/wheel/spin'].includes(pathname)) {
    const result = applyWalletDelta({ coins: 188, title: 'Wheel spin reward' });
    sendJson(res, 200, { reward: { coins: 188 }, ...result });
    return true;
  }

  if (method === 'POST' && ['/api/redeem', '/store/redeem'].includes(pathname)) {
    const code = String(body.code || '').trim().toUpperCase();
    const config = (state.redeemCodes || []).find((item) => item.code === code);
    if (!config || !config.active || Number(config.used || 0) >= Number(config.maxUses || 0)) {
      sendError(res, 400, 'Invalid redeem code', 'INVALID_REDEEM_CODE');
    } else {
      config.used = Number(config.used || 0) + 1;
      const reward = config.reward || {};
      const result = applyWalletDelta({
        coins: Number(reward.coins || 0),
        eventCoins: Number(reward.eventCoins || 0),
        title: `Redeem code: ${code}`,
      });
      sendJson(res, 200, { redeemed: true, code, reward, redeemCode: config, ...result });
    }
    return true;
  }

  if (method === 'GET' && pathname === '/game/lobby/login') {
    sendJson(res, 200, {
      code: 0,
      service: 'cocogames-lobby',
      wsUrl: null,
      bootstrapUrl: '/api/lobby/bootstrap',
    });
    return true;
  }

  if (method === 'GET' && pathname === '/game/lobby/InitReq') {
    sendJson(res, 200, {
      code: 0,
      user: state.user,
      wallet: state.wallet,
      games: state.games.map(publicGame),
      gameList: state.games.map(publicGame),
    });
    return true;
  }

  if (method === 'GET' && pathname === '/ws/token') {
    sendJson(res, 200, {
      token: 'local-dev-token',
      wsUrl: null,
      expiresIn: 3600,
    });
    return true;
  }

  if (pathname.startsWith('/api/')) {
    sendError(res, 404, 'API route not found', 'NOT_FOUND');
    return true;
  }

  return false;
}

async function serveStatic(req, res, pathname) {
  if (!existsSync(distDir)) {
    sendJson(res, 503, {
      message: 'Frontend build not found. Run npm run build before npm start.',
    });
    return;
  }

  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  let filePath = path.normalize(path.join(distDir, requested));
  const relativePath = path.relative(distDir, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    sendError(res, 403, 'Forbidden', 'FORBIDDEN');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');
  } catch {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, headers({ 'Content-Type': mimeTypes[ext] || 'application/octet-stream' }));
  createReadStream(filePath).pipe(res);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const handled = await routeApi(req, res, url.pathname);
    if (!handled) await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
  }
}).listen(port, () => {
  console.log(`cocogames lobby server running at http://127.0.0.1:${port}`);
});
