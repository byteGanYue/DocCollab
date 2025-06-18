import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  GithubOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import styles from './LoginForm.module.less';

const { Title, Text, Link } = Typography;

/**
 * 登录表单组件
 * 支持邮箱密码登录和第三方登录（模拟）
 */
const LoginForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [thirdPartyLoading, setThirdPartyLoading] = useState(null);
  const navigate = useNavigate();
  // 消息提示
  const [messageApi, contextHolder] = message.useMessage();

  /**
   * 模拟邮箱登录
   * @param {Object} values - 表单数据
   */
  const handleEmailLogin = async values => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 生成模拟用户数据
      const mockUser = {
        id: 'user_' + Date.now(),
        email: values.email,
        username: values.email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.email}`,
        loginTime: new Date().toISOString(),
        provider: 'email',
      };

      // 生成模拟JWT token
      const mockToken = 'mock_jwt_token_' + Date.now();

      // 保存到localStorage（模拟真实登录状态）
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      messageApi.success(`欢迎回来，${mockUser.username}！`);

      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch {
      messageApi.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 模拟第三方登录
   * @param {string} provider - 登录提供商 (google/github)
   */
  const handleThirdPartyLogin = async provider => {
    setThirdPartyLoading(provider);
    try {
      messageApi.info(
        `正在通过 ${provider === 'google' ? 'Google' : 'GitHub'} 登录...`,
      );

      // 模拟第三方登录延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成第三方用户数据
      const providerNames = {
        google: 'Google',
        github: 'GitHub',
      };

      const mockUser = {
        id: `${provider}_user_` + Date.now(),
        email: `user@${provider}.example`,
        username: `${providerNames[provider]}用户`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}user`,
        provider: provider,
        loginTime: new Date().toISOString(),
      };

      // 生成模拟token
      const mockToken = `mock_${provider}_token_` + Date.now();

      // 保存到localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      messageApi.success(`通过 ${providerNames[provider]} 登录成功！`);

      // 延迟跳转
      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch {
      messageApi.error(`${provider} 登录失败，请稍后重试`);
    } finally {
      setThirdPartyLoading(null);
    }
  };

  /**
   * 跳转到注册页面
   */
  const handleGoToRegister = () => {
    messageApi.info('注册功能正在开发中...');
  };

  return (
    <div className={styles.loginContainer}>
      {contextHolder}

      {/* 主题切换器 */}
      <div className={styles.themeSwitcher}>
        <ThemeSwitcher />
      </div>

      {/* 背景装饰 */}
      <div className={styles.loginBackground}>
        <div className={styles.backgroundShapes}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
          <div className={`${styles.shape} ${styles.shape3}`}></div>
        </div>
      </div>

      {/* 登录卡片 */}
      <div className={styles.loginCard}>
        {/* 卡片头部 */}
        <div className={styles.cardHeader}>
          <FileTextOutlined className={styles.logo} />
          <Title level={2} className={styles.subtitle}>
            DocCollab
          </Title>
          <Text className={styles.subtitle}>协同文档编辑平台</Text>
        </div>

        {/* 卡片主体 */}
        <div className={styles.cardBody}>
          {/* 登录表单 */}
          <Form
            form={form}
            name="login"
            onFinish={handleEmailLogin}
            layout="vertical"
            size="large"
            className={styles.form}
          >
            <div className={styles.formItem}>
              <label className={styles.label}>邮箱</label>
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入邮箱地址"
                autoComplete="email"
                className={styles.input}
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              />
            </div>

            <div className={styles.formItem}>
              <label className={styles.label}>密码</label>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
                className={styles.input}
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位字符' },
                ]}
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className={styles.loginButton}
              block
            >
              登录
            </Button>
          </Form>

          {/* 分割线 */}
          {/* <div className={styles.divider}>
            <span className={styles.dividerText}>或</span>
          </div> */}

          {/* 第三方登录 */}
          <div className={styles.socialLogin}>
            <div className={styles.btn1}>
              <Button
                className={`${styles.socialButton} ${styles.google}`}
                onClick={() => handleThirdPartyLogin('google')}
                loading={thirdPartyLoading === 'google'}
                block
              >
                <GoogleOutlined className={styles.icon} />
                Google
              </Button>
            </div>
            <div>
              <Button
                className={`${styles.socialButton} ${styles.github}`}
                onClick={() => handleThirdPartyLogin('github')}
                loading={thirdPartyLoading === 'github'}
                block
              >
                <GithubOutlined className={styles.icon} />
                GitHub
              </Button>
            </div>
          </div>

          {/* 注册链接 */}
          <div className={styles.registerLink}>
            <Text>
              还没有账号？
              <Link onClick={handleGoToRegister} className={styles.link}>
                立即注册
              </Link>
            </Text>
          </div>

          {/* 测试提示 */}
          <div className={styles.testHint}>
            💡 测试账号：任意邮箱 + 任意6位以上密码即可登录
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
