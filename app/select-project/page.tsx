'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Alert, Modal, Form } from 'react-bootstrap';
import { projectsApi, getUser, setToken } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
}

export default function SelectProject() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      const response = await projectsApi.list();
      setProjects(response.projects || []);
    } catch (err: any) {
      setError('加载项目失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    localStorage.setItem('currentProject', JSON.stringify(project));
    router.push('/');
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('项目名称不能为空');
      return;
    }

    try {
      await projectsApi.create({
        name: projectName,
        description: projectDescription,
      });
      setShowCreateModal(false);
      setProjectName('');
      setProjectDescription('');
      setError(null);
      await loadProjects();
    } catch (err: any) {
      setError('创建项目失败: ' + (err.message || '未知错误'));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除此项目吗？')) {
      return;
    }

    try {
      await projectsApi.delete(projectId);
      await loadProjects();
    } catch (err: any) {
      setError('删除项目失败: ' + (err.message || '未知错误'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentProject');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center text-white">
          <h3>加载中...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
    }}>
      <Container>
        <Card style={{
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '40px',
        }}>
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="mb-2">📁 选择项目</h2>
              <p className="text-muted mb-0">请选择要管理的项目</p>
            </div>
            <div>
              {user?.role === 'admin' && (
                <Button 
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  ➕ 创建新项目
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted mb-3">暂无项目</h5>
              <p className="text-muted">
                {user?.role === 'admin' ? '点击"创建新项目"开始' : '请联系管理员创建项目'}
              </p>
            </div>
          ) : (
            <Row>
              {projects.map(project => (
                <Col key={project.id} md={6} lg={4} className="mb-4">
                  <Card 
                    className="h-100 border-0 shadow-sm project-card"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '15px',
                    }}
                    onClick={() => handleSelectProject(project)}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="mb-0">{project.name}</h5>
                        {user?.role === 'admin' && (
                          <Button
                            variant="link"
                            className="text-danger p-0"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-muted small mb-3">
                          {project.description}
                        </p>
                      )}
                      <div className="text-muted small">
                        创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <div className="text-center mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={handleLogout}
              size="sm"
            >
              退出登录
            </Button>
          </div>
        </Card>

        {/* 创建项目模态框 */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>创建新项目</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>项目名称 *</Form.Label>
                <Form.Control
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例如：北蔡楔形绿地项目"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>项目描述</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="请输入项目描述（可选）"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button 
              variant="primary"
              onClick={handleCreateProject}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              创建
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      <style jsx global>{`
        .project-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.3) !important;
        }
      `}</style>
    </div>
  );
}