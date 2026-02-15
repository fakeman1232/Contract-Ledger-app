'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, InputGroup, Dropdown } from 'react-bootstrap';

// 动态导入PDF.js以避免服务端渲染问题
let pdfjsLib: any = null;

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

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
  category: string;
  projectId: string;
  monthlyBilling: Record<string, string>;
  monthlyPaymentTaxIncluded: Record<string, string>;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  contractName: string;
  supplier: string;
  contractNumber: string;
  contractAmount: string;
  bidMethod: string;
  signDate: string;
  taxRate: number;
  category: string;
  createdAt: string;
}

interface ExtractedData {
  supplier?: string;
  contractNumber?: string;
  currentBillingTaxExcluded?: string;
  yearBillingTaxExcluded?: string;
  totalBillingTaxExcluded?: string;
  billingDate?: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false);
  const [currentContract, setCurrentContract] = useState<Partial<ContractData>>({});
  const [currentProjectForm, setCurrentProjectForm] = useState<Partial<Project>>({});
  const [currentTemplateForm, setCurrentTemplateForm] = useState<Partial<Template>>({});
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: string, message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const categories = ['overview', 'labor', 'professional', 'technology', 'material'];
  const categoryNames: Record<string, string> = {
    overview: '总览',
    labor: '劳务分包',
    professional: '专业分包',
    technology: '技术服务',
    material: '物资租赁'
  };

  // 动态加载PDF.js
  const loadPDFLib = async () => {
    if (!pdfjsLib) {
      const module = await import('pdfjs-dist');
      pdfjsLib = module;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    return pdfjsLib;
  };

  // 从本地存储加载数据
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    const savedContracts = localStorage.getItem('contracts');
    const savedTemplates = localStorage.getItem('templates');
    const savedCurrentProject = localStorage.getItem('currentProject');
    
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedContracts) setContracts(JSON.parse(savedContracts));
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    if (savedCurrentProject) setCurrentProject(JSON.parse(savedCurrentProject));
  }, []);

  // 保存数据到本地存储
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const saveContracts = (updatedContracts: ContractData[]) => {
    setContracts(updatedContracts);
    localStorage.setItem('contracts', JSON.stringify(updatedContracts));
  };

  const saveTemplates = (updatedTemplates: Template[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('templates', JSON.stringify(updatedTemplates));
  };

  const saveCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('currentProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('currentProject');
    }
  };

  // 过滤合同（基于当前项目和分类）
  const getFilteredContracts = () => {
    let filtered = contracts;
    
    // 按项目过滤
    if (currentProject) {
      filtered = filtered.filter(c => c.projectId === currentProject.id);
    }
    
    // 按分类过滤
    if (activeTab !== 'overview') {
      filtered = filtered.filter(c => c.category === activeTab);
    }
    
    return filtered;
  };

  // 获取统计数据
  const getStatistics = () => {
    const filteredContracts = getFilteredContracts();
    
    const stats = {
      totalContracts: filteredContracts.length,
      totalContractAmount: 0,
      totalBilling: 0,
      totalPayment: 0,
      byCategory: {
        labor: { count: 0, amount: 0, billing: 0, payment: 0 },
        professional: { count: 0, amount: 0, billing: 0, payment: 0 },
        technology: { count: 0, amount: 0, billing: 0, payment: 0 },
        material: { count: 0, amount: 0, billing: 0, payment: 0 }
      }
    };

    filteredContracts.forEach(c => {
      const amount = parseFloat(c.contractAmount.replace(/,/g, '')) || 0;
      const billing = parseFloat(c.totalBillingTaxIncluded.replace(/,/g, '')) || 0;
      const payment = parseFloat(c.totalPaymentTaxIncluded.replace(/,/g, '')) || 0;

      stats.totalContractAmount += amount;
      stats.totalBilling += billing;
      stats.totalPayment += payment;

      if (c.category && stats.byCategory[c.category as keyof typeof stats.byCategory]) {
        const cat = stats.byCategory[c.category as keyof typeof stats.byCategory];
        cat.count++;
        cat.amount += amount;
        cat.billing += billing;
        cat.payment += payment;
      }
    });

    return stats;
  };

  // 解析PDF文本提取计价信息
  const extractPricingInfo = (text: string): ExtractedData => {
    const result: ExtractedData = {};

    // 提取分包方 - 匹配"分包方："后面直到"计价编号"或行尾的内容
    const supplierMatch = text.match(/分包方[：:]\s*([^\s\n]+?)(?=\s*计价编号|$)/);
    if (supplierMatch) {
      result.supplier = supplierMatch[1].trim();
    }

    // 提取计价编号 - 匹配"计价编号："后面的内容
    const billingNumberMatch = text.match(/计价编号[：:]\s*([^\s\n]+)/);
    if (billingNumberMatch) {
      result.contractNumber = billingNumberMatch[1].trim();
    }

    // 提取计价日期（格式：2025 年 12 月）
    const dateMatch = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      result.billingDate = `${year}-${month}`;
    }

    const currentMatch = text.match(/本期计价金额\s*([0-9,]+\.?\d*)\s*元/);
    if (currentMatch) {
      result.currentBillingTaxExcluded = currentMatch[1];
    }

    const yearMatch = text.match(/本年开累计价金额\s*([0-9,]+\.?\d*)\s*元/);
    if (yearMatch) {
      result.yearBillingTaxExcluded = yearMatch[1];
    }

    const totalMatch = text.match(/开累计价金额\s*([0-9,]+\.?\d*)\s*元/);
    if (totalMatch) {
      result.totalBillingTaxExcluded = totalMatch[1];
    }

    return result;
  };

  // 读取PDF文件
  const readPDF = async (file: File): Promise<string> => {
    const pdfLib = await loadPDFLib();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfLib.getDocument({
      data: arrayBuffer,
      workerSrc: '/pdf.worker.min.mjs'
    }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  // 计算不含税金额
  const calculateTaxExcluded = (taxIncluded: string, taxRate: number): string => {
    const included = parseFloat(taxIncluded.replace(/,/g, ''));
    if (isNaN(included)) return '';
    const excluded = included / (1 + taxRate / 100);
    return excluded.toFixed(2);
  };

  // 计算含税金额
  const calculateTaxIncluded = (taxExcluded: string, taxRate: number): string => {
    const excluded = parseFloat(taxExcluded.replace(/,/g, ''));
    if (isNaN(excluded)) return '';
    const included = excluded * (1 + taxRate / 100);
    return included.toFixed(2);
  };

  // 计算支付比例
  const calculatePaymentRatio = (payment: string, contractAmount: string): string => {
    const pay = parseFloat(payment.replace(/,/g, ''));
    const amount = parseFloat(contractAmount.replace(/,/g, ''));
    if (!pay || !amount || amount === 0) return '';
    return ((pay / amount) * 100).toFixed(2);
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setAlertMessage({ type: 'danger', message: '请上传PDF文件' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    if (!currentProject) {
      setAlertMessage({ type: 'warning', message: '请先选择或创建项目' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const text = await readPDF(file);
      const extracted = extractPricingInfo(text);
      setExtractedData(extracted);

      const existingContract = contracts.find(c =>
        c.supplier === extracted.supplier && c.projectId === currentProject.id
      );

      const taxRate = 9;

      if (existingContract) {
                // 取最大的累计计价金额（不被更小的覆盖）
                const currentTotal = parseFloat(existingContract.totalBillingTaxExcluded.replace(/,/g, '')) || 0;
                const newTotal = extracted.totalBillingTaxExcluded ? parseFloat(extracted.totalBillingTaxExcluded.replace(/,/g, '')) || 0 : 0;
                const finalTotal = Math.max(currentTotal, newTotal);
                
                const updatedContract = {
                  ...existingContract,
                  contractNumber: extracted.contractNumber || existingContract.contractNumber,
                  totalBillingTaxExcluded: finalTotal > 0 ? finalTotal.toLocaleString() : existingContract.totalBillingTaxExcluded,
                  totalBillingTaxIncluded: finalTotal > 0
                    ? calculateTaxIncluded(finalTotal.toLocaleString(), existingContract.taxRate)
                    : existingContract.totalBillingTaxIncluded,
                };
        // 检查是否已生成时间轴，如果有则自动填充月度计价
        const hasTimeline = Object.keys(existingContract.monthlyBilling || {}).length > 0;
        if (hasTimeline && extracted.currentBillingTaxExcluded && extracted.billingDate) {
          const newMonthlyBilling = { ...existingContract.monthlyBilling };
          newMonthlyBilling[extracted.billingDate] = extracted.currentBillingTaxExcluded;
          updatedContract.monthlyBilling = newMonthlyBilling;
        } else if (!hasTimeline && extracted.currentBillingTaxExcluded && extracted.billingDate) {
          const existingPending = (existingContract as any)._pendingBilling || {};
          const newPending = { ...existingPending };
          newPending[extracted.billingDate] = extracted.currentBillingTaxExcluded;
          (updatedContract as any)._pendingBilling = newPending;
        }

        saveContracts(contracts.map(c => c.id === existingContract.id ? updatedContract : c));
        setAlertMessage({
          type: 'info',
          message: `已找到"${extracted.supplier}"的现有档案，计价金额已自动填充到${extracted.billingDate}，累计计价已更新`
        });
      } else {
        // 新合同，要求生成时间轴
        const newTaxExcluded = extracted.totalBillingTaxExcluded || '';
        setCurrentContract({
          supplier: extracted.supplier || '',
          contractName: extracted.supplier || file.name.replace('.pdf', ''),
          contractNumber: extracted.contractNumber || '',
          contractAmount: '',
          bidMethod: '',
          signDate: '',
          paymentRatio: '',
          taxRate: taxRate,
          totalBillingTaxIncluded: newTaxExcluded
            ? calculateTaxIncluded(newTaxExcluded, taxRate)
            : '',
          totalBillingTaxExcluded: newTaxExcluded,
          totalPaymentTaxIncluded: '',
          totalPaymentTaxExcluded: '',
          category: activeTab === 'overview' ? 'labor' : activeTab,
          projectId: currentProject.id,
          monthlyBilling: {},
          monthlyPaymentTaxIncluded: {},
          _needTimeline: true,
          _currentBilling: extracted.currentBillingTaxExcluded || '',
          _billingDate: extracted.billingDate || new Date().toISOString().slice(0, 7),
        } as any);
        setAlertMessage({
          type: 'success',
          message: 'PDF解析成功！请完善合同信息并生成时间轴'
        });
        setShowModal(true);
      }

      setShowUploadModal(false);
      setTimeout(() => setAlertMessage(null), 5000);
    } catch (error) {
      console.error('PDF解析错误:', error);
      setAlertMessage({ type: 'danger', message: `PDF解析失败: ${error instanceof Error ? error.message : '请检查文件格式'}` });
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理多文件上传
  const handleMultipleFileUpload = async (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file =>
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setAlertMessage({ type: 'danger', message: '请选择PDF文件' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    if (!currentProject) {
      setAlertMessage({ type: 'warning', message: '请先选择或创建项目' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    let updatedContracts = [...contracts];

    for (const file of pdfFiles) {
      try {
        const text = await readPDF(file);
        const extracted = extractPricingInfo(text);

        const existingContract = updatedContracts.find(c =>
          c.supplier === extracted.supplier && c.projectId === currentProject.id
        );

        const taxRate = 9;

        if (existingContract) {
          const currentTotal = parseFloat(existingContract.totalBillingTaxExcluded.replace(/,/g, '')) || 0;
          const newTotal = extracted.totalBillingTaxExcluded ? parseFloat(extracted.totalBillingTaxExcluded.replace(/,/g, '')) || 0 : 0;
          const finalTotal = Math.max(currentTotal, newTotal);
          
          const updatedContract = {
            ...existingContract,
            contractNumber: extracted.contractNumber || existingContract.contractNumber,
            totalBillingTaxExcluded: finalTotal > 0 ? finalTotal.toLocaleString() : existingContract.totalBillingTaxExcluded,
            totalBillingTaxIncluded: finalTotal > 0
              ? calculateTaxIncluded(finalTotal.toLocaleString(), existingContract.taxRate)
              : existingContract.totalBillingTaxIncluded,
          };

          const hasTimeline = Object.keys(existingContract.monthlyBilling || {}).length > 0;
          if (hasTimeline && extracted.currentBillingTaxExcluded && extracted.billingDate) {
            const newMonthlyBilling = { ...existingContract.monthlyBilling };
            newMonthlyBilling[extracted.billingDate] = extracted.currentBillingTaxExcluded;
            updatedContract.monthlyBilling = newMonthlyBilling;
          } else if (!hasTimeline && extracted.currentBillingTaxExcluded && extracted.billingDate) {
            const existingPending = (existingContract as any)._pendingBilling || {};
            const newPending = { ...existingPending };
            newPending[extracted.billingDate] = extracted.currentBillingTaxExcluded;
            (updatedContract as any)._pendingBilling = newPending;
          }

          updatedContracts = updatedContracts.map(c =>
            c.id === existingContract.id ? updatedContract : c
          );
        } else {
          const newTaxExcluded = extracted.totalBillingTaxExcluded || '';
          const billingDate = extracted.billingDate || new Date().toISOString().slice(0, 7);
          
          const existingContractInLoop = updatedContracts.find(c =>
            c.supplier === extracted.supplier && c.projectId === currentProject.id
          );
          
          let finalTaxExcluded = newTaxExcluded;
          if (existingContractInLoop && newTaxExcluded) {
            const existingTotal = parseFloat(existingContractInLoop.totalBillingTaxExcluded.replace(/,/g, '')) || 0;
            const newTotal = parseFloat(newTaxExcluded.replace(/,/g, '')) || 0;
            finalTaxExcluded = Math.max(existingTotal, newTotal).toLocaleString();
          }
          
          const newContract: ContractData = {
            id: Date.now().toString() + Math.random(),
            contractName: extracted.supplier || file.name.replace('.pdf', ''),
            supplier: extracted.supplier || '',
            contractNumber: extracted.contractNumber || '',
            contractAmount: '',
            bidMethod: '',
            signDate: '',
            paymentRatio: '',
            taxRate: taxRate,
            totalBillingTaxIncluded: finalTaxExcluded
              ? calculateTaxIncluded(finalTaxExcluded, taxRate)
              : '',
            totalBillingTaxExcluded: finalTaxExcluded,
            totalPaymentTaxIncluded: '',
            totalPaymentTaxExcluded: '',
            category: activeTab === 'overview' ? 'labor' : activeTab,
            projectId: currentProject.id,
            monthlyBilling: {},
            monthlyPaymentTaxIncluded: {},
            createdAt: new Date().toLocaleString('zh-CN'),
          };

          if (extracted.currentBillingTaxExcluded) {
            (newContract as any)._pendingBilling = {};
            (newContract as any)._pendingBilling[billingDate] = extracted.currentBillingTaxExcluded;
            (newContract as any)._billingDate = billingDate;
          }

          updatedContracts = [...updatedContracts, newContract];
        }
        successCount++;
      } catch (error) {
        console.error(`解析文件 ${file.name} 失败:`, error);
        failCount++;
      }
    }

    saveContracts(updatedContracts);
    setIsLoading(false);
    setShowUploadModal(false);
    if (successCount > 0) {
      setAlertMessage({
        type: 'success',
        message: `成功识别 ${successCount} 个文件${failCount > 0 ? `，失败 ${failCount} 个` : ''}。请点击"月度计价"生成时间轴以自动填充计价信息`
      });
      setTimeout(() => setAlertMessage(null), 5000);
    } else {
      setAlertMessage({ type: 'danger', message: '所有文件解析失败' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // 添加合同
  const handleAddContract = () => {
    if (!currentContract.contractName || !currentContract.supplier) {
      setAlertMessage({ type: 'danger', message: '请填写合同名称和供应单位' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    if (!currentProject) {
      setAlertMessage({ type: 'danger', message: '请先选择项目' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const needTimeline = (currentContract as any)._needTimeline;
    const currentBilling = (currentContract as any)._currentBilling;
    const billingDate = (currentContract as any)._billingDate;

    const newContract: ContractData = {
      id: Date.now().toString(),
      contractName: currentContract.contractName || '',
      supplier: currentContract.supplier || '',
      contractNumber: currentContract.contractNumber || '',
      contractAmount: currentContract.contractAmount || '',
      bidMethod: currentContract.bidMethod || '',
      signDate: currentContract.signDate || '',
      paymentRatio: currentContract.paymentRatio || '',
      taxRate: currentContract.taxRate || 9,
      totalBillingTaxIncluded: currentContract.totalBillingTaxIncluded || '',
      totalBillingTaxExcluded: currentContract.totalBillingTaxExcluded || '',
      totalPaymentTaxIncluded: currentContract.totalPaymentTaxIncluded || '',
      totalPaymentTaxExcluded: currentContract.totalPaymentTaxExcluded || '',
      category: currentContract.category || (activeTab === 'overview' ? 'labor' : activeTab),
      projectId: currentProject.id,
      monthlyBilling: currentContract.monthlyBilling || {},
      monthlyPaymentTaxIncluded: currentContract.monthlyPaymentTaxIncluded || {},
      createdAt: new Date().toLocaleString('zh-CN'),
    };

    delete (newContract as any)._needTimeline;
    delete (newContract as any)._currentBilling;
    delete (newContract as any)._billingDate;

    if (needTimeline && currentBilling) {
      (newContract as any)._pendingBilling = {};
      (newContract as any)._pendingBilling[billingDate] = currentBilling;
      (newContract as any)._billingDate = billingDate;
    }

    saveContracts([...contracts, newContract]);
    setShowModal(false);
    setCurrentContract({});
    setExtractedData({});

    if (needTimeline) {
      setAlertMessage({
        type: 'success',
        message: `合同添加成功！请点击"月度计价"按钮生成时间轴，计价金额将自动填充到${billingDate}`
      });
    } else {
      setAlertMessage({ type: 'success', message: '合同添加成功' });
    }
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // 编辑合同
  const handleEditContract = (contract: ContractData) => {
    setCurrentContract(contract);
    setShowModal(true);
  };

  // 更新合同
  const handleUpdateContract = () => {
    if (!currentContract.id) return;

    const { _pendingBilling, _billingDate, _needTimeline, _currentBilling, ...cleanData } = currentContract as any;

    const updatedContracts = contracts.map(c =>
      c.id === currentContract.id ? { ...c, ...cleanData } as ContractData : c
    );
    saveContracts(updatedContracts);
    setShowModal(false);
    setCurrentContract({});
    setExtractedData({});
    setAlertMessage({
      type: 'success',
      message: `合同更新成功！分类已更改为：${categoryNames[cleanData.category || 'labor']}`
    });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // 删除合同
  const handleDeleteContract = (id: string) => {
    if (confirm('确定要删除这条合同记录吗？')) {
      const updatedContracts = contracts.filter(c => c.id !== id);
      saveContracts(updatedContracts);
      setAlertMessage({ type: 'success', message: '合同删除成功' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentContract({});
    setExtractedData({});
  };

  // 导出Excel
  const handleExportExcel = () => {
    const headers = [
      '合同名称',
      '供应单位',
      '合同编号',
      '合同金额',
      '招标方式',
      '签订时间',
      '支付比例',
      '税率(%)',
      '累计计价(不含税)',
      '累计计价(含税)',
      '累计付款(不含税)',
      '累计付款(含税)',
      '创建时间'
    ];

    const rows = contracts.map(c => [
      c.contractName,
      c.supplier,
      c.contractNumber,
      c.contractAmount,
      c.bidMethod,
      c.signDate,
      c.paymentRatio,
      c.taxRate,
      c.totalBillingTaxExcluded,
      c.totalBillingTaxIncluded,
      c.totalPaymentTaxExcluded,
      c.totalPaymentTaxIncluded,
      c.createdAt
    ]);

    let csvContent = '\uFEFF';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `合同台账_${new Date().toLocaleDateString('zh-CN')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAlertMessage({ type: 'success', message: '导出成功' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // 查看月度计价
  const handleViewMonthlyBilling = (contractId: string) => {
    router.push(`/contract/${contractId}`);
  };

  // 项目管理
  const handleCreateProject = () => {
    if (!currentProjectForm.name) {
      setAlertMessage({ type: 'danger', message: '请填写项目名称' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: currentProjectForm.name || '',
      description: currentProjectForm.description || '',
      createdAt: new Date().toLocaleString('zh-CN')
    };

    saveProjects([...projects, newProject]);
    saveCurrentProject(newProject);
    setShowProjectModal(false);
    setCurrentProjectForm({});
    setAlertMessage({ type: 'success', message: '项目创建成功' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleSelectProject = (project: Project) => {
    saveCurrentProject(project);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('确定要删除该项目吗？该项目的所有合同也会被删除。')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      const updatedContracts = contracts.filter(c => c.projectId !== projectId);
      
      saveProjects(updatedProjects);
      saveContracts(updatedContracts);
      
      if (currentProject?.id === projectId) {
        saveCurrentProject(null);
      }
      
      setAlertMessage({ type: 'success', message: '项目删除成功' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // 模板管理
  const handleCreateTemplate = () => {
    if (!currentTemplateForm.name || !currentTemplateForm.supplier) {
      setAlertMessage({ type: 'danger', message: '请填写模板名称和供应单位' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: currentTemplateForm.name || '',
      contractName: currentTemplateForm.contractName || '',
      supplier: currentTemplateForm.supplier || '',
      contractNumber: currentTemplateForm.contractNumber || '',
      contractAmount: currentTemplateForm.contractAmount || '',
      bidMethod: currentTemplateForm.bidMethod || '',
      signDate: currentTemplateForm.signDate || '',
      taxRate: currentTemplateForm.taxRate || 9,
      category: currentTemplateForm.category || 'labor',
      createdAt: new Date().toLocaleString('zh-CN')
    };

    saveTemplates([...templates, newTemplate]);
    setShowTemplateModal(false);
    setCurrentTemplateForm({});
    setAlertMessage({ type: 'success', message: '模板创建成功' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('确定要删除该模板吗？')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
      setAlertMessage({ type: 'success', message: '模板删除成功' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleImportTemplate = (template: Template) => {
    if (!currentProject) {
      setAlertMessage({ type: 'warning', message: '请先选择项目' });
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    const newContract: Partial<ContractData> = {
      contractName: template.contractName || template.name,
      supplier: template.supplier,
      contractNumber: template.contractNumber,
      contractAmount: template.contractAmount,
      bidMethod: template.bidMethod,
      signDate: template.signDate,
      taxRate: template.taxRate,
      category: template.category,
      projectId: currentProject.id,
      monthlyBilling: {},
      monthlyPaymentTaxIncluded: {},
      totalBillingTaxIncluded: '',
      totalBillingTaxExcluded: '',
      totalPaymentTaxIncluded: '',
      totalPaymentTaxExcluded: '',
      paymentRatio: ''
    };

    setCurrentContract(newContract);
    setShowImportTemplateModal(false);
    setShowModal(true);
    setAlertMessage({ type: 'info', message: '模板已导入，请完善合同信息后保存' });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // 处理拖放
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 输入框拖动处理
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <Container fluid className="min-vh-100 py-4">
      <div className="mb-5">
        <h1 className="fw-bold mb-2">合同台账管理系统</h1>
        <p className="text-muted">智能PDF识别 · 自动信息提取 · 高效台账管理</p>
      </div>

      {alertMessage && (
        <Alert variant={alertMessage.type as any} dismissible onClose={() => setAlertMessage(null)} className="mb-4">
          {alertMessage.message}
        </Alert>
      )}

      {/* 项目选择和管理 */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <Row className="align-items-center g-2">
            <Col md={5} className="d-flex gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="lg">
                  {currentProject ? `📁 ${currentProject.name}` : '📁 选择项目'}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ minWidth: '300px' }}>
                  {projects.length === 0 && (
                    <Dropdown.Item disabled>暂无项目</Dropdown.Item>
                  )}
                  {projects.map(project => (
                    <Dropdown.Item
                      key={project.id}
                      active={currentProject?.id === project.id}
                      onClick={() => handleSelectProject(project)}
                    >
                      📁 {project.name}
                      {currentProject?.id === project.id && (
                        <span className="ms-2 text-muted">(当前)</span>
                      )}
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Divider />
                  {currentProject && (
                    <Dropdown.Item 
                      onClick={() => {
                        if (confirm('确定要删除当前项目吗？该项目的所有合同也会被删除。')) {
                          handleDeleteProject(currentProject!.id);
                        }
                      }}
                      className="text-danger"
                    >
                      🗑️ 删除当前项目
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={7} className="text-end d-flex gap-2 justify-content-end">
              <Button variant="primary" onClick={() => setShowProjectModal(true)}>
                ➕ 创建新项目
              </Button>
              <Button variant="outline-info" onClick={() => setShowTemplateModal(true)}>
                📋 管理模板
              </Button>
              <Button variant="outline-primary" onClick={() => setShowImportTemplateModal(true)}>
                📥 导入模板
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!currentProject ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-5 text-center">
            <h3 className="mb-3">请先选择或创建项目</h3>
            <p className="text-muted mb-4">选择现有项目或创建新项目以开始管理合同台账</p>
            <Button variant="primary" onClick={() => setShowProjectModal(true)}>
              ➕ 创建新项目
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* 标签页导航 */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-3">
              <nav className="nav nav-pills">
                {categories.map(tab => (
                  <button
                    key={tab}
                    className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {categoryNames[tab]}
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>

          {/* 总览界面 */}
          {activeTab === 'overview' && (() => {
            const stats = getStatistics();
            return (
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <h3 className="text-primary mb-2">{stats.totalContracts}</h3>
                      <p className="text-muted mb-0 small">合同总数</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <h5 className="text-success mb-2">{stats.totalContractAmount.toLocaleString()}</h5>
                      <p className="text-muted mb-0 small">合同总额</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <h5 className="text-info mb-2">{stats.totalBilling.toLocaleString()}</h5>
                      <p className="text-muted mb-0 small">累计计价</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <h5 className="text-warning mb-2">{stats.totalPayment.toLocaleString()}</h5>
                      <p className="text-muted mb-0 small">累计付款</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            );
          })()}

          {/* 分类统计卡片 */}
          {activeTab === 'overview' && (() => {
            const stats = getStatistics();
            return (
              <Row className="g-4 mb-4">
                {Object.entries(stats.byCategory).map(([key, value]) => (
                  <Col md={3} key={key}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="text-primary mb-3">{categoryNames[key]}</h6>
                        <div className="mb-2">
                          <small className="text-muted">合同数量：</small>
                          <span className="fw-semibold">{value.count}</span>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">合同金额：</small>
                          <span className="fw-semibold">{value.amount.toLocaleString()}</span>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">累计计价：</small>
                          <span className="fw-semibold">{value.billing.toLocaleString()}</span>
                        </div>
                        <div>
                          <small className="text-muted">累计付款：</small>
                          <span className="fw-semibold">{value.payment.toLocaleString()}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            );
          })()}

          {/* 合同列表卡片 */}
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <Row className="align-items-center mb-4">
                <Col>
                  <h5 className="mb-0">{categoryNames[activeTab]}</h5>
                  <small className="text-muted">共 {getFilteredContracts().length} 条记录</small>
                </Col>
                <Col className="text-end">
                  <Button variant="success" className="me-2" onClick={() => setShowUploadModal(true)}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    上传PDF识别
                  </Button>
                  <Button variant="outline-primary" className="me-2" onClick={handleExportExcel}>
                    <i className="bi bi-download me-2"></i>
                    导出Excel
                  </Button>
                  <Button variant="primary" onClick={() => setShowModal(true)} disabled={activeTab === 'overview'}>
                    <i className="bi bi-plus-circle me-2"></i>
                    添加合同
                  </Button>
                </Col>
              </Row>

              {getFilteredContracts().length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-muted mb-3">暂无合同记录</h5>
                  <p className="text-muted">
                    {activeTab === 'overview' ? '请选择分类标签查看或添加合同' : '点击"上传PDF识别"或"添加合同"开始使用'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-3 py-3">合同名称</th>
                        <th className="px-3 py-3">供应单位</th>
                        <th className="px-3 py-3">合同编号</th>
                        <th className="px-3 py-3">合同金额</th>
                        <th className="px-3 py-3">签订时间</th>
                        <th className="px-3 py-3">税率</th>
                        <th className="px-3 py-3">累计计价(不含税)</th>
                        <th className="px-3 py-3">累计计价(含税)</th>
                        <th className="px-3 py-3">累计付款(不含税)</th>
                        <th className="px-3 py-3">累计付款(含税)</th>
                        <th className="px-3 py-3">支付比例</th>
                        <th className="px-3 py-3">计价与付款</th>
                        <th className="px-3 py-3 text-end">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredContracts().map((contract) => {
                        const categoryBadge: Record<string, { text: string; bg: string }> = {
                          labor: { text: '劳', bg: 'bg-primary' },
                          professional: { text: '专', bg: 'bg-success' },
                          technology: { text: '技', bg: 'bg-info' },
                          material: { text: '物', bg: 'bg-warning' }
                        };
                        const badge = categoryBadge[contract.category] || categoryBadge.labor;

                        return (
                          <tr key={contract.id} className="border-bottom">
                            <td className="px-3 py-2 fw-semibold small">
                              {contract.contractName}
                              <span className={`badge ${badge.bg} text-white ms-2`}>{badge.text}</span>
                            </td>
                            <td className="px-3 py-2 small">{contract.supplier}</td>
                            <td className="px-3 py-2 text-muted small">{contract.contractNumber || '-'}</td>
                            <td className="px-3 py-2 small">{contract.contractAmount || '-'}</td>
                            <td className="px-3 py-2 small">{contract.signDate || '-'}</td>
                            <td className="px-3 py-2 small">
                              <span className="badge bg-light text-dark">{contract.taxRate}%</span>
                            </td>
                            <td className="px-3 py-2 small fw-semibold text-success">{contract.totalBillingTaxExcluded || '-'}</td>
                            <td className="px-3 py-2 small fw-semibold text-primary">{contract.totalBillingTaxIncluded || '-'}</td>
                            <td className="px-3 py-2 small">{contract.totalPaymentTaxExcluded || '-'}</td>
                            <td className="px-3 py-2 small fw-semibold text-info">{contract.totalPaymentTaxIncluded || '-'}</td>
                            <td className="px-3 py-2 small">
                              <span className="badge bg-warning text-dark">{contract.paymentRatio || '-'}</span>
                            </td>
                            <td className="px-3 py-2 small">
                              <Button
                                variant="outline-info"
                                size="sm"
                                className="btn-sm"
                                onClick={() => handleViewMonthlyBilling(contract.id)}
                              >
                                查看/设置
                              </Button>
                            </td>
                            <td className="px-3 py-2 text-end">
                              <Button
                                variant="light"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditContract(contract)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="text-danger"
                                onClick={() => handleDeleteContract(contract.id)}
                              >
                                删除
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* 添加/编辑合同模态框 */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl" scrollable centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{currentContract.id ? '编辑合同' : '添加合同'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <h5 className="mb-3 text-primary">基本信息</h5>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">合同名称 *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.contractName || ''}
                    onChange={(e) => setCurrentContract({ ...currentContract, contractName: e.target.value })}
                    placeholder="请输入合同名称"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">供应单位 *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.supplier || ''}
                    onChange={(e) => setCurrentContract({ ...currentContract, supplier: e.target.value })}
                    placeholder="请输入供应单位"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">合同编号</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.contractNumber || ''}
                    onChange={(e) => setCurrentContract({ ...currentContract, contractNumber: e.target.value })}
                    placeholder="请输入合同编号"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">合同金额</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.contractAmount || ''}
                    onChange={(e) => setCurrentContract({ ...currentContract, contractAmount: e.target.value })}
                    placeholder="请输入合同金额"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">招标方式</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.bidMethod || ''}
                    onChange={(e) => setCurrentContract({ ...currentContract, bidMethod: e.target.value })}
                    placeholder="请输入招标方式"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">签订时间</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentContract.signDate || ''}
                    onChange={(e) => setCurrentContract({ ...currentContract, signDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">税率 (%)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={currentContract.taxRate !== undefined ? currentContract.taxRate : ''}
                      placeholder="请输入税率"
                      onChange={(e) => {
                        const value = e.target.value;
                        const newTaxRate = value === '' ? 0 : parseFloat(value) || 0;
                        setCurrentContract({
                          ...currentContract,
                          taxRate: newTaxRate,
                          totalBillingTaxIncluded: currentContract.totalBillingTaxExcluded
                            ? calculateTaxIncluded(currentContract.totalBillingTaxExcluded, newTaxRate)
                            : currentContract.totalBillingTaxIncluded,
                          totalPaymentTaxIncluded: currentContract.totalPaymentTaxExcluded
                            ? calculateTaxIncluded(currentContract.totalPaymentTaxExcluded, newTaxRate)
                            : currentContract.totalPaymentTaxIncluded
                        });
                      }}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setCurrentContract({
                          ...currentContract,
                          taxRate: 9,
                          totalBillingTaxIncluded: currentContract.totalBillingTaxExcluded
                            ? calculateTaxIncluded(currentContract.totalBillingTaxExcluded, 9)
                            : currentContract.totalBillingTaxIncluded,
                          totalPaymentTaxIncluded: currentContract.totalPaymentTaxExcluded
                            ? calculateTaxIncluded(currentContract.totalPaymentTaxExcluded, 9)
                            : currentContract.totalPaymentTaxIncluded
                        });
                      }}
                    >
                      9%
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setCurrentContract({
                          ...currentContract,
                          taxRate: 13,
                          totalBillingTaxIncluded: currentContract.totalBillingTaxExcluded
                            ? calculateTaxIncluded(currentContract.totalBillingTaxExcluded, 13)
                            : currentContract.totalBillingTaxIncluded,
                          totalPaymentTaxIncluded: currentContract.totalPaymentTaxExcluded
                            ? calculateTaxIncluded(currentContract.totalPaymentTaxExcluded, 13)
                            : currentContract.totalPaymentTaxIncluded
                        });
                      }}
                    >
                      13%
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted">可直接输入或点击常用税率</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">合同分类 *</Form.Label>
                  <Form.Select
                    value={currentContract.category || 'labor'}
                    onChange={(e) => setCurrentContract({ ...currentContract, category: e.target.value })}
                  >
                    <option value="labor">劳务分包</option>
                    <option value="professional">专业分包</option>
                    <option value="technology">技术服务</option>
                    <option value="material">物资租赁</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">支付比例</Form.Label>
                  <Form.Control
                    type="text"
                    value={calculatePaymentRatio(currentContract.totalPaymentTaxIncluded || '', currentContract.contractAmount || '')}
                    readOnly
                    placeholder="自动计算"
                  />
                  <Form.Text className="text-muted">自动计算：累计付款(含税) / 合同金额 × 100%</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3 text-primary">计价信息</h5>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">累计计价 (不含税)</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.totalBillingTaxExcluded || ''}
                    onChange={(e) => setCurrentContract({
                      ...currentContract,
                      totalBillingTaxExcluded: e.target.value,
                      totalBillingTaxIncluded: calculateTaxIncluded(e.target.value, currentContract.taxRate || 9)
                    })}
                    placeholder="请输入不含税金额，含税金额将自动计算"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">累计计价 (含税)</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.totalBillingTaxIncluded || ''}
                    readOnly
                    placeholder="自动计算"
                  />
                  <Form.Text className="text-muted">自动计算：不含税金额 × (1 + 税率)</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3 text-primary">付款信息</h5>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">累计付款 (不含税)</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.totalPaymentTaxExcluded || ''}
                    onChange={(e) => setCurrentContract({
                      ...currentContract,
                      totalPaymentTaxExcluded: e.target.value,
                      totalPaymentTaxIncluded: calculateTaxIncluded(e.target.value, currentContract.taxRate || 9),
                      paymentRatio: calculatePaymentRatio(calculateTaxIncluded(e.target.value, currentContract.taxRate || 9), currentContract.contractAmount || '')
                    })}
                    placeholder="请输入不含税金额，含税金额将自动计算"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">累计付款 (含税)</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentContract.totalPaymentTaxIncluded || ''}
                    readOnly
                    placeholder="自动计算"
                  />
                  <Form.Text className="text-muted">自动计算：不含税金额 × (1 + 税率)</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            取消
          </Button>
          <Button variant="primary" onClick={currentContract.id ? handleUpdateContract : handleAddContract}>
            {currentContract.id ? '更新' : '添加'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 上传PDF模态框 */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>上传PDF识别计价信息</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <div className="loading-spinner mx-auto mb-3"></div>
              <p className="text-muted">正在解析PDF文件...</p>
            </div>
          ) : (
            <div
              className={`upload-area ${dragActive ? 'dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDragLeave}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mb-3">
                <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#667eea' }}></i>
              </div>
              <h5 className="mb-3">拖拽PDF文件到此处</h5>
              <p className="text-muted mb-3">或者</p>
              <Button 
                as="label"
                variant="primary"
              >
                选择文件
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleMultipleFileUpload(e.target.files);
                    }
                  }}
                />
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* 创建项目模态框 */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>创建新项目</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>项目名称 *</Form.Label>
              <Form.Control
                type="text"
                value={currentProjectForm.name || ''}
                onChange={(e) => setCurrentProjectForm({ ...currentProjectForm, name: e.target.value })}
                placeholder="例如：北蔡楔形绿地项目"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>项目描述</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentProjectForm.description || ''}
                onChange={(e) => setCurrentProjectForm({ ...currentProjectForm, description: e.target.value })}
                placeholder="请输入项目描述（可选）"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleCreateProject}>
            创建
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 模板管理模态框 */}
      <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>模板管理</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <Button variant="primary" onClick={() => setCurrentTemplateForm({})}>
              <i className="bi bi-plus-circle me-2"></i>
              创建新模板
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted mb-3">暂无模板</h5>
              <p className="text-muted">点击"创建新模板"开始</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead className="bg-light">
                  <tr>
                    <th>模板名称</th>
                    <th>合同名称</th>
                    <th>供应单位</th>
                    <th>合同编号</th>
                    <th>合同金额</th>
                    <th>税率</th>
                    <th>分类</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(template => (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{template.contractName || '-'}</td>
                      <td>{template.supplier}</td>
                      <td>{template.contractNumber || '-'}</td>
                      <td>{template.contractAmount || '-'}</td>
                      <td>{template.taxRate}%</td>
                      <td>{categoryNames[template.category] || '-'}</td>
                      <td>
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* 创建模板模态框 */}
      <Modal show={showTemplateModal && !currentTemplateForm.id} onHide={() => {
        setShowTemplateModal(false);
        setCurrentTemplateForm({});
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>创建新模板</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>模板名称 *</Form.Label>
              <Form.Control
                type="text"
                value={currentTemplateForm.name || ''}
                onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, name: e.target.value })}
                placeholder="例如：标准分包合同模板"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>合同名称</Form.Label>
              <Form.Control
                type="text"
                value={currentTemplateForm.contractName || ''}
                onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, contractName: e.target.value })}
                placeholder="默认模板名称"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>供应单位 *</Form.Label>
              <Form.Control
                type="text"
                value={currentTemplateForm.supplier || ''}
                onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, supplier: e.target.value })}
                placeholder="供应单位名称"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>合同编号</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentTemplateForm.contractNumber || ''}
                    onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, contractNumber: e.target.value })}
                    placeholder="合同编号格式"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>合同金额</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentTemplateForm.contractAmount || ''}
                    onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, contractAmount: e.target.value })}
                    placeholder="合同金额"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>招标方式</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentTemplateForm.bidMethod || ''}
                    onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, bidMethod: e.target.value })}
                    placeholder="招标方式"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>税率 (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={currentTemplateForm.taxRate || 9}
                    onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, taxRate: parseFloat(e.target.value) || 9 })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>签订时间</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentTemplateForm.signDate || ''}
                    onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, signDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>分类</Form.Label>
                  <Form.Select
                    value={currentTemplateForm.category || 'labor'}
                    onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, category: e.target.value })}
                  >
                    <option value="labor">劳务分包</option>
                    <option value="professional">专业分包</option>
                    <option value="technology">技术服务</option>
                    <option value="material">物资租赁</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowTemplateModal(false);
            setCurrentTemplateForm({});
          }}>
            取消
          </Button>
          <Button variant="primary" onClick={handleCreateTemplate}>
            创建模板
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 导入模板模态框 */}
      <Modal show={showImportTemplateModal} onHide={() => setShowImportTemplateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>选择模板导入</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {templates.length === 0 ? (
            <div className="text-center py-5">
              <h5 className="text-muted mb-3">暂无可用模板</h5>
              <p className="text-muted mb-3">请先创建模板</p>
              <Button variant="primary" onClick={() => {
                setShowImportTemplateModal(false);
                setShowTemplateModal(true);
              }}>
                创建模板
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead className="bg-light">
                  <tr>
                    <th>模板名称</th>
                    <th>供应单位</th>
                    <th>合同编号</th>
                    <th>税率</th>
                    <th>分类</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(template => (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{template.supplier}</td>
                      <td>{template.contractNumber || '-'}</td>
                      <td>{template.taxRate}%</td>
                      <td>{categoryNames[template.category] || '-'}</td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleImportTemplate(template)}
                        >
                          导入
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
