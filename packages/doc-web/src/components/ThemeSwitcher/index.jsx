import React, { useState } from 'react';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import { BgColorsOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import { themeOptions } from '@/styles/themes';
import styles from './index.module.less';

const ThemeSwitcher = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // 获取当前主题信息
  const currentThemeInfo = themeOptions.find(
    option => option.key === currentTheme,
  );

  // 处理主题切换
  const handleThemeChange = themeKey => {
    toggleTheme(themeKey);
    setOpen(false);
  };

  // 下拉菜单项
  const menuItems = themeOptions.map(option => ({
    key: option.key,
    label: (
      <div className={styles.menuItem}>
        <span className={styles.icon}>{option.icon}</span>
        <div className={styles.content}>
          <div className={styles.label}>{option.label}</div>
          <div className={styles.description}>{option.description}</div>
        </div>
        {currentTheme === option.key && (
          <span className={styles.activeIndicator}>✓</span>
        )}
      </div>
    ),
    onClick: () => handleThemeChange(option.key),
  }));

  return (
    <Dropdown
      menu={{ items: menuItems }}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      trigger={['click']}
    >
      <Tooltip title="切换主题" placement="bottom">
        <Button
          type="text"
          icon={<BgColorsOutlined />}
          className={styles.themeButton}
          size="large"
        >
          <Space>
            <span className={styles.currentIcon}>{currentThemeInfo?.icon}</span>
            <span className={styles.currentLabel}>
              {currentThemeInfo?.label}
            </span>
          </Space>
        </Button>
      </Tooltip>
    </Dropdown>
  );
};

export default ThemeSwitcher;
