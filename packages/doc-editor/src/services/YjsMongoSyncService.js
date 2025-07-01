/**
 * Yjs与MongoDB数据同步服务
 * 提供实时的、事件驱动的数据同步机制
 * 避免使用定时器，采用更高效的同步策略
 */

// 浏览器兼容的 EventEmitter 实现
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }

  off(event, listener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * Yjs与MongoDB同步服务类
 * 负责协调本地IndexedDB、Yjs文档状态和MongoDB数据库之间的数据同步
 */
export class YjsMongoSyncService extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      // 同步延迟配置（毫秒）
      syncDelay: 1000,
      // 批量同步的最大文档数
      batchSize: 10,
      // 重试配置
      maxRetries: 3,
      retryDelay: 2000,
      // API端点配置
      apiBaseUrl: options.apiBaseUrl || 'http://localhost:3000/api',
      // 调试模式
      debug: options.debug || false,
      ...options,
    };

    // 同步队列和状态管理
    this.syncQueue = new Map(); // documentId -> syncTask
    this.activeSyncs = new Set(); // 正在同步的文档ID
    this.lastSyncTimes = new Map(); // documentId -> timestamp
    this.retryCounters = new Map(); // documentId -> retryCount

    // 性能监控
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0,
    };

    this.log('YjsMongoSyncService 初始化完成');
  }

  /**
   * 日志记录方法
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  log(message, data = {}) {
    if (this.options.debug) {
      console.log(`[YjsMongoSync] ${message}`, data);
    }
  }

  /**
   * 注册文档同步
   * 为指定文档建立Yjs与MongoDB的同步机制
   * @param {number} documentId - 文档ID
   * @param {Y.Doc} ydoc - Yjs文档实例
   * @param {Object} options - 同步选项
   */
  async registerDocumentSync(documentId, ydoc, options = {}) {
    try {
      this.log(`注册文档同步: ${documentId}`);

      const syncConfig = {
        documentId,
        ydoc,
        userId: options.userId,
        username: options.username,
        lastSyncTime: Date.now(),
        syncEnabled: true,
        ...options,
      };

      // 设置Yjs文档变更监听
      this.setupYjsChangeListener(syncConfig);

      // 设置IndexedDB持久化
      await this.setupIndexedDBPersistence(syncConfig);

      // 执行初始同步
      await this.performInitialSync(syncConfig);

      this.emit('documentRegistered', { documentId, success: true });
      this.log(`文档 ${documentId} 同步注册成功`);
    } catch (error) {
      this.log(`文档 ${documentId} 同步注册失败:`, error);
      this.emit('documentRegistered', { documentId, success: false, error });
      throw error;
    }
  }

  /**
   * 设置Yjs文档变更监听器
   * @param {Object} syncConfig - 同步配置
   */
  setupYjsChangeListener(syncConfig) {
    const { documentId, ydoc } = syncConfig;

    // 监听文档内容变更
    ydoc.on('update', (update, origin) => {
      // 避免同步循环（忽略来自网络的更新）
      if (origin === 'network' || origin === 'mongodb-sync') {
        return;
      }

      this.log(`文档 ${documentId} 内容发生变更`, { origin });
      this.scheduleSync(syncConfig, 'content-change');
    });

    // 监听子文档变更（如评论）
    ydoc.on('subdocs', ({ added, removed }) => {
      if (added.size > 0 || removed.size > 0) {
        this.log(`文档 ${documentId} 子文档发生变更`, {
          added: added.size,
          removed: removed.size,
        });
        this.scheduleSync(syncConfig, 'subdoc-change');
      }
    });
  }

  /**
   * 设置IndexedDB持久化
   * @param {Object} syncConfig - 同步配置
   */
  async setupIndexedDBPersistence(syncConfig) {
    const { documentId, ydoc } = syncConfig;

    try {
      // 创建IndexedDB持久化实例
      const indexeddbProvider = new IndexeddbPersistence(
        `doc-${documentId}`,
        ydoc,
      );

      // 等待IndexedDB同步完成
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('IndexedDB同步超时'));
        }, 10000);

        indexeddbProvider.on('synced', () => {
          clearTimeout(timeout);
          this.log(`文档 ${documentId} IndexedDB同步完成`);
          resolve();
        });
      });

      syncConfig.indexeddbProvider = indexeddbProvider;
    } catch (error) {
      this.log(`文档 ${documentId} IndexedDB设置失败:`, error);
      throw error;
    }
  }

  /**
   * 执行初始同步
   * 从MongoDB加载最新数据并与本地Yjs文档同步
   * @param {Object} syncConfig - 同步配置
   */
  async performInitialSync(syncConfig) {
    const { documentId, ydoc, userId } = syncConfig;

    try {
      this.log(`开始文档 ${documentId} 的初始同步`);

      // 从MongoDB获取最新文档数据
      const mongoDocument = await this.fetchDocumentFromMongo(
        documentId,
        userId,
      );

      if (mongoDocument && mongoDocument.content) {
        // 检查MongoDB内容是否比本地Yjs内容更新
        const mongoUpdateTime = new Date(mongoDocument.update_time).getTime();
        const localUpdateTime = this.lastSyncTimes.get(documentId) || 0;

        if (mongoUpdateTime > localUpdateTime) {
          this.log(`MongoDB内容更新，同步到Yjs文档 ${documentId}`);
          await this.applyMongoContentToYjs(ydoc, mongoDocument.content);
          this.lastSyncTimes.set(documentId, mongoUpdateTime);
        }
      }

      this.log(`文档 ${documentId} 初始同步完成`);
    } catch (error) {
      this.log(`文档 ${documentId} 初始同步失败:`, error);
      // 初始同步失败不应该阻止文档注册
    }
  }

  /**
   * 调度同步任务
   * 使用防抖机制避免频繁同步
   * @param {Object} syncConfig - 同步配置
   * @param {string} reason - 同步原因
   */
  scheduleSync(syncConfig, reason) {
    const { documentId } = syncConfig;

    // 清除之前的同步任务
    if (this.syncQueue.has(documentId)) {
      clearTimeout(this.syncQueue.get(documentId).timeoutId);
    }

    // 创建新的同步任务
    const syncTask = {
      syncConfig,
      reason,
      scheduledTime: Date.now(),
      timeoutId: setTimeout(() => {
        this.executeSyncTask(documentId);
      }, this.options.syncDelay),
    };

    this.syncQueue.set(documentId, syncTask);
    this.log(`调度文档 ${documentId} 同步任务`, { reason });
  }

  /**
   * 执行同步任务
   * @param {number} documentId - 文档ID
   */
  async executeSyncTask(documentId) {
    // 检查是否已在同步中
    if (this.activeSyncs.has(documentId)) {
      this.log(`文档 ${documentId} 正在同步中，跳过`);
      return;
    }

    const syncTask = this.syncQueue.get(documentId);
    if (!syncTask) {
      return;
    }

    this.activeSyncs.add(documentId);
    this.syncQueue.delete(documentId);

    const startTime = Date.now();

    try {
      await this.performSync(syncTask.syncConfig, syncTask.reason);

      // 更新统计信息
      this.syncStats.totalSyncs++;
      this.syncStats.successfulSyncs++;
      const syncTime = Date.now() - startTime;
      this.syncStats.averageSyncTime =
        (this.syncStats.averageSyncTime * (this.syncStats.totalSyncs - 1) +
          syncTime) /
        this.syncStats.totalSyncs;

      // 重置重试计数器
      this.retryCounters.delete(documentId);

      this.emit('syncCompleted', { documentId, success: true, syncTime });
    } catch (error) {
      this.log(`文档 ${documentId} 同步失败:`, error);

      // 更新统计信息
      this.syncStats.totalSyncs++;
      this.syncStats.failedSyncs++;

      // 处理重试逻辑
      await this.handleSyncFailure(documentId, syncTask, error);
    } finally {
      this.activeSyncs.delete(documentId);
    }
  }

  /**
   * 执行实际的同步操作
   * @param {Object} syncConfig - 同步配置
   * @param {string} reason - 同步原因
   */
  async performSync(syncConfig, reason) {
    const { documentId, ydoc, userId, username } = syncConfig;

    this.log(`开始同步文档 ${documentId}`, { reason });

    // 获取Yjs文档的当前状态
    const yjsState = Y.encodeStateAsUpdate(ydoc);
    const yjsContent = this.extractContentFromYjs(ydoc);

    // 构建同步数据
    const syncData = {
      documentId,
      content: yjsContent,
      yjsState: Array.from(yjsState), // 转换为数组以便JSON序列化
      updateTime: new Date().toISOString(),
      updateUsername: username,
      syncReason: reason,
    };

    // 发送到MongoDB
    await this.syncToMongo(syncData, userId);

    // 更新最后同步时间
    this.lastSyncTimes.set(documentId, Date.now());

    this.log(`文档 ${documentId} 同步完成`);
  }

  /**
   * 从Yjs文档提取内容
   * @param {Y.Doc} ydoc - Yjs文档
   * @returns {string} 提取的内容
   */
  extractContentFromYjs(ydoc) {
    try {
      // 获取主要的文本内容
      const yText = ydoc.getText('content');
      if (yText) {
        return yText.toString();
      }

      // 如果没有文本内容，尝试获取其他类型的内容
      const yArray = ydoc.getArray('content');
      if (yArray && yArray.length > 0) {
        return JSON.stringify(yArray.toArray());
      }

      return '';
    } catch (error) {
      this.log('提取Yjs内容失败:', error);
      return '';
    }
  }

  /**
   * 将内容应用到Yjs文档
   * @param {Y.Doc} ydoc - Yjs文档
   * @param {string} content - 要应用的内容
   */
  async applyMongoContentToYjs(ydoc, content) {
    try {
      ydoc.transact(() => {
        const yText = ydoc.getText('content');

        // 清除现有内容
        if (yText.length > 0) {
          yText.delete(0, yText.length);
        }

        // 插入新内容
        if (content) {
          yText.insert(0, content);
        }
      }, 'mongodb-sync'); // 标记为来自MongoDB的同步
    } catch (error) {
      this.log('应用MongoDB内容到Yjs失败:', error);
      throw error;
    }
  }

  /**
   * 从MongoDB获取文档数据
   * @param {number} documentId - 文档ID
   * @param {number} userId - 用户ID
   * @returns {Object} 文档数据
   */
  async fetchDocumentFromMongo(documentId, userId) {
    try {
      // 获取文档基本信息
      const docResponse = await fetch(
        `${this.options.apiBaseUrl}/document/getDocumentById/${documentId}?userId=${userId}`,
      );

      if (!docResponse.ok) {
        throw new Error(
          `HTTP ${docResponse.status}: ${docResponse.statusText}`,
        );
      }

      const docResult = await docResponse.json();

      if (!docResult.success) {
        throw new Error(docResult.message || '获取文档失败');
      }

      const documentData = docResult.data;

      // 尝试获取Yjs状态数据
      try {
        const yjsResponse = await fetch(
          `${this.options.apiBaseUrl}/document/${documentId}/yjs-state`,
        );

        if (yjsResponse.ok) {
          const yjsResult = await yjsResponse.json();

          if (yjsResult.success && yjsResult.data) {
            // 合并文档数据和Yjs状态数据
            documentData.yjsState = yjsResult.data.yjsState;
            documentData.lastYjsSyncTime = yjsResult.data.lastYjsSyncTime;
            documentData.lastSyncSource = yjsResult.data.lastSyncSource;

            this.log(`获取文档 ${documentId} 的Yjs状态成功`, {
              yjsStateLength: yjsResult.data.yjsState?.length || 0,
            });
          }
        }
      } catch (yjsError) {
        // Yjs状态获取失败不应该影响文档数据获取
        this.log(`获取文档 ${documentId} 的Yjs状态失败:`, yjsError);
      }

      return documentData;
    } catch (error) {
      this.log(`从MongoDB获取文档 ${documentId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 同步数据到MongoDB
   * @param {Object} syncData - 同步数据
   * @param {number} userId - 用户ID
   */
  async syncToMongo(syncData, userId) {
    try {
      // 使用新的Yjs同步API端点
      const response = await fetch(
        `${this.options.apiBaseUrl}/document/${syncData.documentId}/sync-yjs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            yjsState: syncData.yjsState,
            content: syncData.content,
            username: syncData.updateUsername,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '同步到MongoDB失败');
      }

      this.log(`文档 ${syncData.documentId} 成功同步到MongoDB`, {
        contentLength: syncData.content?.length || 0,
        yjsStateLength: syncData.yjsState?.length || 0,
      });
    } catch (error) {
      this.log(`同步文档 ${syncData.documentId} 到MongoDB失败:`, error);
      throw error;
    }
  }

  /**
   * 处理同步失败
   * @param {number} documentId - 文档ID
   * @param {Object} syncTask - 同步任务
   * @param {Error} error - 错误信息
   */
  async handleSyncFailure(documentId, syncTask, error) {
    const retryCount = this.retryCounters.get(documentId) || 0;

    if (retryCount < this.options.maxRetries) {
      // 增加重试计数
      this.retryCounters.set(documentId, retryCount + 1);

      // 计算重试延迟（指数退避）
      const retryDelay = this.options.retryDelay * Math.pow(2, retryCount);

      this.log(
        `文档 ${documentId} 同步失败，${retryDelay}ms后重试 (${retryCount + 1}/${this.options.maxRetries})`,
      );

      // 调度重试
      setTimeout(() => {
        this.syncQueue.set(documentId, syncTask);
        this.executeSyncTask(documentId);
      }, retryDelay);
    } else {
      // 达到最大重试次数，放弃同步
      this.log(`文档 ${documentId} 同步失败，已达到最大重试次数`);
      this.retryCounters.delete(documentId);

      this.emit('syncFailed', {
        documentId,
        error,
        retryCount: this.options.maxRetries,
      });
    }
  }

  /**
   * 取消文档同步
   * @param {number} documentId - 文档ID
   */
  unregisterDocumentSync(documentId) {
    this.log(`取消文档 ${documentId} 的同步`);

    // 清除同步队列
    if (this.syncQueue.has(documentId)) {
      clearTimeout(this.syncQueue.get(documentId).timeoutId);
      this.syncQueue.delete(documentId);
    }

    // 清除重试计数器
    this.retryCounters.delete(documentId);

    // 清除最后同步时间
    this.lastSyncTimes.delete(documentId);

    this.emit('documentUnregistered', { documentId });
  }

  /**
   * 获取同步统计信息
   * @returns {Object} 统计信息
   */
  getSyncStats() {
    return {
      ...this.syncStats,
      activeDocuments: this.syncQueue.size,
      activeSyncs: this.activeSyncs.size,
      pendingRetries: this.retryCounters.size,
    };
  }

  /**
   * 强制同步指定文档
   * @param {number} documentId - 文档ID
   */
  async forceSyncDocument(documentId) {
    const syncTask = this.syncQueue.get(documentId);
    if (syncTask) {
      clearTimeout(syncTask.timeoutId);
      await this.executeSyncTask(documentId);
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    this.log('销毁YjsMongoSyncService');

    // 清除所有同步任务
    for (const [documentId, syncTask] of this.syncQueue) {
      clearTimeout(syncTask.timeoutId);
    }

    this.syncQueue.clear();
    this.activeSyncs.clear();
    this.lastSyncTimes.clear();
    this.retryCounters.clear();

    this.removeAllListeners();
  }
}

// 导出单例实例
export const yjsMongoSyncService = new YjsMongoSyncService();
