/**
 * 玩家数据管理模块
 * 统一管理玩家信息和游戏列表数据
 */

class PlayerStore {
    constructor() {
        // 玩家基本信息
        this.uid = '';
        this.nickname = '';
        this.avatar = '';
        this.token = 0;

        // 游戏列表
        this.gameList = [];

        // 公告列表 (APNS)
        this.apnsList = [];

        // 数据变更监听器
        this.listeners = new Map();
    }

    /**
     * 初始化玩家数据
     * @param {Object} data - InitRet 返回的数据
     */
    init(data) {
        if (data?.user) {
            this.uid = data.user.uid || '';
            this.nickname = data.user.nickname || '';
            this.avatar = data.user.avatar || '';
            this.token = data.user.token || 0;
            this.emit('userUpdate', this.getUser());
        }

        if (data?.gameList) {
            this.gameList = data.gameList.map((game) => ({
                id: game.id || 0,
                name: game.name || '',
                icon: game.icon || '',
                url: game.url || '',
                type: game.type || 0,
            }));
            this.emit('gameListUpdate', this.gameList);
        }

        console.log('[Player] Initialized:', this.getUser());
        console.log('[Player] Games loaded:', this.gameList.length);
    }

    /**
     * 获取玩家基本信息
     */
    getUser() {
        return {
            uid: this.uid,
            nickname: this.nickname,
            avatar: this.avatar,
            token: this.token,
        };
    }

    /**
     * 获取游戏列表
     */
    getGameList() {
        return [...this.gameList];
    }

    /**
     * 根据游戏ID获取游戏
     */
    getGameById(id) {
        return this.gameList.find((game) => game.id === id) || null;
    }

    /**
     * 根据游戏类型获取游戏列表
     */
    getGamesByType(type) {
        return this.gameList.filter((game) => game.type === type);
    }

    /**
     * 设置公告列表
     */
    setApnsList(apns) {
        this.apnsList = apns.map((item) => ({
            nickname: item.nickname || '',
            amount: item.amount || 0,
            gid: item.gid || 0,
            avatar: item.avatar || '',
        }));
        this.emit('apnsUpdate', this.apnsList);
        console.log('[Player] APNS loaded:', this.apnsList.length);
    }

    /**
     * 获取公告列表
     */
    getApnsList() {
        return [...this.apnsList];
    }

    /**
     * 更新玩家金币/活动币
     */
    updateBalance(coins, activityCoins) {
        this.emit('balanceUpdate', { coins, activityCoins });
    }

    /**
     * 重置玩家数据
     */
    reset() {
        this.uid = '';
        this.nickname = '';
        this.avatar = '';
        this.token = 0;
        this.gameList = [];
        this.emit('reset', null);
    }

    /**
     * 添加数据变更监听器
     * @param {string} event - 事件名称: userUpdate, gameListUpdate, balanceUpdate, reset
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    /**
     * 移除监听器
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
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
                    console.error(`[Player] Event handler error (${event}):`, error);
                }
            });
        }
    }
}

// 创建单例实例
export const playerStore = new PlayerStore();
export default playerStore;
