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

    const userId = decoded.userId.toString();

    const { id } = await params;

    const db = getDb();



    // 检查模板是否存在（改为已登录用户即可删除）



        const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as any;



        if (!template) {



          return NextResponse.json({ error: '模板不存在' }, { status: 404 });



        }

    // 删除模板
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);

    return NextResponse.json({ message: '模板已删除' });
  } catch (error) {
    console.error('删除模板错误:', error);
    return NextResponse.json({ error: '删除模板失败' }, { status: 500 });
  }
}