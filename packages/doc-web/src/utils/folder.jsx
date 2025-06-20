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
    console.log('重命名后新的目录结构:', result); // 添加调试信息
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
    console.log('删除后新的目录结构:', result); // 添加调试信息
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
    console.log('插入新节点后新的目录结构:', result); // 添加调试信息
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
    // 如果没有选中任何项，默认在根目录创建
    if (!selectedKey) {
      return 'root';
    }

    // 如果选中的是文件夹，直接在该文件夹下创建
    if (selectedKey.startsWith('sub') || selectedKey === 'root') {
      return selectedKey;
    }

    // 如果选中的是文件，需要找到其父文件夹
    if (selectedKey.startsWith('doc')) {
      const parentNode = folderUtils.findParentNodeByKey(list, selectedKey);
      if (parentNode) {
        return parentNode.key;
      }
    }

    // 如果找不到合适的父文件夹，使用最后打开的文件夹
    if (openKeys.length > 0) {
      // 从openKeys中找到最后一个文件夹类型的键
      for (let i = openKeys.length - 1; i >= 0; i--) {
        if (openKeys[i].startsWith('sub') || openKeys[i] === 'root') {
          return openKeys[i];
        }
      }
    }

    // 最后的备选方案是根目录
    return 'root';
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
    console.log('更新工作空间权限后新的目录结构:', result); // 添加调试信息
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

    console.log('协同文档列表:', collaborationDocs);
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
    // 查找文档所属的根文件夹
    const findRootForDoc = (nodes, targetKey, currentRoot = null) => {
      for (const item of nodes) {
        if (item.key === 'root') {
          currentRoot = item;
        }

        if (item.key === targetKey) {
          return currentRoot;
        }

        if (item.children) {
          const found = findRootForDoc(item.children, targetKey, currentRoot);
          if (found) return found;
        }
      }
      return null;
    };

    const rootFolder = findRootForDoc(list, docKey);
    return rootFolder && rootFolder.permission === 'public';
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
 * - getValidTargetKey: 获取适合新建的目标文件夹键
 * - updateNodePermission: 更新根文件夹的权限（工作空间级别）
 * - getCollaborationDocuments: 获取协同文档列表
 * - isDocumentCollaborative: 检查文档是否可协同编辑
 */
export default folderUtils;
