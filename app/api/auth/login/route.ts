import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyPassword, generateToken, initDb, hashPassword } from '@/lib/db';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// 确保数据库已初始化（模块加载时执行）
let dbInitialized = false;
async function ensureInitialized() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  await ensureInitialized();
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 查找用户
    const user = db.prepare(
      'SELECT id, username, password, email, role FROM users WHERE username = ?'
    ).get(username) as any;

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成 JWT token
    const token = generateToken(user.id);

    return NextResponse.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}