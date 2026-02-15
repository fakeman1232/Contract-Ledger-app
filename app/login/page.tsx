'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { authApi, setToken, getUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // 检查是否有重定向参数
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.push(redirect || '/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Container>
        <Card
          style={{
            maxWidth: '400px',
            margin: '0 auto',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Card.Body>
            <h2 className="text-center mb-4">合同台账管理系统</h2>
            <h4 className="text-center mb-4 text-muted">登录</h4>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>用户名</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>密码</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mb-3"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              <div className="text-center">
                <span className="text-muted">还没有账号？</span>{' '}
                <Button variant="link" onClick={handleRegister} className="p-0">
                  立即注册
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}