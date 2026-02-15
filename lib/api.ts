const API_BASE = '/api';

// 获取 token
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// 设置 token
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

// 清除 token
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// 获取用户信息
export function getUser(): any {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

// 通用请求函数
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    } catch {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

// 检查用户角色
export function getUserRole(): string | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }
  return null;
}

// 检查是否是管理员
export function isAdmin(): boolean {
  return getUserRole() === 'admin';
}

// 认证 API
export const authApi = {
  register: (data: { username: string; password: string; email?: string }) =>
    request<{ message: string; userId: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) =>
    request<{ message: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 项目 API
export const projectsApi = {
  list: () => request<{ projects: any[] }>('/projects'),

  create: (data: { name: string; description?: string }) =>
    request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),

  addMember: (projectId: string, data: { username: string; role?: string }) =>
    request<{ message: string }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 合同 API
export const contractsApi = {
  list: (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return request<{ contracts: any[] }>(`/contracts${params}`);
  },

  create: (data: any) =>
    request<{ contract: any }>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    request<{ contract: any }>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/contracts/${id}`, {
      method: 'DELETE',
    }),
};

// 模板 API
export const templatesApi = {
  list: () => request<{ templates: any[] }>('/templates'),

  create: (data: any) =>
    request<{ template: any }>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/templates/${id}`, {
      method: 'DELETE',
    }),
};