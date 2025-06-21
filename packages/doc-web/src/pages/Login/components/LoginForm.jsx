import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GoogleOutlined,
  GithubOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useUser } from '@/hooks/useAuth';
import styles from './LoginForm.module.less';
const { Title, Text } = Typography;
import { userAPI } from '@/utils/api';
/**
 * 登录表单组件
 * 支持邮箱密码登录和第三方登录（模拟）
 */
const LoginForm = () => {
  const [form] = Form.useForm();
  // 登录加载状态
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // 消息提示
  const [messageApi, contextHolder] = message.useMessage();
  // 获取用户上下文
  const { login } = useUser();

  // 登录逻辑
  const handleEmailLogin = async () => {
    try {
      // 校验表单
      const values = await form.validateFields();
      setLoading(true);
      // 调用登录API
      const res = await userAPI.login({
        email: values.email,
        password: values.password,
      });
      if (res.code == 200) {
        // 使用 UserContext 的 login 方法保存用户信息
        login(res.data);
        messageApi.success(`欢迎回来，${res.data.username}`);
        setTimeout(() => {
          navigate('/home');
        }, 500);
      } else {
        messageApi.error('登录失败');
      }
    } catch (error) {
      if (error.errorFields) {
        // 表单校验错误
        const firstError = error.errorFields[0];
        messageApi.error(firstError.errors[0]);
      } else if (error.response) {
        // 接口返回错误
        const { status, data } = error.response;
        if (status === 401) {
          messageApi.error('邮箱或密码错误');
        } else {
          messageApi.error(data?.message || '登录失败，请稍后重试');
        }
      } else {
        messageApi.error('登录失败，请检查网络或稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 占位：第三方登录逻辑
  const handleThirdPartyLogin = provider => {
    messageApi.info(`暂未实现${provider}登录`);
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
            layout="vertical"
            size="large"
            className={styles.form}
            onFinish={handleEmailLogin}
          >
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
                className={styles.input}
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
                className={styles.input}
              />
            </Form.Item>

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
              <Link to="/register" className={styles.link}>
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
