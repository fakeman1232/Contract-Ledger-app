import { NextRequest, NextResponse } from 'next/server';
import { getDb, hashPassword, initDb } from '@/lib/db';

// 确保数据库已初始化（模块加载时执行）
let dbInitialized = false;
async function ensureInitialized() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

const ADMIN_USERNAME = 'admin';

export async function POST(request: NextRequest) {
  await ensureInitialized();
  try {
    const { username, password, email } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 检查是否尝试注册管理员账号
    if (username === ADMIN_USERNAME) {
      return NextResponse.json(
        { error: '管理员账号已存在，请联系系统管理员' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 检查用户名是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingEmail) {
        return NextResponse.json(
          { error: '邮箱已被使用' },
          { status: 400 }
        );
      }
    }

    // 创建新用户（默认角色为 user）
    const hashedPassword = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)'
    ).run(username, hashedPassword, email || null, 'user');

    return NextResponse.json({
      message: '注册成功',
      userId: result.lastInsertRowid
    }, { status: 201 });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    );
  }
}