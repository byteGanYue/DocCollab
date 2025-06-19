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
}

/**
 * folderUtils 类提供了用于处理文件夹节点的静态方法。
 * 目前包含一个方法：findNodeByKey，用于根据键查找节点。
 */
export default folderUtils;
