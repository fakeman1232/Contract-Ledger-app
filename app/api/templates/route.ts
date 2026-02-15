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

    // 修改为返回所有模板（不限制权限）
    const db = getDb();

    const templates = db.prepare(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `).all();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('获取模板错误:', error);
    return NextResponse.json({ error: '获取模板失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decoded = authenticate(request);
  if (!decoded) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const userId = decoded.userId.toString();

    const template = await request.json();

    if (!template.name) {
      return NextResponse.json({ error: '模板名称不能为空' }, { status: 400 });
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO templates (
        name, contract_name, supplier, contract_number, contract_amount,
        bid_method, sign_date, tax_rate, category, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.name,
      template.contractName || null,
      template.supplier || null,
      template.contractNumber || null,
      template.contractAmount || null,
      template.bidMethod || null,
      template.signDate || null,
      template.taxRate || 9,
      template.category || 'labor',
      userId
    );

    const newTemplate = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error('创建模板错误:', error);
    return NextResponse.json({ error: '创建模板失败' }, { status: 500 });
  }
}