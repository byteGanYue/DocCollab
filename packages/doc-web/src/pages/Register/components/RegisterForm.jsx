import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { userAPI } from '@/utils/api';
import styles from './RegisterForm.module.less';
const { Title, Text } = Typography;

/**
 * 注册表单组件
 * 支持邮箱注册和第三方注册（模拟）
 *
 * 功能说明：
 * 1. validateForm() - 验证表单填写是否完整
 *    - 检查所有必填字段
 *    - 验证邮箱格式
 *    - 验证密码强度
 *    - 检查用户协议是否同意
 *    - 返回 Promise<boolean>
 *
 * 2. handleRegisterClick() - 处理注册按钮点击
 *    - 先调用 validateForm() 验证表单
 *    - 验证通过后调用后端API
 *    - 处理注册成功/失败逻辑
 *    - 自动跳转到主页
 *
 * 使用示例：
 * // 单独验证表单
 * const isValid = await validateForm();
 * if (isValid) {
 *   console.log('表单验证通过');
 * }
 *
 * // 触发注册流程
 * await handleRegisterClick();
 */
const RegisterForm = () => {
  const [form] = Form.useForm(); // 表单实例, 用于表单验证和获取表单数据`
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();
  // 消息提示
  const [messageApi, contextHolder] = message.useMessage();

  /**
   * 验证表单填写是否完整
   * @returns {Promise<boolean>} 验证结果
   */
  const validateForm = async () => {
    console.log('开始验证表单');

    try {
      // 验证表单字段（包括用户名、邮箱、密码等）
      const values = await form.validateFields();
      console.log('表单验证通过，获取到的值:', values);

      // 检查用户协议是否同意
      if (!agreedToTerms) {
        messageApi.error('请先同意用户协议和隐私政策');
        return false;
      }

      console.log('所有验证通过');
      return true;
    } catch (error) {
      console.error('表单验证失败:', error);
      // 表单验证失败
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        console.log('第一个错误字段:', firstError);
        messageApi.error(firstError.errors[0]);
      } else {
        messageApi.error('表单验证失败，请检查输入内容');
      }
      return false;
    }
  };

  /**
   * 处理注册按钮点击
   */
  const handleRegisterClick = async () => {
    console.log('注册按钮点击');
    // 先验证表单
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }
    // 开始注册流程
    setLoading(true);
    try {
      // 获取表单数据
      const values = await form.getFieldsValue();
      console.log('表单数据:', values);
      // 准备注册数据
      const registerData = {
        username: values.username,
        email: values.email,
        password: values.password,
      };

      // 调用注册API
      const response = await userAPI.register(registerData);
      console.log('注册响应:', response);
      // 注册成功，保存token和用户信息
      if (response.code == 200) {
        messageApi.success(
          `注册成功！欢迎加入 DocCollab，${response.username}！`,
        );
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        // 如果没有返回token，可能是模拟注册

        messageApi.error(`注册失败`);
      }
    } catch (error) {
      console.error('注册失败:', error);
      messageApi.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
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
            layout="vertical"
            size="large"
            className={styles.form}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2位字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
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
                autoComplete="new-password"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
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
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                className={styles.input}
              />
            </Form.Item>

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
              loading={loading}
              className={styles.registerButton}
              block
              onClick={handleRegisterClick}
            >
              注册
            </Button>
          </Form>
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
