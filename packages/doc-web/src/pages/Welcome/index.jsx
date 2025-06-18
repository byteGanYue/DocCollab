import React from 'react';
import { Button, Typography } from 'antd';
import {
  FileTextOutlined,
  LoginOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import styles from './Welcome.module.less';

const { Title, Text } = Typography;

/**
 * 欢迎页面组件
 * 提供登录和注册的选择入口
 */
const Welcome = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className={styles.welcomeContainer}>
      {/* 主题切换器 */}
      <div className={styles.themeSwitcher}>
        <ThemeSwitcher />
      </div>

      {/* 背景装饰 */}
      <div className={styles.welcomeBackground}>
        <div className={styles.backgroundShapes}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
          <div className={`${styles.shape} ${styles.shape3}`}></div>
        </div>
      </div>

      {/* 欢迎卡片 */}
      <div className={styles.welcomeCard}>
        {/* 卡片头部 */}
        <div className={styles.cardHeader}>
          <FileTextOutlined className={styles.logo} />
          <Title level={1} className={styles.title}>
            DocCollab
          </Title>
          <Text className={styles.subtitle}>协同文档编辑平台</Text>
          <Text className={styles.description}>
            强大的在线文档协作工具，支持实时编辑、版本管理和团队协作
          </Text>
        </div>

        {/* 卡片主体 */}
        <div className={styles.cardBody}>
          {/* 功能特点 */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📝</div>
              <div className={styles.featureText}>
                <h3>富文本编辑</h3>
                <p>支持 Markdown、代码高亮、多媒体内容</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>👥</div>
              <div className={styles.featureText}>
                <h3>实时协作</h3>
                <p>多人同时编辑，实时同步，冲突解决</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureText}>
                <h3>版本管理</h3>
                <p>历史版本记录，支持对比和回滚</p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={handleRegister}
              className={styles.registerButton}
              block
            >
              立即注册
            </Button>
            <Button
              size="large"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              className={styles.loginButton}
              block
            >
              已有账号？登录
            </Button>
          </div>

          {/* 测试提示 */}
          <div className={styles.testHint}>
            💡 支持邮箱注册和第三方登录（Google、GitHub）
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
