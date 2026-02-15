import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyToken } from '@/lib/db';

function authenticate(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  const decoded = authenticate(request);
  if (!decoded) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const userId = decoded.userId.toString();
    // 修改为返回所有项目（不限制权限）
    const db = getDb();

    const projects = db.prepare(`
      SELECT DISTINCT p.*,
             u.username as owner_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `).all();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('获取项目错误:', error);
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {

  const decoded = authenticate(request);

  if (!decoded) {

    return NextResponse.json({ error: '未授权' }, { status: 401 });

  }



  try {

    const userId = decoded.userId;

    const { name, description } = await request.json();

    const db = getDb();



    if (!name) {

      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });

    }



    // 检查用户是否是管理员

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (!user || user.role !== 'admin') {

      return NextResponse.json({ error: '只有管理员可以创建项目' }, { status: 403 });

    }



    const result = db.prepare(

      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'

    ).run(name, description || null, userId);



    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);



    return NextResponse.json({ project }, { status: 201 });

  } catch (error) {

    console.error('创建项目错误:', error);

    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });

  }

}