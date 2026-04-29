/**
 * WebSocket Client
 * 处理与后端服务器的实时通信
 */

import { API_BASE_URL, get } from './httpClient';
import { getMessageType, waitForLoad } from "../proto/index.js"
import { playerStore } from './player.js';
// WebSocket 事件类型
export const WS_EVENTS = {
    // 连接状态
    InitReq: 'InitReq',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    RECONNECTING: 'reconnecting',

    // 游戏事件
    GAME_UPDATE: 'game_update',
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    JACKPOT_WIN: 'jackpot_win',
    BIG_WIN: 'big_win',

    // 赛事事件
    ARENA_UPDATE: 'arena_update',
    ARENA_START: 'arena_start',
    ARENA_END: 'arena_end',
    RANK_CHANGE: 'rank_change',

    // 活动事件
    ACTIVITY_START: 'activity_start',
    ACTIVITY_END: 'activity_end',

    // 余额事件
    BALANCE_UPDATE: 'balance_update',

    // 公告事件
    APNS_UPDATE: 'apns_update',

    // 消息
    MESSAGE: 'message',
    GetApnsReq: 'GetApnsReq',
};

/**
 * WebSocket 客户端类
 */
class WebSocketClient {
    constructor() {
        this.socket = null;
        this.url = '';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.pingInterval = null;
        this.pingIntervalTime = 30000; // 30秒发送一次心跳
        this.listeners = new Map();
        this.isConnected = false;
        this.shouldReconnect = true;
        this.authToken = null;
        this.encoder = new TextEncoder();
        this.decode = new TextDecoder();
        this.output = null;
        this.protoTypePos = 0;
        //状态码
        this.codePos = 1;
        //时间戳
        this.timestampPos = 2;
        //方法名称长度
        this.actionLenPos = 8;
        //方法名称
        this.actionPos = 9;
    }

