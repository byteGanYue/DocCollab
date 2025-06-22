/**
 * API使用示例文件
 * 演示如何使用DocCollab项目中的各种API，特别是文件夹相关的新API
 */

import { folderAPI } from './api.jsx';

/**
 * 文件夹操作示例
 */
export class FolderAPIExamples {
  /**
   * 创建文件夹示例
   * @param {Object} folderData - 文件夹数据
   * @param {string} folderData.folderName - 文件夹名称
   * @param {number} folderData.userId - 用户ID
   * @param {string} folderData.create_username - 创建者用户名
   * @param {string[]} folderData.parentFolderIds - 父文件夹ID数组
   * @returns {Promise} 创建结果
   */
  static async createFolder(folderData) {
    try {
      console.log('开始创建文件夹:', folderData);
      const result = await folderAPI.createFolder(folderData);
      console.log('文件夹创建成功:', result);
      return result;
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件夹示例（使用自增folderId）- 推荐方法
   * @param {number} folderId - 自增的文件夹ID
   * @param {string} newFolderName - 新的文件夹名称
   * @returns {Promise} 更新结果
   */
  static async updateFolderByFolderId(folderId, newFolderName) {
    try {
      console.log(`开始更新文件夹 ID: ${folderId}, 新名称: ${newFolderName}`);

      const updateData = {
        folderName: newFolderName,
      };

      const result = await folderAPI.updateFolder(folderId, updateData);
      console.log('文件夹更新成功:', result);
      return result;
    } catch (error) {
      console.error('更新文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件夹示例（使用MongoDB ID）- 兼容旧代码
   * @param {string} mongoId - MongoDB的ObjectId
   * @param {string} newFolderName - 新的文件夹名称
   * @returns {Promise} 更新结果
   */
  static async updateFolderByMongoId(mongoId, newFolderName) {
    try {
      console.log(
        `开始更新文件夹 MongoDB ID: ${mongoId}, 新名称: ${newFolderName}`,
      );

      const updateData = {
        folderName: newFolderName,
      };

      const result = await folderAPI.updateFolderById(mongoId, updateData);
      console.log('文件夹更新成功:', result);
      return result;
    } catch (error) {
      console.error('更新文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件夹详情示例（使用自增folderId）
   * @param {number} folderId - 自增的文件夹ID
   * @returns {Promise} 文件夹详情
   */
  static async getFolderDetailsByFolderId(folderId) {
    try {
      console.log(`开始获取文件夹详情 ID: ${folderId}`);
      const result = await folderAPI.getFolderByFolderId(folderId);
      console.log('获取文件夹详情成功:', result);
      return result;
    } catch (error) {
      console.error('获取文件夹详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件夹详情示例（使用MongoDB ID）
   * @param {string} mongoId - MongoDB的ObjectId
   * @returns {Promise} 文件夹详情
   */
  static async getFolderDetailsByMongoId(mongoId) {
    try {
      console.log(`开始获取文件夹详情 MongoDB ID: ${mongoId}`);
      const result = await folderAPI.getFolder(mongoId);
      console.log('获取文件夹详情成功:', result);
      return result;
    } catch (error) {
      console.error('获取文件夹详情失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件夹示例（使用自增folderId）- 推荐使用此方法
   * @param {number} folderId - 自增的文件夹ID
   * @returns {Promise} 删除结果
   */
  static async deleteFolderByFolderId(folderId) {
    try {
      console.log(`开始删除文件夹 自增ID: ${folderId}`);
      const result = await folderAPI.deleteFolderByFolderId(folderId);
      console.log('文件夹删除成功:', result);
      console.log(
        `删除统计 - 文件夹: ${result.data.deletedFoldersCount}, 文档: ${result.data.deletedDocumentsCount}`,
      );
      return result;
    } catch (error) {
      console.error('删除文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件夹示例（使用MongoDB ID）- 兼容旧代码
   * @param {string} mongoId - MongoDB的ObjectId
   * @returns {Promise} 删除结果
   */
  static async deleteFolderByMongoId(mongoId) {
    try {
      console.log(`开始删除文件夹 MongoDB ID: ${mongoId}`);
      const result = await folderAPI.deleteFolder(mongoId);
      console.log('文件夹删除成功:', result);
      console.log(
        `删除统计 - 文件夹: ${result.data.deletedFoldersCount}, 文档: ${result.data.deletedDocumentsCount}`,
      );
      return result;
    } catch (error) {
      console.error('删除文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 完整的文件夹操作流程示例
   * @param {number} userId - 用户ID
   * @param {string} username - 用户名
   * @returns {Promise} 操作结果
   */
  static async completeWorkflow(userId, username) {
    try {
      console.log('开始完整的文件夹操作流程...');

      // 1. 创建根文件夹
      const rootFolderData = {
        folderName: '我的项目',
        userId: userId,
        create_username: username,
        parentFolderIds: [],
      };

      const rootFolder = await this.createFolder(rootFolderData);
      const rootFolderId = rootFolder.data.autoFolderId; // 使用自增ID
      console.log(`根文件夹创建成功，自增ID: ${rootFolderId}`);

      // 2. 更新根文件夹名称
      const updatedRootFolder = await this.updateFolderByFolderId(
        rootFolderId,
        '我的重要项目',
      );
      console.log('根文件夹名称更新成功');

      // 3. 获取更新后的文件夹详情
      const folderDetails = await this.getFolderDetailsByFolderId(rootFolderId);
      console.log('获取文件夹详情成功');

      // 4. 创建子文件夹
      const subFolderData = {
        folderName: '子项目A',
        userId: userId,
        create_username: username,
        parentFolderIds: [updatedRootFolder.data.folderId], // 使用MongoDB ID作为父级
      };

      const subFolder = await this.createFolder(subFolderData);
      const subFolderId = subFolder.data.autoFolderId;
      console.log(`子文件夹创建成功，自增ID: ${subFolderId}`);

      // 5. 更新子文件夹名称
      await this.updateFolderByFolderId(subFolderId, '重要的子项目A');
      console.log('子文件夹名称更新成功');

      console.log('完整的文件夹操作流程执行成功！');

      return {
        success: true,
        rootFolder: updatedRootFolder,
        subFolder: subFolder,
        folderDetails: folderDetails,
      };
    } catch (error) {
      console.error('文件夹操作流程失败:', error);
      throw error;
    }
  }
}

/**
 * API使用注意事项和最佳实践
 */
export const APIBestPractices = {
  /**
   * 文件夹ID使用建议
   */
  folderIdUsage: {
    // 推荐：使用自增folderId进行更新操作
    recommendedUpdate: async (folderId, folderName) => {
      return await folderAPI.updateFolder(folderId, { folderName });
    },

    // 推荐：使用自增folderId进行删除操作
    recommendedDelete: async folderId => {
      return await folderAPI.deleteFolderByFolderId(folderId);
    },

    // 兼容：使用MongoDB ID进行更新操作（用于兼容旧代码）
    legacyUpdate: async (mongoId, folderName) => {
      return await folderAPI.updateFolderById(mongoId, { folderName });
    },

    // 兼容：使用MongoDB ID进行删除操作（用于兼容旧代码）
    legacyDelete: async mongoId => {
      return await folderAPI.deleteFolder(mongoId);
    },
  },

  /**
   * 错误处理示例
   */
  errorHandling: async (folderId, folderName) => {
    try {
      const result = await folderAPI.updateFolder(folderId, { folderName });
      return result;
    } catch (error) {
      // 根据错误类型进行不同处理
      if (error.message.includes('文件夹不存在')) {
        console.error('文件夹ID无效或文件夹已被删除');
        // 处理文件夹不存在的情况
      } else if (error.message.includes('同名文件夹')) {
        console.error('同级目录下已存在同名文件夹');
        // 处理重名冲突
      } else if (error.message.includes('无效的文件夹ID')) {
        console.error('提供的文件夹ID格式不正确');
        // 处理ID格式错误
      } else {
        console.error('未知错误:', error);
        // 处理其他错误
      }
      throw error;
    }
  },

  /**
   * 批量操作示例
   */
  batchOperations: async folderUpdates => {
    const results = [];
    const errors = [];

    for (const update of folderUpdates) {
      try {
        const result = await folderAPI.updateFolder(update.folderId, {
          folderName: update.newName,
        });
        results.push(result);
      } catch (error) {
        errors.push({
          folderId: update.folderId,
          error: error.message,
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      total: folderUpdates.length,
      successCount: results.length,
      errorCount: errors.length,
    };
  },
};

// 导出默认使用示例
export default FolderAPIExamples;
