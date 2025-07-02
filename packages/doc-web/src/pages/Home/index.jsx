import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Space } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import styles from './index.module.less';

/**
 * Home 首页组件
 * 显示 DocCollab 的欢迎页面，支持主题色动态变化
 */
export default function Home() {
  return (
    <div className={styles.homeContainer}>
      {/* 主标题区域 */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.mainTitle}>Welcome to DocCollab</h1>
        <p className={styles.subtitle}>与团队一起协作，创造更好的文档体验</p>
      </div>

      {/* 特性介绍区域 */}
      <div className={styles.featuresSection}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>实时协同编辑</h3>
            <p className={styles.featureDescription}>
              多人同时编辑文档，实时同步，提升团队协作效率
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📁</div>
            <h3 className={styles.featureTitle}>智能文档管理</h3>
            <p className={styles.featureDescription}>
              灵活的文件夹结构，让文档组织更加有条理
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3 className={styles.featureTitle}>个性化主题</h3>
            <p className={styles.featureDescription}>
              多种主题风格选择，创建属于你的专属工作环境
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔄</div>
            <h3 className={styles.featureTitle}>版本历史</h3>
            <p className={styles.featureDescription}>
              完整的版本历史记录，轻松回滚和对比文档变更
            </p>
          </div>
        </div>
      </div>

      {/* 快速开始区域 */}
      <div className={styles.quickStartSection}>
        <h2 className={styles.sectionTitle}>快速开始</h2>
        <div className={styles.quickActions}>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>📄</span>
            创建新文档
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>📂</span>
            创建文件夹
          </button>
          <button className={styles.actionButton}>
            <span className={styles.actionIcon}>📤</span>
            导入文档
          </button>
        </div>
      </div>
    </div>
  );
}
