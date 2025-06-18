import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GoogleOutlined,
  GithubOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import styles from './RegisterForm.module.less';

const { Title, Text } = Typography;

/**
 * 注册表单组件
 * 支持邮箱注册和第三方注册（模拟）
 */
const RegisterForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [thirdPartyLoading, setThirdPartyLoading] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();
  // 消息提示
  const [messageApi, contextHolder] = message.useMessage();

  /**
   * 模拟邮箱注册
   * @param {Object} values - 表单数据
   */
  const handleEmailRegister = async values => {
    if (!agreedToTerms) {
      messageApi.error('请先同意用户协议和隐私政策');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 生成模拟用户数据
      const mockUser = {
        id: 'user_' + Date.now(),
        email: values.email,
        username: values.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.email}`,
        registerTime: new Date().toISOString(),
        provider: 'email',
      };

      // 生成模拟JWT token
      const mockToken = 'mock_jwt_token_' + Date.now();

      // 保存到localStorage（模拟真实注册状态）
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      messageApi.success(
        `注册成功！欢迎加入 DocCollab，${mockUser.username}！`,
      );

      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch {
      messageApi.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 模拟第三方注册
   * @param {string} provider - 注册提供商 (google/github)
   */
  const handleThirdPartyRegister = async provider => {
    setThirdPartyLoading(provider);
    try {
      messageApi.info(
        `正在通过 ${provider === 'google' ? 'Google' : 'GitHub'} 注册...`,
      );

      // 模拟第三方注册延迟
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
        registerTime: new Date().toISOString(),
      };

      // 生成模拟token
      const mockToken = `mock_${provider}_token_` + Date.now();

      // 保存到localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      messageApi.success(`通过 ${providerNames[provider]} 注册成功！`);

      // 延迟跳转
      setTimeout(() => {
        navigate('/home');
      }, 800);
    } catch {
      messageApi.error(`${provider} 注册失败，请稍后重试`);
    } finally {
      setThirdPartyLoading(null);
    }
  };

  /**
   * 跳转到登录页面
   */
  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className={styles.registerContainer}>
      {contextHolder}

      {/* 主题切换器 */}
      <div className={styles.themeSwitcher}>
        <ThemeSwitcher />
      </div>

      {/* 背景装饰 */}
      <div className={styles.registerBackground}>
        <div className={styles.backgroundShapes}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
          <div className={`${styles.shape} ${styles.shape3}`}></div>
        </div>
      </div>

      {/* 注册卡片 */}
      <div className={styles.registerCard}>
        {/* 卡片头部 */}
        <div className={styles.cardHeader}>
          <FileTextOutlined className={styles.logo} />
          <Title level={2} className={styles.subtitle}>
            DocCollab
          </Title>
          <Text className={styles.subtitle}>创建您的账户</Text>
        </div>

        {/* 卡片主体 */}
        <div className={styles.cardBody}>
          {/* 注册表单 */}
          <Form
            form={form}
            name="register"
            onFinish={handleEmailRegister}
            layout="vertical"
            size="large"
            className={styles.form}
          >
            <div className={styles.formItem}>
              <label className={styles.label}>用户名</label>
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                className={styles.input}
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, message: '用户名至少2位字符' },
                ]}
              />
            </div>

            <div className={styles.formItem}>
              <label className={styles.label}>邮箱</label>
              <Input
                prefix={<MailOutlined />}
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
                autoComplete="new-password"
                className={styles.input}
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位字符' },
                ]}
              />
            </div>

            <div className={styles.formItem}>
              <label className={styles.label}>确认密码</label>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                className={styles.input}
                name="confirmPassword"
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              />
            </div>

            <div className={styles.agreement}>
              <Checkbox
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className={styles.checkbox}
              >
                我已阅读并同意
                <Link to="/terms" className={styles.agreementLink}>
                  《用户协议》
                </Link>
                和
                <Link to="/privacy" className={styles.agreementLink}>
                  《隐私政策》
                </Link>
              </Checkbox>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className={styles.registerButton}
              block
            >
              注册
            </Button>
          </Form>

          {/* 分割线 */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>或</span>
          </div>

          {/* 第三方注册 */}
          <div className={styles.socialRegister}>
            <Button
              className={`${styles.socialButton} ${styles.google}`}
              onClick={() => handleThirdPartyRegister('google')}
              loading={thirdPartyLoading === 'google'}
              block
            >
              <GoogleOutlined className={styles.icon} />
              Google
            </Button>
            <Button
              className={`${styles.socialButton} ${styles.github}`}
              onClick={() => handleThirdPartyRegister('github')}
              loading={thirdPartyLoading === 'github'}
              block
            >
              <GithubOutlined className={styles.icon} />
              GitHub
            </Button>
          </div>

          {/* 登录链接 */}
          <div className={styles.loginLink}>
            <Text>
              已有账号？
              <Link to="/login" className={styles.link}>
                立即登录
              </Link>
            </Text>
          </div>

          {/* 测试提示 */}
          <div className={styles.testHint}>
            💡 测试账号：任意用户名 + 任意邮箱 + 任意6位以上密码即可注册
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
