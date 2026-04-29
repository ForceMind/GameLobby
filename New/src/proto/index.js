/**
 * Proto 文件初始化模块
 * 在应用启动时加载所有 proto 文件
 */

import protobuf from 'protobufjs';

// Proto 根对象
let lobbyRoot = null;
let isLoading = false;
let loadPromise = null;

/**
 * 加载 lobby.proto
 */
export async function loadLobbyProto() {
    // Load once and reuse the same root for all WebSocket message decoding.
    if (lobbyRoot) {
        return lobbyRoot;
    }

    if (loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    loadPromise = protobuf.load('/proto/lobby.proto')
        .then(root => {
            lobbyRoot = root;
            console.log('[Proto] lobby.proto loaded successfully');
            return root;
        })
        .catch(err => {
            console.error('[Proto] Failed to load lobby.proto:', err);
            loadPromise = null;
            throw err;
        })
        .finally(() => {
            isLoading = false;
        });

    return loadPromise;
}

/**
 * 获取已加载的 Proto 根对象
 */
export function getLobbyRoot() {
    return lobbyRoot;
}

export function isProtoLoading() {
    return isLoading;
}

/**
 * 获取消息类型
 */
export function getMessageType(typeName) {
    if (!lobbyRoot) {
        console.warn(`[Proto] Proto not loaded, cannot get type: ${typeName}`);
        return null;
    }
    return lobbyRoot.lookupType(typeName);
}

/**
 * 编码消息
 */
export function encodeMessage(typeName, data) {
    const Message = getMessageType(typeName);
    if (!Message) {
        throw new Error(`Message type "${typeName}" not found`);
    }

    const err = Message.verify(data);
    if (err) {
        throw new Error(err);
    }

    const message = Message.create(data);
    return Message.encode(message).finish();
}

/**
 * 解码消息
 */
export function decodeMessage(typeName, buffer) {
    const Message = getMessageType(typeName);
    if (!Message) {
        throw new Error(`Message type "${typeName}" not found`);
    }

    if (buffer instanceof Blob) {
        buffer = new Uint8Array(buffer.arrayBuffer());
    } else if (!(buffer instanceof Uint8Array)) {
        buffer = new Uint8Array(buffer);
    }

    const result = Message.decode(buffer);
    return Message.toObject(result, {
        longs: String,
        enums: String,
        defaults: true,
    });
}

/**
 * 检查是否已加载
 */
export function isProtoLoaded() {
    return lobbyRoot !== null;
}

/**
 * 等待加载完成
 */
export function waitForLoad() {
    if (lobbyRoot) {
        return Promise.resolve(lobbyRoot);
    }
    return loadLobbyProto();
}

export default {
    loadLobbyProto,
    getLobbyRoot,
    isProtoLoading,
    getMessageType,
    encodeMessage,
    decodeMessage,
    isProtoLoaded,
    waitForLoad,
};
