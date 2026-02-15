import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyToken } from '@/lib/db';

function authenticate(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export async function DELETE(

  request: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  const decoded = authenticate(request);

  if (!decoded) {

    return NextResponse.json({ error: '未授权' }, { status: 401 });

  }



  try {

    const userId = decoded.userId;

    const { id } = await params;

    const db = getDb();



    // 检查用户是否是管理员

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    if (!user || user.role !== 'admin') {

      return NextResponse.json({ error: '只有管理员可以删除项目' }, { status: 403 });

    }



    // 检查项目是否存在

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {

      return NextResponse.json({ error: '项目不存在' }, { status: 404 });

    }



    // 删除项目（会级联删除相关合同等数据）

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);



    return NextResponse.json({ message: '项目已删除' });

  } catch (error) {

    console.error('删除项目错误:', error);

    return NextResponse.json({ error: '删除项目失败' }, { status: 500 });

  }

}