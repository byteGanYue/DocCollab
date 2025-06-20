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
    return list.map(item => {
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
  }

  /**
   * 根据指定的键删除节点
   *
   * @param list 要操作的列表
   * @param targetKey 要删除的节点的键
   * @returns 返回删除指定键节点后的新列表
   */
  static deleteNodeByKey(list, targetKey) {
    return list.filter(item => {
      if (item.key === targetKey) return false;
      if (item.children) {
        item.children = folderUtils.deleteNodeByKey(item.children, targetKey);
      }
      return true;
    });
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
    return list.map(item => {
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
   * 更新指定节点的权限
   *
   * @param list 节点列表
   * @param targetKey 目标节点的键
   * @param permission 新的权限值 ('public' | 'private')
   * @returns 返回更新后的节点列表
   */
  static updateNodePermission(list, targetKey, permission) {
    return list.map(item => {
      if (item.key === targetKey) {
        return {
          ...item,
          permission: permission,
        };
      } else if (item.children) {
        return {
          ...item,
          children: folderUtils.updateNodePermission(
            item.children,
            targetKey,
            permission,
          ),
        };
      }
      return item;
    });
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
 * - updateNodePermission: 更新指定节点的权限
 */
export default folderUtils;
