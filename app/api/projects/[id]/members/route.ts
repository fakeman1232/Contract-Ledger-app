import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyToken } from '@/lib/db';

function authenticate(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export async function POST(

  request: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  const decoded = authenticate(request);

  if (!decoded) {

    return NextResponse.json({ error: '未授权' }, { status: 401 });

  }



  try {

    const userId = decoded.userId.toString();

    const { id } = await params;

    const { username, role = 'member' } = await request.json();

    if (!username) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    const db = getDb();

    // 检查用户是否是项目创建者（改为已登录用户即可添加成员）
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 查找要添加的用户
    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 添加项目成员
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(id, targetUser.id, role);

    return NextResponse.json({ message: '成员已添加' }, { status: 201 });
  } catch (error) {
    console.error('添加成员错误:', error);
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: '该用户已是项目成员' }, { status: 400 });
    }
    return NextResponse.json({ error: '添加成员失败' }, { status: 500 });
  }
}