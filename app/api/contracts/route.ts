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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // 修改为返回所有项目（所有用户都可以查看）
    const db = getDb();

    let query = `
      SELECT c.*, u.username as created_by_name
      FROM contracts c
      LEFT JOIN users u ON c.created_by = u.id
    `;
    const params: any[] = [];

    if (projectId) {
      query += ' WHERE c.project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY c.created_at DESC';

    const contracts = db.prepare(query).all(...params);

    // 获取每个合同的月度计价数据
    const contractsWithBilling = contracts.map((contract: any) => {
      const monthlyBilling = db.prepare(
        'SELECT billing_date, amount FROM monthly_billing WHERE contract_id = ?'
      ).all(contract.id);

      const monthlyPayment = db.prepare(
        'SELECT payment_date as billing_date, amount FROM monthly_payment WHERE contract_id = ?'
      ).all(contract.id);

      return {
        ...contract,
        monthlyBilling: monthlyBilling.reduce((acc: any, item: any) => {
          acc[item.billing_date] = item.amount;
          return acc;
        }, {}),
        monthlyPaymentTaxIncluded: monthlyPayment.reduce((acc: any, item: any) => {
          acc[item.billing_date] = item.amount;
          return acc;
        }, {})
      };
    });

    return NextResponse.json({ contracts: contractsWithBilling });
  } catch (error) {
    console.error('获取合同错误:', error);
    return NextResponse.json({ error: '获取合同失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {

  const decoded = authenticate(request);

  if (!decoded) {

    return NextResponse.json({ error: '未授权' }, { status: 401 });

  }



  try {

    const userId = decoded.userId;

    const contract = await request.json();



    if (!contract.contractName || !contract.supplier || !contract.projectId) {

      return NextResponse.json(

        { error: '合同名称、供应单位和项目不能为空' },

        { status: 400 }

      );

    }



    const db = getDb();



    // 检查项目是否存在（所有用户都可以在任何项目中创建合同）

    const hasAccess = db.prepare(`

      SELECT 1 FROM projects p

      WHERE p.id = ?

    `).get(contract.projectId);



    if (!hasAccess) {

      return NextResponse.json({ error: '项目不存在' }, { status: 404 });

    }

    const result = db.prepare(`
      INSERT INTO contracts (
        project_id, contract_name, supplier, contract_number, contract_amount,
        bid_method, sign_date, payment_ratio, tax_rate,
        total_billing_tax_included, total_billing_tax_excluded,
        total_payment_tax_included, total_payment_tax_excluded,
        category, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      contract.projectId,
      contract.contractName,
      contract.supplier,
      contract.contractNumber || null,
      contract.contractAmount || null,
      contract.bidMethod || null,
      contract.signDate || null,
      contract.paymentRatio || null,
      contract.taxRate || 9,
      contract.totalBillingTaxIncluded || null,
      contract.totalBillingTaxExcluded || null,
      contract.totalPaymentTaxIncluded || null,
      contract.totalPaymentTaxExcluded || null,
      contract.category || 'labor',
      userId
    );

    // 如果有月度计价数据，插入月度计价表
    if (contract.monthlyBilling) {
      const insertBilling = db.prepare(
        'INSERT INTO monthly_billing (contract_id, billing_date, amount) VALUES (?, ?, ?)'
      );

      for (const [date, amount] of Object.entries(contract.monthlyBilling)) {
        if (amount) {
          insertBilling.run(result.lastInsertRowid, date, amount);
        }
      }
    }

    // 如果有月度付款数据，插入月度付款表
    if (contract.monthlyPaymentTaxIncluded) {
      const insertPayment = db.prepare(
        'INSERT INTO monthly_payment (contract_id, payment_date, amount) VALUES (?, ?, ?)'
      );

      for (const [date, amount] of Object.entries(contract.monthlyPaymentTaxIncluded)) {
        if (amount) {
          insertPayment.run(result.lastInsertRowid, date, amount);
        }
      }
    }

    const newContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ contract: newContract }, { status: 201 });
  } catch (error) {
    console.error('创建合同错误:', error);
    return NextResponse.json({ error: '创建合同失败' }, { status: 500 });
  }
}