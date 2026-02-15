import { NextRequest, NextResponse } from 'next/server';
import { getDb, verifyToken } from '@/lib/db';

function authenticate(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export async function PUT(

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
    const contract = await request.json();
    
    console.log('更新合同 - 合同ID:', id);
    console.log('更新合同 - 接收到的数据:', JSON.stringify(contract, null, 2));

    const db = getDb();

    // 检查合同是否存在（所有用户都可以编辑）
    const existingContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
    if (!existingContract) {
      return NextResponse.json({ error: '合同不存在' }, { status: 404 });
    }

    // 更新合同基本信息
    const updateStmt = db.prepare(`
      UPDATE contracts SET
        project_id = ?,
        contract_name = ?,
        supplier = ?,
        contract_number = ?,
        contract_amount = ?,
        bid_method = ?,
        sign_date = ?,
        payment_ratio = ?,
        tax_rate = ?,
        total_billing_tax_included = ?,
        total_billing_tax_excluded = ?,
        total_payment_tax_included = ?,
        total_payment_tax_excluded = ?,
        category = ?
      WHERE id = ?
    `);

    const paramsList = [
      contract.projectId || contract.project_id || existingContract.project_id,
      contract.contractName || contract.contract_name,
      contract.supplier,
      contract.contractNumber || contract.contract_number || null,
      contract.contractAmount || contract.contract_amount || null,
      contract.bidMethod || contract.bid_method || null,
      contract.signDate || contract.sign_date || null,
      contract.paymentRatio || contract.payment_ratio || null,
      contract.taxRate || 9,
      contract.totalBillingTaxIncluded || contract.total_billing_tax_included || null,
      contract.totalBillingTaxExcluded || contract.total_billing_tax_excluded || null,
      contract.totalPaymentTaxIncluded || contract.total_payment_tax_included || null,
      contract.totalPaymentTaxExcluded || contract.total_payment_tax_excluded || null,
      contract.category || 'labor',
      id
    ];

    console.log('更新合同 - SQL参数:', paramsList);

    updateStmt.run(...paramsList);

    // 更新月度计价数据
    if (contract.monthlyBilling !== undefined) {
      // 删除旧的计价数据
      db.prepare('DELETE FROM monthly_billing WHERE contract_id = ?').run(id);

      // 插入新的计价数据
      if (contract.monthlyBilling) {
        const insertBilling = db.prepare(
          'INSERT INTO monthly_billing (contract_id, billing_date, amount) VALUES (?, ?, ?)'
        );

        for (const [date, amount] of Object.entries(contract.monthlyBilling)) {
          if (amount) {
            insertBilling.run(id, date, amount);
          }
        }
      }
    }

    // 更新月度付款数据
    if (contract.monthlyPaymentTaxIncluded !== undefined) {
      // 删除旧的付款数据
      db.prepare('DELETE FROM monthly_payment WHERE contract_id = ?').run(id);

      // 插入新的付款数据
      if (contract.monthlyPaymentTaxIncluded) {
        const insertPayment = db.prepare(
          'INSERT INTO monthly_payment (contract_id, payment_date, amount) VALUES (?, ?, ?)'
        );

        for (const [date, amount] of Object.entries(contract.monthlyPaymentTaxIncluded)) {
          if (amount) {
            insertPayment.run(id, date, amount);
          }
        }
      }
    }

    const updatedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    
    console.log('更新合同成功 - 合同ID:', id);
    console.log('更新合同成功 - 项目ID:', updatedContract.project_id);
    console.log('更新合同成功 - 合同名称:', updatedContract.contract_name);

    // 返回简单的成功消息，避免序列化问题
    return NextResponse.json({ 
      success: true,
      message: '合同更新成功',
      contract: {
        id: updatedContract.id,
        project_id: updatedContract.project_id,
        contract_name: updatedContract.contract_name
      }
    });
  } catch (error) {
    console.error('更新合同错误:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: '更新合同失败: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
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



    // 检查合同是否存在（所有用户都可以删除）

    const existingContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;

    if (!existingContract) {

      return NextResponse.json({ error: '合同不存在' }, { status: 404 });

    }



    // 删除合同（会级联删除相关月度数据）

    db.prepare('DELETE FROM contracts WHERE id = ?').run(id);

    return NextResponse.json({ message: '合同已删除' });
  } catch (error) {
    console.error('删除合同错误:', error);
    return NextResponse.json({ error: '删除合同失败' }, { status: 500 });
  }
}