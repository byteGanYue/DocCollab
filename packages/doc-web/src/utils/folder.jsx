import { EllipsisLabel } from '@/components/layout/folderMenu';
class folderUtils {
  /**
   * 根据键名修改树形结构中指定节点的名称
   *
   * @param list 树形结构的数据列表
   * @param targetKey 需要修改名称的节点的键名
   * @param newName 新的节点名称
   * @returns 修改后的树形结构的数据列表
   */
  static renameNodeByKey(list, targetKey, newName) {
    const result = list.map(item => {
      if (item.key === targetKey) {
        return {
          ...item,
          label: <EllipsisLabel text={newName} />,
          isNew: false, // 重命名完成后清除新建标记
        };
      } else if (item.children) {
        return {
          ...item,
          children: folderUtils.renameNodeByKey(
            item.children,
            targetKey,
            newName,
          ),
        };
      }
      return item;
    });

    return result;
  }

  /**
   * 根据指定的键删除节点
   *
   * @param list 要操作的列表
   * @param targetKey 要删除的节点的键
   * @returns 返回删除指定键节点后的新列表
   */
  static deleteNodeByKey(list, targetKey) {
    const result = list.filter(item => {
      if (item.key === targetKey) return false;
      if (item.children) {
        item.children = folderUtils.deleteNodeByKey(item.children, targetKey);
      }
      return true;
    });

    return result;
  }

  /**
   * 将新节点插入到目标键对应的节点下的子节点数组中
   *
   * @param list 待处理的节点列表
   * @param targetKey 目标键，用于确定插入位置
   * @param newNode 要插入的新节点
   * @returns 返回处理后的节点列表
   */
  static insertToTarget(list, targetKey, newNode) {
    const result = list.map(item => {
      if (item.key === targetKey) {
        // 找到目标文件夹，插入到children
        return {
          ...item,
          children: [...(item.children || []), newNode],
        };
      } else if (item.children) {
        // 递归子节点
        return {
          ...item,
          children: folderUtils.insertToTarget(
            item.children,
            targetKey,
            newNode,
          ),
        };
      }
      return item;
    });

    return result;
  }

