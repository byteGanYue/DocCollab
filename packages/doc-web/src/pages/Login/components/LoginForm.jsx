import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  message,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  GithubOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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
    <div className="login-container">
      {/* 背景装饰 */}
      <div className="login-background">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card className="login-card" bordered={false}>
            {/* 标题区域 */}
            <div className="login-header">
              <FileTextOutlined className="login-icon" />
              <Title level={2} className="login-title">
                DocCollab
              </Title>
              <Text className="login-subtitle">协同文档编辑平台</Text>
            </div>

            {/* 登录表单 */}
            <Form
              form={form}
              name="login"
              onFinish={handleEmailLogin}
              layout="vertical"
              size="large"
              className="login-form"
            >
              {contextHolder}
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入邮箱地址"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="login-button"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            {/* 第三方登录 */}
            <Divider>
              <Text type="secondary">或</Text>
            </Divider>

            <Space direction="vertical" style={{ width: '100%' }}>
              {/* google 登录按钮 */}
              <Button
                icon={<GoogleOutlined />}
                block
                size="large"
                loading={thirdPartyLoading === 'google'}
                className="third-party-button google-button"
                onClick={() => handleThirdPartyLogin('google')}
              >
                使用 Google 登录
              </Button>

              {/* github 登录按钮 */}
              <Button
                icon={<GithubOutlined />}
                block
                size="large"
                loading={thirdPartyLoading === 'github'}
                className="third-party-button github-button"
                onClick={() => handleThirdPartyLogin('github')}
              >
                使用 GitHub 登录
              </Button>
            </Space>

            {/* 测试提示信息 */}
            <div className="test-hint">
              <Text type="secondary">
                <strong>测试提示：</strong>
                输入任意邮箱和密码（至少6位）即可模拟登录
              </Text>
            </div>

            {/* 注册链接 */}
            <div className="login-footer">
              <Text>
                还没有账号？
                {contextHolder}
                <Link onClick={handleGoToRegister}>立即注册</Link>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginForm;
