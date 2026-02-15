'use client';

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import { contractsApi, clearToken } from '@/lib/api';

interface ContractData {
  id: string;
  contractName: string;
  supplier: string;
  contractNumber: string;
  contractAmount: string;
  bidMethod: string;
  signDate: string;
  paymentRatio: string;
  taxRate: number;
  totalBillingTaxIncluded: string;
  totalBillingTaxExcluded: string;
  totalPaymentTaxIncluded: string;
  totalPaymentTaxExcluded: string;
  monthlyBilling: Record<string, string>;
  monthlyPaymentTaxIncluded: Record<string, string>;
  createdAt: string;
}

export default function ContractDetail() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const [contract, setContract] = useState<ContractData | null>(null);
  const [timelineStart, setTimelineStart] = useState('2025-01');
  const [timelineEnd, setTimelineEnd] = useState('2026-12');
  const [alertMessage, setAlertMessage] = useState<{ type: string, message: string } | null>(null);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      const response = await contractsApi.list();
      const foundContract = response.contracts.find((c: any) => c.id.toString() === contractId);
      if (foundContract) {
        console.log('找到的合同数据:', JSON.stringify(foundContract, null, 2));
        console.log('project_id 字段:', foundContract.project_id);
        console.log('monthlyBilling:', foundContract.monthlyBilling);
        console.log('monthlyPaymentTaxIncluded:', foundContract.monthlyPaymentTaxIncluded);
        
        // 确保月度数据是对象格式
        const formattedContract = {
          ...foundContract,
          monthlyBilling: foundContract.monthlyBilling || {},
          monthlyPaymentTaxIncluded: foundContract.monthlyPaymentTaxIncluded || {},
        };
        
        console.log('格式化后的 monthlyBilling:', formattedContract.monthlyBilling);
        setContract(formattedContract);
      } else {
        setAlertMessage({ type: 'danger', message: '合同不存在' });
      }
    } catch (error: any) {
      console.error('加载合同失败:', error);
      if (error.message?.includes('未授权') || error.message?.includes('401')) {
        clearToken();
        router.push('/login');
      } else {
        setAlertMessage({ type: 'danger', message: '加载合同失败' });
      }
    }
  };

    const saveContract = async (updatedContract: ContractData) => {

      try {
        console.log('保存合同 - 合同ID:', updatedContract.id);
        console.log('保存合同 - 项目ID:', updatedContract.projectId);
        console.log('保存合同 - 完整数据:', JSON.stringify(updatedContract, null, 2));

        await contractsApi.update(updatedContract.id, updatedContract);

        setContract(updatedContract);

        setAlertMessage({ type: 'success', message: '保存成功' });

      } catch (error: any) {

        console.error('保存合同失败:', error);
        setAlertMessage({ type: 'danger', message: `保存失败: ${error.message || '未知错误'}` });

      }

    };

  

  // 生成时间轴

    const handleGenerateTimeline = () => {
    if (!contract) return;

    const [startYear, startMonth] = timelineStart.split('-').map(Number);
    const [endYear, endMonth] = timelineEnd.split('-').map(Number);

    // 验证时间范围
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
      setAlertMessage({ type: 'danger', message: '起始时间不能晚于结束时间' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    let currentYear = startYear;
    let currentMonth = startMonth;

    const newMonthlyBilling: Record<string, string> = {};
    const newMonthlyPayment: Record<string, string> = {};
    const pendingBilling = (contract as any)._pendingBilling || {};

    // 显示待填充的月份信息
    const pendingMonths = Object.keys(pendingBilling);
    if (pendingMonths.length > 0) {
      console.log('待填充的月份:', pendingMonths);
      console.log('待填充的金额:', pendingBilling);
    }

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const key = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      newMonthlyBilling[key] = contract.monthlyBilling?.[key] || pendingBilling[key] || '';
      newMonthlyPayment[key] = contract.monthlyPaymentTaxIncluded?.[key] || '';
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    // 验证累计计价
    let calculatedTotal = 0;
    Object.values(newMonthlyBilling).forEach(amount => {
      const num = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(num)) {
        calculatedTotal += num;
      }
    });

    const storedTotal = contract.totalBillingTaxExcluded
      ? parseFloat(contract.totalBillingTaxExcluded.replace(/,/g, ''))
      : 0;
    const hasError = !isNaN(storedTotal) && Math.abs(calculatedTotal - storedTotal) > 0.01;

    const updatedContract = {
      id: contract.id,
      projectId: contract.projectId || contract.project_id,
      contractName: contract.contractName || contract.contract_name || '',
      supplier: contract.supplier || contract.supplier || '',
      contractNumber: contract.contractNumber || contract.contract_number || '',
      contractAmount: contract.contractAmount || contract.contract_amount || '',
      bidMethod: contract.bidMethod || contract.bid_method || '',
      signDate: contract.signDate || contract.sign_date || '',
      taxRate: contract.taxRate || 9,
      totalBillingTaxExcluded: Object.values(newMonthlyBilling).reduce((sum: number, amount: number) => sum + (parseFloat(amount.replace(/,/g, '')) || 0), 0).toFixed(2),
      totalBillingTaxIncluded: (Object.values(newMonthlyBilling).reduce((sum: number, amount: number) => sum + (parseFloat(amount.replace(/,/g, '')) || 0), 0) * (1 + (contract.taxRate || 9) / 100)).toFixed(2),
      totalPaymentTaxExcluded: (Object.values(newMonthlyPayment).reduce((sum: number, amount: number) => sum + (parseFloat(amount.replace(/,/g, '')) || 0), 0) / (1 + (contract.taxRate || 9) / 100)).toFixed(2),
      totalPaymentTaxIncluded: Object.values(newMonthlyPayment).reduce((sum: number, amount: number) => sum + (parseFloat(amount.replace(/,/g, '')) || 0), 0).toFixed(2),
      category: contract.category || 'labor',
      monthlyBilling: newMonthlyBilling,
      monthlyPaymentTaxIncluded: newMonthlyPayment,
      // 重新计算支付比例
      paymentRatio: contract.contractAmount && parseFloat(contract.contractAmount.replace(/,/g, '')) > 0
        ? ((parseFloat(Object.values(newMonthlyPayment).reduce((sum: number, amount: number) => sum + (parseFloat(amount.replace(/,/g, '')) || 0), 0)) / parseFloat(contract.contractAmount.replace(/,/g, ''))) * 100).toFixed(2)
        : '',
    };

    console.log('生成时间轴 - 更新前的 projectId:', contract.projectId, contract.project_id);
    console.log('生成时间轴 - 更新后的 projectId:', updatedContract.projectId);
    console.log('生成时间轴 - 合同 ID:', updatedContract.id);

    // 删除临时字段
    delete (updatedContract as any)._pendingBilling;
    delete (updatedContract as any)._needTimeline;
    delete (updatedContract as any)._currentBilling;

    saveContract(updatedContract);
    setContract(updatedContract);

    if (hasError) {
      setAlertMessage({
        type: 'warning',
        message: `时间轴生成成功，但累计计价不匹配！月度总计：${calculatedTotal.toFixed(2)}，存储值：${storedTotal.toFixed(2)}`
      });
    } else {
      const filledCount = Object.keys(pendingBilling).length;
      const message = filledCount > 0
        ? `时间轴生成成功！已自动填充 ${filledCount} 个月的计价数据`
        : '时间轴生成成功，计价数据验证通过';
      setAlertMessage({ type: 'success', message });
    }
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const handleMonthlyBillingChange = (month: string, value: string) => {
    try {
      if (!contract) return;
      console.log('修改计价 - month:', month, 'value:', value);
      const newMonthlyBilling = { ...contract.monthlyBilling };
      newMonthlyBilling[month] = value;
      console.log('修改计价 - newMonthlyBilling:', newMonthlyBilling);

      // 不自动更新累计计价，只更新月度数据
      const updatedContract = {
        ...contract,
        projectId: contract.projectId || contract.project_id,
        monthlyBilling: newMonthlyBilling,
      };

      console.log('修改计价 - 准备保存:', updatedContract);
      saveContract(updatedContract);
    } catch (error) {
      console.error('修改计价时出错:', error);
    }
  };

  const validateBillingTotal = () => {
    if (!contract) return null;

    let calculatedTotal = 0;
    Object.values(contract.monthlyBilling || {}).forEach(amount => {
      const num = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(num)) {
        calculatedTotal += num;
      }
    });

    // 支持两种命名方式：驼峰和下划线
    const storedTotal = (contract.totalBillingTaxExcluded || contract.total_billing_tax_excluded)
      ? parseFloat((contract.totalBillingTaxExcluded || contract.total_billing_tax_excluded).replace(/,/g, ''))
      : 0;
    const difference = calculatedTotal - storedTotal;

    return {
      calculatedTotal,
      storedTotal: isNaN(storedTotal) ? 0 : storedTotal,
      difference,
      isMatch: Math.abs(difference) <= 0.01
    };
  };

  const handleMonthlyPaymentChange = (month: string, value: string) => {
    if (!contract) return;
    const newMonthlyPayment = { ...contract.monthlyPaymentTaxIncluded };
    newMonthlyPayment[month] = value;

    // 计算累计付款
    let totalPaymentIncluded = 0;
    Object.values(newMonthlyPayment).forEach(amount => {
      if (amount) {
        const num = parseFloat(amount.replace(/,/g, ''));
        if (!isNaN(num)) {
          totalPaymentIncluded += num;
        }
      }
    });

    // 计算不含税金额
    const taxRate = contract.taxRate || 9;
    const totalPaymentExcluded = totalPaymentIncluded / (1 + taxRate / 100);

    const contractAmount = contract.contractAmount || contract.contract_amount || '';
    console.log('保存付款 - contractAmount:', contractAmount);
    console.log('保存付款 - totalPaymentIncluded:', totalPaymentIncluded);
    
    let paymentRatio = '';
    if (contractAmount && parseFloat(contractAmount.replace(/,/g, '')) > 0) {
      paymentRatio = ((totalPaymentIncluded / parseFloat(contractAmount.replace(/,/g, ''))) * 100).toFixed(2);
    }
    console.log('保存付款 - paymentRatio:', paymentRatio);

    const updatedContract = {
      ...contract,
      monthlyPaymentTaxIncluded: newMonthlyPayment,
      totalPaymentTaxIncluded: totalPaymentIncluded.toFixed(2),
      totalPaymentTaxExcluded: totalPaymentExcluded.toFixed(2),
      paymentRatio: paymentRatio
    };

    console.log('保存付款 - 更新后的数据:', updatedContract);
    saveContract(updatedContract);
    setContract(updatedContract);
  };

  // 同步累计计价
  const syncBillingTotal = () => {
    if (!contract) return;
    
    let calculatedTotal = 0;
    Object.values(contract.monthlyBilling || {}).forEach(amount => {
      const num = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(num)) {
        calculatedTotal += num;
      }
    });

    const updatedContract = {
      id: contract.id,
      projectId: contract.projectId || contract.project_id,
      contractName: contract.contractName || contract.contract_name || '',
      supplier: contract.supplier || '',
      contractNumber: contract.contractNumber || contract.contract_number || '',
      contractAmount: contract.contractAmount || contract.contract_amount || '',
      bidMethod: contract.bidMethod || contract.bid_method || '',
      signDate: contract.signDate || contract.sign_date || '',
      taxRate: contract.taxRate || 9,
      totalBillingTaxExcluded: calculatedTotal > 0 ? calculatedTotal.toFixed(2) : '',
      totalBillingTaxIncluded: calculatedTotal > 0
        ? (calculatedTotal * (1 + (contract.taxRate || 9) / 100)).toFixed(2)
        : '',
      totalPaymentTaxIncluded: contract.totalPaymentTaxIncluded || contract.total_payment_tax_included || '',
      totalPaymentTaxExcluded: contract.totalPaymentTaxExcluded || contract.total_payment_tax_excluded || '',
      category: contract.category || 'labor',
      monthlyBilling: contract.monthlyBilling || {},
      monthlyPaymentTaxIncluded: contract.monthlyPaymentTaxIncluded || {},
      paymentRatio: contract.paymentRatio || '',
    };

    console.log('同步累计计价 - 更新后的数据:', updatedContract);
    saveContract(updatedContract);
    setContract(updatedContract);
    setAlertMessage({ type: 'success', message: '累计计价已同步' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const calculateTotalMonthly = () => {
    if (!contract) return { total: 0, months: 0 };
    let total = 0;
    let months = 0;
    Object.values(contract.monthlyBilling || {}).forEach(amount => {
      const num = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(num)) {
        total += num;
        months++;
      }
    });
    return { total, months };
  };

  // 生成时间轴月份列表
  const generateTimelineMonths = () => {
    const months: string[] = [];
    const [startYear, startMonth] = timelineStart.split('-').map(Number);
    const [endYear, endMonth] = timelineEnd.split('-').map(Number);
    
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      months.push(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`);
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    return months;
  };

  if (!contract) {
    return (
      <Container fluid className="min-vh-100 py-4">
        <div className="text-center py-5">
          <h3 className="text-muted">合同不存在</h3>
          <Button variant="primary" className="mt-3" onClick={() => router.push('/')}>
            返回列表
          </Button>
        </div>
      </Container>
    );
  }

  const { total, months } = calculateTotalMonthly();

  const validation = validateBillingTotal();
    
    console.log('验证结果:', validation);
    console.log('验证 - 计算总计:', validation?.calculatedTotal);
    console.log('验证 - 存储总计:', validation?.storedTotal);
    console.log('验证 - 差异:', validation?.difference);
    console.log('验证 - 是否匹配:', validation?.isMatch);

  // 检查是否有待填充的计价金额
  const hasPendingBilling = (contract as any)?._pendingBilling &&
    Object.keys((contract as any)._pendingBilling).length > 0;

  const pendingMonth = (contract as any)?._billingDate || '';

  return (
    <Container fluid className="min-vh-100 py-4">
      <div className="mb-4">
        <Button variant="light" className="mb-3" onClick={() => router.push('/')}>
          ← 返回列表
        </Button>
        <h1 className="fw-bold mb-1">{contract.contractName}</h1>
        <p className="text-muted mb-0">{contract.supplier} · {contract.contractNumber || contract.contract_number || '无合同编号'}</p>
      </div>

      {alertMessage && (
        <Alert variant={alertMessage.type as any} dismissible onClose={() => setAlertMessage(null)} className="mb-4">
          {alertMessage.message}
        </Alert>
      )}

      {/* 待填充计价金额提示 */}
      {hasPendingBilling && (
        <Alert variant="info" className="mb-4">
          <strong>ℹ️ 有待填充的计价金额</strong><br />
          检测到从PDF识别的计价金额（计价单日期：{pendingMonth}），请生成时间轴后自动填充到对应月份。
        </Alert>
      )}

      {/* 验证结果提示 */}
      {(contract as any)._pendingBilling && Object.keys((contract as any)._pendingBilling).length > 0 && (
        <Alert variant="info" className="mb-4">
          <strong>📋 待填充的计价信息</strong><br />
          检测到 {Object.keys((contract as any)._pendingBilling).length} 个待填充的月份，生成时间轴后将自动填充：
          <ul className="mb-0 mt-2">
            {Object.entries((contract as any)._pendingBilling).map(([month, amount]) => (
              <li key={month}>
                <strong>{month}</strong>: {String(amount)} 元
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {validation && !validation.isMatch && (
        <Alert variant="warning" className="mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>⚠️ 计价数据验证警告</strong><br />
              月度计价总计：{validation.calculatedTotal.toFixed(2)}<br />
              累计计价存储值：{validation.storedTotal.toFixed(2)}<br />
              差异：{Math.abs(validation.difference).toFixed(2)}
            </div>
            <Button 
              variant="warning" 
              size="sm" 
              onClick={syncBillingTotal}
              className="ms-3"
            >
              同步累计计价
            </Button>
          </div>
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">合同金额</small>
              <h4 className="fw-bold mb-0">{contract.contractAmount || contract.contract_amount || '-'}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">税率</small>
              <h4 className="fw-bold mb-0">{contract.taxRate || 9}%</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">累计计价(不含税)</small>
              <h4 className="fw-bold mb-0 text-success">{contract.totalBillingTaxExcluded || contract.total_billing_tax_excluded || '-'}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">累计计价(含税)</small>
              <h4 className="fw-bold mb-0 text-primary">{contract.totalBillingTaxIncluded || contract.total_billing_tax_included || '-'}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">累计付款(不含税)</small>
              <h4 className="fw-bold mb-0 text-info">{contract.totalPaymentTaxExcluded || contract.total_payment_tax_excluded || '-'}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">累计付款(含税)</small>
              <h4 className="fw-bold mb-0 text-warning">{contract.totalPaymentTaxIncluded || contract.total_payment_tax_included || '-'}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <small className="text-muted d-block mb-1">支付比例</small>
              <h4 className="fw-bold mb-0">{contract.paymentRatio ? `${contract.paymentRatio}%` : '-'}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3">生成月度计价时间轴</h5>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold">起始月份</Form.Label>
                <Form.Control
                  type="month"
                  value={timelineStart}
                  onChange={(e) => setTimelineStart(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold">结束月份</Form.Label>
                <Form.Control
                  type="month"
                  value={timelineEnd}
                  onChange={(e) => setTimelineEnd(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button variant="primary" onClick={handleGenerateTimeline}>
                生成时间轴
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="p-4 border-bottom bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">月度计价记录</h5>
              <div>
                <span className="text-muted small me-3">已记录 {months} 个月</span>
                <span className="text-muted small">总计: <strong>{total.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
          <div className="table-responsive">
              {console.log('渲染时 monthlyBilling:', contract.monthlyBilling)}
              {console.log('渲染时 monthlyBilling 长度:', Object.keys(contract.monthlyBilling || {}).length)}
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">月份</th>
                    <th className="px-4 py-3">计价金额(不含税)</th>
                    <th className="px-4 py-3">支付金额(含税)</th>
                    <th className="px-4 py-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {generateTimelineMonths().map(month => {
                    const billingAmount = contract.monthlyBilling?.[month] || '';
                    const paymentAmount = contract.monthlyPaymentTaxIncluded?.[month] || '';
                    return (
                      <tr key={month} className="border-bottom">
                        <td className="px-4 py-3 fw-semibold">{month}</td>
                        <td className="px-4 py-3">
                          <Form.Control
                            type="text"
                            value={billingAmount}
                            onChange={(e) => handleMonthlyBillingChange(month, e.target.value)}
                            placeholder="请输入计价金额"
                            className="fw-semibold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Form.Control
                            type="text"
                            value={paymentAmount}
                            onChange={(e) => handleMonthlyPaymentChange(month, e.target.value)}
                            placeholder="请输入支付金额"
                            className="fw-semibold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {billingAmount && parseFloat(billingAmount.replace(/,/g, '')) > 0 ? (
                            <span className="badge bg-success">已计价</span>
                          ) : (
                            <span className="badge bg-light text-muted">未计价</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
        </Card.Body>
      </Card>
    </Container>
  );
}