  /**
   * 根据键查找指定节点
   *
   * @param list 要搜索的节点列表
   * @param targetKey 目标节点的键
   * @returns 返回找到的节点，如果未找到则返回null
   */
  static findNodeByKey(list, targetKey) {
    for (const item of list) {
      if (item.key === targetKey) {
        return item;
      }
      if (item.children) {
        const found = folderUtils.findNodeByKey(item.children, targetKey);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * 根据子节点的键查找其父节点
   *
   * @param list 要搜索的节点列表
   * @param childKey 子节点的键
   * @param parentKey 当前层级的父节点键（用于递归）
   * @returns 返回找到的父节点，如果未找到则返回null
   */
  static findParentNodeByKey(list, childKey, parentKey = null) {
    for (const item of list) {
      // 如果在当前层级找到了目标子节点，返回父节点
      if (item.key === childKey) {
        return parentKey ? folderUtils.findNodeByKey(list, parentKey) : null;
      }

      // 如果当前节点有子节点，递归搜索
      if (item.children) {
        // 检查子节点中是否直接包含目标节点
        const directChild = item.children.find(child => child.key === childKey);
        if (directChild) {
          return item; // 当前节点就是父节点
        }

        // 递归搜索更深层的子节点
        const found = folderUtils.findParentNodeByKey(
          item.children,
          childKey,
          item.key,
        );
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * 获取适合新建文件/文件夹的目标文件夹键
   *
   * @param list 节点列表
   * @param selectedKey 当前选中的节点键
   * @param openKeys 当前展开的节点键数组
   * @returns 返回目标文件夹的键，优先选择文件夹类型的节点
   */
  static getValidTargetKey(list, selectedKey, openKeys) {
    // 如果没有选中任何项，默认在"我的文件夹"根目录创建
    if (!selectedKey) {
      return 'root';
    }

    // 如果选中的是特殊菜单项（首页、最近访问、协同文档），在"我的文件夹"根目录创建
    if (['home', 'recent-docs', 'collaboration'].includes(selectedKey)) {
      return 'root';
    }

    // 如果选中的是"我的文件夹"根节点，在根目录创建
    if (selectedKey === 'root') {
      return 'root';
    }

    // 如果选中的是文件夹（包括子文件夹），直接在该文件夹下创建
    // 文件夹的key通常是MongoDB ObjectId（24位十六进制字符串）或者数字ID
    const isFolderKey =
      !selectedKey.startsWith('doc_') &&
      !selectedKey.startsWith('doc') &&
      !selectedKey.includes('collab_user_') &&
      !['home', 'recent-docs', 'collaboration', 'root'].includes(selectedKey);

    if (isFolderKey) {
      // 协同文档相关的不能创建新文件夹
      if (selectedKey.includes('collab_user_')) {
        return 'root'; // 重定向到"我的文件夹"根目录
      }
      return selectedKey;
    }

    // 如果选中的是文件，需要找到其父文件夹
    if (selectedKey.startsWith('doc_') || selectedKey.startsWith('doc')) {
      const parentNode = folderUtils.findParentNodeByKey(list, selectedKey);
      if (parentNode) {
        return parentNode.key;
      }
    }

    // 如果找不到合适的父文件夹，使用最后打开的有效文件夹
    if (openKeys.length > 0) {
      // 从openKeys中找到最后一个有效的文件夹类型的键
      for (let i = openKeys.length - 1; i >= 0; i--) {
        const key = openKeys[i];
        // 排除协同文档相关的键，优先选择"我的文件夹"下的文件夹
        const isValidFolderKey =
          key === 'root' ||
          (!key.startsWith('doc_') &&
            !key.startsWith('doc') &&
            !key.includes('collab_user_') &&
            !['home', 'recent-docs', 'collaboration'].includes(key));

        if (isValidFolderKey) {
          return key;
        }
      }
    }

    // 最后的备选方案是"我的文件夹"根目录
    return 'root';
  }

  /**
   * 构建文件夹的完整路径数组（用于新的parentFolderIds结构）
   *
   * @param list 节点列表
   * @param targetKey 目标文件夹的键
   * @returns 返回完整的父文件夹路径数组
   */
  static buildParentFolderIds(list, targetKey) {
    if (!targetKey || targetKey === 'root') {
      return []; // 根目录没有父文件夹
    }

    const findPath = (nodes, key, currentPath = []) => {
      for (const node of nodes) {
        if (node.key === key) {
          return currentPath; // 找到目标，返回当前路径
        }

        if (node.children && node.children.length > 0) {
          const childPath = findPath(node.children, key, [
            ...currentPath,
            node.key,
          ]);
          if (childPath !== null) {
            return childPath;
          }
        }
      }
      return null;
    };

    const path = findPath(list, targetKey);
    return path || []; // 如果找不到路径，返回空数组
  }

  /**
   * 检查节点是否为文件夹类型
   *
   * @param node 要检查的节点
   * @returns 返回是否为文件夹
   */
  static isFolderNode(node) {
    if (!node || !node.key) return false;

    // 排除特殊菜单项
    if (['home', 'recent-docs', 'collaboration'].includes(node.key)) {
      return false;
    }

    // 排除协同文档相关的节点（这些不能被编辑）
    if (node.key.includes('collab_user_')) {
      return false;
    }

    // 排除文档节点
    if (node.key.startsWith('doc_') || node.key.startsWith('doc')) {
      return false;
    }

    return true;
  }

  /**
   * 检查节点是否可以创建子文件夹
   *
   * @param node 要检查的节点
   * @returns 返回是否可以创建子文件夹
   */
  static canCreateSubfolder(node) {
    if (!folderUtils.isFolderNode(node)) {
      return false;
    }

    // 协同文档相关的文件夹不能创建子文件夹
    if (node.key.includes('collab_user_')) {
      return false;
    }

    return true;
  }

  /**
   * 格式化文件夹数据以适配后端API
   *
   * @param folderData 前端文件夹数据
   * @returns 返回适配后端API的数据格式
   */
  static formatFolderDataForAPI(folderData) {
    return {
      folderName: folderData.folderName || folderData.name,
      userId: folderData.userId,
      create_username: folderData.create_username || folderData.username,
      update_username: folderData.update_username || folderData.username,
      parentFolderIds: folderData.parentFolderIds || [],
    };
  }

  /**
   * 从后端响应数据中提取文件夹信息
   *
   * @param backendData 后端返回的数据
   * @returns 返回格式化的文件夹信息
   */
  static extractFolderFromBackendData(backendData) {
    return {
      folderId: backendData.folderId || backendData._id, // MongoDB ID (用于父子关系)
      autoFolderId: backendData.autoFolderId, // 自增ID (用于API调用)
      folderName: backendData.folderName,
      userId: backendData.userId,
      create_username: backendData.create_username,
      update_username: backendData.update_username,
      parentFolderIds: backendData.parentFolderIds || [],
      depth: backendData.depth || 0,
      childrenCount: backendData.childrenCount || {
        documents: backendData.all_children_documentId?.length || 0,
        folders: backendData.all_children_folderId?.length || 0,
      },
      create_time: backendData.create_time,
      update_time: backendData.update_time,
    };
  }

  /**
   * 更新指定节点的权限（仅支持根文件夹）
   *
   * @param list 节点列表
   * @param targetKey 目标节点的键（必须是 'root'）
   * @param permission 新的权限值 ('public' | 'private')
   * @returns 返回更新后的节点列表
   */
  static updateNodePermission(list, targetKey, permission) {
    // 只允许更新根文件夹的权限
    if (targetKey !== 'root') {
      console.warn('只允许更新根文件夹的权限');
      return list;
    }

    const result = list.map(item => {
      if (item.key === targetKey) {
        return {
          ...item,
          permission: permission,
        };
      }
      return item;
    });

    return result;
  }

  /**
   * 获取协同文档列表
   * 返回所有公开工作空间中的文档（包括其他用户的公开空间）
   *
   * @param list 节点列表
   * @param currentUserId 当前用户ID（可选）
   * @returns 返回协同文档列表
   */
  static getCollaborationDocuments(list, currentUserId = null) {
    const collaborationDocs = [];

    // 查找协同文档菜单
    const collaborationMenu = list.find(item => item.key === 'collaboration');

    if (collaborationMenu && collaborationMenu.children) {
      // 递归收集所有协同文档
      const collectDocuments = (nodes, ownerInfo = '', ownerId = '') => {
        nodes.forEach(node => {
          if (node.key.includes('_doc')) {
            collaborationDocs.push({
              ...node,
              ownerInfo, // 添加所有者信息
              ownerId, // 添加所有者ID
              isCollaborative: true,
              canEdit: true, // 协同文档默认可编辑
            });
          } else if (node.children) {
            collectDocuments(node.children, ownerInfo, ownerId);
          }
        });
      };

      // 遍历所有用户的公开空间
      collaborationMenu.children.forEach(userSpace => {
        if (userSpace.children) {
          collectDocuments(
            userSpace.children,
            userSpace.owner || '协同用户',
            userSpace.ownerId || userSpace.key,
          );
        }
      });
    }

    // 同时查找自己的公开根文件夹中的文档
    const publicRoots = list.filter(
      item => item.key === 'root' && item.permission === 'public',
    );

    const collectOwnDocuments = (nodes, ownerInfo = '') => {
      nodes.forEach(node => {
        if (node.key.startsWith('doc')) {
          collaborationDocs.push({
            ...node,
            ownerInfo: '我的公开文档',
            ownerId: currentUserId || 'current_user',
            isCollaborative: true,
            canEdit: true,
          });
        } else if (node.children) {
          collectOwnDocuments(node.children, ownerInfo);
        }
      });
    };

    publicRoots.forEach(root => {
      if (root.children) {
        collectOwnDocuments(root.children);
      }
    });

    return collaborationDocs;
  }

  /**
   * 检查文档是否可协同编辑
   *
   * @param list 节点列表
   * @param docKey 文档的键
   * @returns 返回是否可协同编辑
   */
  static isDocumentCollaborative(list, docKey) {
    const findRootForDoc = (nodes, targetKey, currentRoot = null) => {
      for (const node of nodes) {
        if (node.key === targetKey) {
          return currentRoot;
        }
        if (node.children) {
          const found = findRootForDoc(node.children, targetKey, node);
          if (found) return found;
        }
      }
      return null;
    };

    const rootNode = findRootForDoc(list, docKey);
    return rootNode?.owner && rootNode.owner !== '当前用户';
  }

  /**
   * 构建完整的文件夹和文档树形结构
   * @param {Array} folders - 文件夹数据数组
   * @param {Array} documents - 文档数据数组
   * @returns {Object} 返回构建好的树形结构
   */
  static buildFolderDocumentTree(folders = [], documents = []) {
    // 创建文件夹ID到文件夹对象的映射
    const folderMap = new Map();

    // 递归收集所有文件夹ID映射
    const collectFolderIds = folderList => {
      folderList.forEach(folder => {
        // 添加主要ID映射
        folderMap.set(folder.folderId, folder);

        // 如果有自增ID，也添加映射
        if (folder.autoFolderId) {
          folderMap.set(folder.autoFolderId, folder);
          folderMap.set(String(folder.autoFolderId), folder);
        }

        // 添加字符串和数字形式的ID映射（防止类型不匹配）
        folderMap.set(String(folder.folderId), folder);

        // 如果folderId是数字字符串，尝试转换为数字
        const numericId = Number(folder.folderId);
        if (!isNaN(numericId)) {
          folderMap.set(numericId, folder);
        }

        // 递归处理子文件夹
        if (folder.children && folder.children.length > 0) {
          collectFolderIds(folder.children);
        }
      });
    };

    collectFolderIds(folders);

    // 为每个文件夹创建文档列表
    const folderDocuments = new Map();

    // 分类文档：根据parentFolderIds将文档分配到对应的文件夹
    documents.forEach(doc => {
      const parentIds = doc.parentFolderIds || [];

      if (parentIds.length === 0) {
        // 根级文档
        if (!folderDocuments.has('ROOT')) {
          folderDocuments.set('ROOT', []);
        }
        folderDocuments.get('ROOT').push(doc);
      } else {
        // 获取直接父文件夹ID
        const directParentId = parentIds[parentIds.length - 1];

        // 查找对应的文件夹，尝试多种ID匹配方式
        let parentFolder = folderMap.get(directParentId);

        if (!parentFolder) {
          // 尝试字符串形式
          parentFolder = folderMap.get(String(directParentId));
        }

        if (!parentFolder) {
          // 尝试数字形式
          const numericId = Number(directParentId);
          if (!isNaN(numericId)) {
            parentFolder = folderMap.get(numericId);
          }
        }

        if (parentFolder) {
          const folderId = parentFolder.folderId;
          if (!folderDocuments.has(folderId)) {
            folderDocuments.set(folderId, []);
          }
          folderDocuments.get(folderId).push(doc);
        } else {
          console.warn('⚠️ 找不到父文件夹:', {
            doc: doc.documentName,
            parentId: directParentId,
            parentIdType: typeof directParentId,
            availableFolderIds: Array.from(folderMap.keys()),
          });
          // 如果找不到父文件夹，放到根级
          if (!folderDocuments.has('ROOT')) {
            folderDocuments.set('ROOT', []);
          }
          folderDocuments.get('ROOT').push(doc);
        }
      }
    });

    return {
      folderMap,
      folderDocuments,
      rootDocuments: folderDocuments.get('ROOT') || [],
    };
  }

  /**
   * 根据文件夹ID查找文档列表
   * @param {Map} folderDocuments - 文件夹文档映射
   * @param {string|number} folderId - 文件夹ID
   * @returns {Array} 文档列表
   */
  static getDocumentsByFolderId(folderDocuments, folderId) {
    return (
      folderDocuments.get(folderId) ||
      folderDocuments.get(String(folderId)) ||
      folderDocuments.get(Number(folderId)) ||
      []
    );
  }

  /**
   * 验证文档是否应该属于指定文件夹
   * @param {Object} document - 文档对象
   * @param {Object} folder - 文件夹对象
   * @returns {boolean} 是否匹配
   */
  static isDocumentBelongToFolder(document, folder) {
    const docParentIds = document.parentFolderIds || [];

    if (docParentIds.length === 0) {
      return false; // 根级文档不属于任何文件夹
    }

    const directParentId = docParentIds[docParentIds.length - 1];

    // 检查各种ID匹配情况
    return (
      directParentId === folder.folderId ||
      directParentId === folder.autoFolderId ||
      String(directParentId) === String(folder.folderId) ||
      Number(directParentId) === Number(folder.autoFolderId)
    );
  }
}

/**
 * folderUtils 类提供了用于处理文件夹节点的静态方法。
 * 包含以下方法：
 * - renameNodeByKey: 根据键名修改节点名称
 * - deleteNodeByKey: 根据键删除节点
 * - insertToTarget: 插入新节点到目标位置
 * - findNodeByKey: 根据键查找节点
 * - findParentNodeByKey: 根据子节点键查找父节点
 * - getValidTargetKey: 获取适合新建的目标文件夹键（支持新的数据结构）
 * - buildParentFolderIds: 构建文件夹的完整路径数组
 * - isFolderNode: 检查节点是否为文件夹类型
 * - canCreateSubfolder: 检查节点是否可以创建子文件夹
 * - updateNodePermission: 更新根文件夹的权限（工作空间级别）
 * - getCollaborationDocuments: 获取协同文档列表
 * - isDocumentCollaborative: 检查文档是否可协同编辑
 * - formatFolderDataForAPI: 格式化文件夹数据以适配后端API
 * - extractFolderFromBackendData: 从后端响应数据中提取文件夹信息
 * - buildFolderDocumentTree: 构建完整的文件夹和文档树形结构
 * - getDocumentsByFolderId: 根据文件夹ID查找文档列表
 * - isDocumentBelongToFolder: 验证文档是否应该属于指定文件夹
 */
export default folderUtils;