    /**
     * 连接到 WebSocket 服务器
     */
    async connect(token = null) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            console.log('[WS] Already connected');
            return;
        }

        this.shouldReconnect = true;

        try {
            // Real lobby login already returns a ws/wss URL. Only call the token
            // endpoint when no URL was provided by the existing server.
            if (!token && !this.authToken) {
                const response = await get('/ws/token');
                this.authToken = response.token || response.data?.token;
            }

            // 构建 WebSocket URL
            const wsUrl = (token || this.authToken || '').replace('https://', 'wss://').replace('http://', 'ws://');
            this.url = wsUrl;

            console.log('[WS] Connecting to:', wsUrl);

            this.socket = new WebSocket(wsUrl);
            this.output = this.socket.output;
            this.setupEventHandlers();
        } catch (error) {
            console.error('[WS] Connection error:', error);
            this.emit(WS_EVENTS.ERROR, error);
            this.scheduleReconnect();
        }
    }

    /**
     * 设置 WebSocket 事件处理器
     */
    setupEventHandlers() {
        this.socket.onopen = () => {
            console.log('[WS] Connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.subscribInit();
            this.startPing();
            this.emit(WS_EVENTS.CONNECTED);
        };

        this.socket.onclose = (event) => {
            console.log('[WS] Disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.stopPing();
            this.emit(WS_EVENTS.DISCONNECTED, { code: event.code, reason: event.reason });

            if (this.shouldReconnect) {
                this.scheduleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('[WS] Error:', error);
            this.emit(WS_EVENTS.ERROR, error);
        };

        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };
    }



    /**
     * 处理接收到的消息
     */
    async handleMessage(data) {
        await waitForLoad();
        if (data instanceof Blob) {
            data = new Uint8Array(await data.arrayBuffer());
        } else if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
        }
        let action = this.decode.decode(data.slice(9, 9 + data[8]));//消息名称
        let ccc = data.slice(9 + data[8]);
        let l_ms = getMessageType(action);
        if (!l_ms) {
            console.warn(`[WS] Unknown message type: ${action}`);
            return;
        }
        const result = l_ms.decode(ccc);
        const json = l_ms.toObject(result, {
            longs: String,
            enums: String,
            defaults: true,
        });
        try {
            console.log('[WS] Message parsed:', json);
            switch (action) {
                case 'Pong':
                    // 心跳响应，忽略
                    break;

                case 'InitRet':
                    playerStore.init(json);
                    this.emit(WS_EVENTS.InitReq, json);
                    this.GetApnsReq();
                    break;

                case 'game_start':
                    this.emit(WS_EVENTS.GAME_START, json);
                    break;

                case 'game_end':
                    this.emit(WS_EVENTS.GAME_END, json);
                    break;

                case 'jackpot_win':
                    this.emit(WS_EVENTS.JACKPOT_WIN, json);
                    break;

                case 'big_win':
                    this.emit(WS_EVENTS.BIG_WIN, json);
                    break;

                case 'arena_update':
                    this.emit(WS_EVENTS.ARENA_UPDATE, json);
                    break;

                case 'arena_start':
                    this.emit(WS_EVENTS.ARENA_START, json);
                    break;

                case 'arena_end':
                    this.emit(WS_EVENTS.ARENA_END, json);
                    break;

                case 'rank_change':
                    this.emit(WS_EVENTS.RANK_CHANGE, json);
                    break;

                case 'activity_start':
                    this.emit(WS_EVENTS.ACTIVITY_START, json);
                    break;

                case 'activity_end':
                    this.emit(WS_EVENTS.ACTIVITY_END, json);
                    break;

                case 'balance_update':
                    this.emit(WS_EVENTS.BALANCE_UPDATE, json);
                    break;

                case 'GetApnsRet':
                    playerStore.setApnsList(json.apns || []);
                    this.emit(WS_EVENTS.APNS_UPDATE, json.apns);
                    break;

                default:
                    this.emit(WS_EVENTS.MESSAGE, json);
                    break;
            }
        } catch (error) {
            console.error('[WS] Failed to parse message:', error);
        }
    }


    stringFromBuffers(buffer, offset, byteLength) {
        if (buffer == null || buffer.length < offset + byteLength) {
            console.warn("长度不够")
        }
        let result = 0;
        for (let i = 0; i < byteLength; i++) {
            result |= buffer[offset + i] << (8 * (byteLength - i - 1));
        }
        return result;
    }
    /**
     * 发送消息到服务器
     */
    send(type, data = null) {
        if (this.socket?.readyState !== WebSocket.OPEN) {
            console.warn('[WS] Cannot send, not connected');
            return false;
        }
         let l_ms;
        if (!data) {
            data = new Uint8Array(0);
        }
        else
        {
             l_ms= getMessageType(type);
             var errMsg = l_ms.verify(data);
             if (errMsg) {
                throw new Error(errMsg);
             }
             var message1 = l_ms.create(data);
             data = l_ms.encode(message1).finish();
        }
        let stampValue = Date.now();
        let stmap = this.numberToUint8Array(stampValue);
        let arr = this.encoder.encode(type);
        let type1 = type.indexOf("Req");
        let c = [type1 == -1 ? 0 : 1, 0];
        let b = new Uint8Array(data.length + c.length + arr.length + stmap.length + 1);
        let index = 0;
        b.set(c, index);
        index += c.length;
        b.set(stmap, index);
        index += stmap.length;
        b.set([type.length], index);
        index += 1;
        b.set(arr, index);
        index += arr.length;
        if (data && data.length > 0) {
            b.set(data, index);
        }

        this.socket.send(b);
        return true;
    }

    subscribInit() {
        return this.send("InitReq")
    }

    GetApnsReq()
    {
        return this.send('GetApnsReq', { gid:0 });
    }


    /**
     * 订阅游戏更新
     */
    subscribeGame(gameId) {
        return this.send('subscribe_game', { gameId });
    }

    /**
     * 取消订阅游戏
     */
    unsubscribeGame(gameId) {
        return this.send('unsubscribe_game', { gameId });
    }

    /**
     * 订阅赛事更新
     */
    subscribeArena(arenaId) {
        return this.send('subscribe_arena', { arenaId });
    }

    /**
     * 取消订阅赛事
     */
    unsubscribeArena(arenaId) {
        return this.send('unsubscribe_arena', { arenaId });
    }

    /**
     * 订阅活动更新
     */
    subscribeActivity(activityId) {
        return this.send('subscribe_activity', { activityId });
    }

    /**
     * 开始心跳
     */
    startPing() {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('Ping');
            }
        }, this.pingIntervalTime);
    }

    /**
     * 停止心跳
     */
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * 计划重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[WS] Max reconnect attempts reached');
            this.emit(WS_EVENTS.ERROR, new Error('Max reconnection attempts reached'));
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.emit(WS_EVENTS.RECONNECTING, { attempt: this.reconnectAttempts, delay });

        setTimeout(() => {
            if (this.shouldReconnect) {
                this.connect(this.url || this.authToken);
            }
        }, delay);
    }

    /**
     * 断开连接
     */
    disconnect() {
        this.shouldReconnect = false;
        this.stopPing();

        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }

        this.isConnected = false;
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // 返回取消监听函数
        return () => this.off(event, callback);
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * 添加一次性事件监听器
     */
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        this.on(event, onceCallback);
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[WS] Event handler error (${event}):`, error);
                }
            });
        }
    }

    /**
     * 获取连接状态
     */
    getState() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            url: this.url,
        };
    }

    numberToUint8Array(num, len) {
        if (len == null || len === 0) {
            const s = num.toString(16);
            len = Math.ceil(s.length / 2);
        }

        const array = new Uint8Array(len);

        for (let i = len - 1; i >= 0; i--) {
            array[i] = num % 256;
            num = Math.floor(num / 256);
            if (num === 0) {
                break;
            }
        }

        return array;
    }
}

// 创建单例实例
export const wsClient = new WebSocketClient();

// React Hook for WebSocket
export function useWebSocket(event, callback) {
    // 在 React 组件中使用的方式
    // const handleJackpot = useCallback((data) => { ... }, []);
    // useWebSocket(WS_EVENTS.JACKPOT_WIN, handleJackpot);

    if (typeof window !== 'undefined') {
        wsClient.on(event, callback);
        return () => wsClient.off(event, callback);
    }
    return () => { };
}

export default wsClient;
