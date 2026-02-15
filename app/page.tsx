'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, InputGroup, Dropdown } from 'react-bootstrap';
import { projectsApi, contractsApi, templatesApi, setToken, getUser, clearToken } from '@/lib/api';
import * as XLSX from 'xlsx';

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
  const pathname = usePathname();
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  const categories = ['overview', 'labor', 'professional', 'technology', 'material'];
  const categoryNames: Record<string, string> = {
    overview: '总览',
    labor: '劳务分包',
    professional: '专业分包',
    technology: '技术服务',
    material: '物资租赁'
  };

  // 初始化时恢复保存的标签页
  useEffect(() => {
    const savedTab = localStorage.getItem('savedTab');
    if (savedTab && savedTab !== 'overview') {
      setActiveTab(savedTab);
    }
  }, []);

  // 动态加载PDF.js
  const loadPDFLib = async () => {
    if (!pdfjsLib) {
      const module = await import('pdfjs-dist');
      pdfjsLib = module;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    return pdfjsLib;
  };

  // 从API加载数据
  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);

    if (!user) {
      router.push('/login');
      return;
    }

    // 检查是否已选择项目
    const savedProject = localStorage.getItem('currentProject');
    if (!savedProject) {
      router.push('/select-project');
      return;
    }

    setCurrentProject(JSON.parse(savedProject));
    loadData();
  }, []);

  // 路由变化或组件加载时重新加载数据
  useEffect(() => {
    // 如果返回到主页，恢复之前保存的标签页
    if (pathname === '/') {
      const savedTab = localStorage.getItem('savedTab');
      if (savedTab && savedTab !== 'overview') {
        setActiveTab(savedTab);
        localStorage.removeItem('savedTab'); // 恢复后清除
      }
    }
    
    if (currentProject) {
      loadContracts(currentProject.id);
    }
  }, [pathname, currentProject]);

  const loadData = async () => {
    try {
      const [projectsRes, templatesRes] = await Promise.all([
        projectsApi.list(),
        templatesApi.list(),
      ]);

      setProjects(projectsRes.projects.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description || '',
        createdAt: p.created_at,
      })));

      setTemplates(templatesRes.templates.map((t: any) => ({
        id: t.id.toString(),
        name: t.name,
        contractName: t.contract_name || '',
        supplier: t.supplier || '',
        contractNumber: t.contract_number || '',
        contractAmount: t.contract_amount || '',
        bidMethod: t.bid_method || '',
        signDate: t.sign_date || '',
        taxRate: t.tax_rate || 9,
        category: t.category || 'labor',
        createdAt: t.created_at,
      })));

      // 如果有当前项目，加载该项目的合同
      if (currentProject) {
        await loadContracts(currentProject.id);
      }
    } catch (error: any) {
      console.error('加载数据失败:', error);
      if (error.message?.includes('未授权') || error.message?.includes('401')) {
        clearToken();
        router.push('/login');
      } else {
        setAlertMessage({ type: 'danger', message: '加载数据失败' });
      }
    }
  };

  const loadContracts = async (projectId: string) => {
    try {
      console.log('加载合同 - 项目ID:', projectId);
      const response = await contractsApi.list(projectId);
      console.log('加载合同 - API返回的合同数量:', response.contracts.length);
      console.log('加载合同 - 合同列表:', JSON.stringify(response.contracts.map(c => ({ id: c.id, name: c.contract_name, project_id: c.project_id })), null, 2));
      
      setContracts(response.contracts.map((c: any) => ({
        id: c.id.toString(),
        contractName: c.contract_name,
        supplier: c.supplier,
        contractNumber: c.contract_number || '',
        contractAmount: c.contract_amount || '',
        bidMethod: c.bid_method || '',
        signDate: c.sign_date || '',
        paymentRatio: c.payment_ratio || '',
        taxRate: c.tax_rate || 9,
        totalBillingTaxIncluded: c.total_billing_tax_included || '',
        totalBillingTaxExcluded: c.total_billing_tax_excluded || '',
        totalPaymentTaxIncluded: c.total_payment_tax_included || '',
        totalPaymentTaxExcluded: c.total_payment_tax_excluded || '',
        category: c.category || 'labor',
        projectId: c.project_id.toString(),
        monthlyBilling: c.monthlyBilling || {},
        monthlyPaymentTaxIncluded: c.monthlyPaymentTaxIncluded || {},
        createdAt: c.created_at,
      })));
    } catch (error) {
      console.error('加载合同失败:', error);
      setAlertMessage({ type: 'danger', message: '加载合同失败' });
    }
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('currentProject');
    router.push('/login');
  };

const saveCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('currentProject', JSON.stringify(project));
      localStorage.setItem('currentProjectId', project.id);
    } else {
      localStorage.removeItem('currentProject');
      localStorage.removeItem('currentProjectId');
    }
  };

  // 过滤合同（基于当前项目和分类）
  const getFilteredContracts = () => {
    let filtered = contracts;

    console.log('过滤合同 - 当前项目:', currentProject);
    console.log('过滤合同 - 合同列表第一个:', contracts[0]);
    console.log('过滤合同 - 合同列表第一个的projectId:', contracts[0]?.projectId);
    console.log('过滤合同 - 当前项目ID类型:', typeof currentProject?.id);
    console.log('过滤合同 - 合同projectId类型:', typeof contracts[0]?.projectId);

    // 按项目过滤
    if (currentProject) {
      console.log('过滤前比较:');
      console.log('  currentProject.id:', currentProject.id, '类型:', typeof currentProject.id);
      console.log('  contracts[0].projectId:', contracts[0]?.projectId, '类型:', typeof contracts[0]?.projectId);
      
      filtered = filtered.filter(c => c.projectId == currentProject.id);
      console.log('过滤合同 - 按项目过滤后数量:', filtered.length);
    }

    // 按分类过滤
    if (activeTab !== 'overview') {
      filtered = filtered.filter(c => c.category === activeTab);
    }

    console.log('过滤合同 - activeTab:', activeTab);
    console.log('过滤合同 - 过滤前数量:', contracts.length);
    console.log('过滤合同 - 过滤后数量:', filtered.length);

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
      const amount = parseFloat((c.contractAmount || '0').replace(/,/g, '')) || 0;
      const billing = parseFloat((c.totalBillingTaxIncluded || '0').replace(/,/g, '')) || 0;
      const payment = parseFloat((c.totalPaymentTaxIncluded || '0').replace(/,/g, '')) || 0;

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
      return;
    }

    if (!currentProject) {
      setAlertMessage({ type: 'danger', message: '请先选择项目' });
      return;
    }

    setIsLoading(true);
    try {
      const text = await readPDF(file);
      const extracted = extractPricingInfo(text);
      setExtractedData(extracted);

      if (!extracted.supplier) {
        setAlertMessage({ type: 'warning', message: '无法从PDF中识别分包方信息，请手动填写' });
        return;
      }

      // 查找现有合同
      const existingContract = contracts.find(c =>
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
        }

        // 更新到服务器
        await contractsApi.update(existingContract.id, updatedContract);

        // 更新本地状态
        setContracts(contracts.map(c => c.id === existingContract.id ? updatedContract : c));

        setAlertMessage({ type: 'success', message: `已更新 ${extracted.supplier} 的计价信息` });
      } else {
        const newTaxExcluded = extracted.totalBillingTaxExcluded || '';
        const billingDate = extracted.billingDate || new Date().toISOString().slice(0, 7);

        const newContract: ContractData = {
          id: '', // 服务器会生成ID
          contractName: extracted.supplier || file.name.replace('.pdf', ''),
          supplier: extracted.supplier || '',
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
          createdAt: new Date().toLocaleString('zh-CN'),
        };

        if (extracted.currentBillingTaxExcluded) {
          newContract.monthlyBilling = {
            [billingDate]: extracted.currentBillingTaxExcluded
          };
        }

        // 保存到服务器
        const response = await contractsApi.create(newContract);
        const savedContract = {
          ...newContract,
          id: response.contract.id.toString(),
        };

        setContracts([...contracts, savedContract]);
        setAlertMessage({ type: 'success', message: `已创建 ${extracted.supplier} 的合同档案` });
      }
    } catch (error) {
      console.error('处理文件失败:', error);
      setAlertMessage({ type: 'danger', message: '处理文件失败，请检查PDF格式' });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理多文件上传
  const handleMultipleFileUpload = async (files: FileList) => {
    if (!currentProject) {
      setAlertMessage({ type: 'danger', message: '请先选择项目' });
      return;
    }

    let updatedContracts = [...contracts];

    for (const file of files) {
      if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
        continue;
      }

      try {
        const text = await readPDF(file);
        const extracted = extractPricingInfo(text);

        if (!extracted.supplier) {
          continue;
        }

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
          }

          updatedContracts = updatedContracts.map(c =>
            c.id === existingContract.id ? updatedContract : c
          );

          // 更新到服务器
          await contractsApi.update(existingContract.id, updatedContract);
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
            id: '',
            contractName: extracted.supplier || file.name.replace('.pdf', ''),
            supplier: extracted.supplier || '',
            contractNumber: extracted.contractNumber || '',
            contractAmount: '',
            bidMethod: '',
            signDate: '',
            paymentRatio: '',
            taxRate: taxRate,
            totalBillingTaxIncluded: finalTaxExcluded && finalTaxExcluded !== ''
              ? calculateTaxIncluded(finalTaxExcluded, taxRate)
              : '',
            totalBillingTaxExcluded: finalTaxExcluded || '',
            totalPaymentTaxIncluded: '',
            totalPaymentTaxExcluded: '',
            category: activeTab === 'overview' ? 'labor' : activeTab,
            projectId: currentProject.id,
            monthlyBilling: {},
            monthlyPaymentTaxIncluded: {},
            createdAt: new Date().toLocaleString('zh-CN'),
          };

          if (extracted.currentBillingTaxExcluded) {
            newContract.monthlyBilling = {
              [billingDate]: extracted.currentBillingTaxExcluded
            };
          }

          // 保存到服务器
          const response = await contractsApi.create(newContract);
          const savedContract = {
            ...newContract,
            id: response.contract.id.toString(),
          };

          console.log('保存的新合同:', savedContract);

          updatedContracts = [...updatedContracts, savedContract];
        }
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error);
      }
    }

    setContracts(updatedContracts);
    console.log('更新后的合同列表:', updatedContracts);
    console.log('更新后的合同数量:', updatedContracts.length);
    setAlertMessage({ type: 'success', message: `已处理 ${files.length} 个文件` });
    setShowUploadModal(false);
  };

  // 处理拖拽
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
      handleMultipleFileUpload(e.dataTransfer.files);
    }
  };

  // 处理合同保存
  const handleSaveContract = async () => {
    if (!currentContract.contractName || !currentContract.supplier) {
      setAlertMessage({ type: 'danger', message: '请填写合同名称和供应单位' });
      return;
    }

    if (!currentProject) {
      setAlertMessage({ type: 'danger', message: '请先选择项目' });
      return;
    }

    try {
      const taxRate = currentContract.taxRate || 9;
      
      // 重新计算累计计价的含税金额（如果不含税金额存在）
      let totalBillingTaxIncluded = currentContract.totalBillingTaxIncluded;
      if (currentContract.totalBillingTaxExcluded) {
        const taxExcluded = parseFloat(currentContract.totalBillingTaxExcluded.replace(/,/g, '')) || 0;
        if (taxExcluded > 0) {
          totalBillingTaxIncluded = (taxExcluded * (1 + taxRate / 100)).toFixed(2);
        }
      }

      // 重新计算累计付款的不含税金额（如果含税金额存在）
      let totalPaymentTaxExcluded = currentContract.totalPaymentTaxExcluded;
      if (currentContract.totalPaymentTaxIncluded) {
        const paymentIncluded = parseFloat(currentContract.totalPaymentTaxIncluded.replace(/,/g, '')) || 0;
        if (paymentIncluded > 0) {
          totalPaymentTaxExcluded = (paymentIncluded / (1 + taxRate / 100)).toFixed(2);
        }
      }

      const contractData = {
        ...currentContract,
        projectId: currentProject.id,
        taxRate: taxRate,
        totalBillingTaxIncluded: totalBillingTaxIncluded || '',
        totalPaymentTaxExcluded: totalPaymentTaxExcluded || '',
        category: currentContract.category || (activeTab === 'overview' ? 'labor' : activeTab),
      };

      if (currentContract.id) {
        await contractsApi.update(currentContract.id, contractData);
        setContracts(contracts.map(c => c.id === currentContract.id ? { ...contractData, id: currentContract.id } : c));
        setAlertMessage({ type: 'success', message: '合同已更新' });
      } else {
        const response = await contractsApi.create(contractData);
        const newContract = { ...contractData, id: response.contract.id.toString() };
        setContracts([...contracts, newContract]);
        setAlertMessage({ type: 'success', message: '合同已创建' });
      }

      setShowModal(false);
      setCurrentContract({});
    } catch (error) {
      console.error('保存合同失败:', error);
      setAlertMessage({ type: 'danger', message: '保存合同失败' });
    }
  };

  // 处理项目保存
  const handleSaveProject = async () => {
    if (!currentProjectForm.name) {
      setAlertMessage({ type: 'danger', message: '请填写项目名称' });
      return;
    }

    try {
      const response = await projectsApi.create({
        name: currentProjectForm.name,
        description: currentProjectForm.description,
      });

      const newProject = {
        id: response.project.id.toString(),
        name: response.project.name,
        description: response.project.description || '',
        createdAt: new Date().toLocaleString('zh-CN'),
      };

      setProjects([...projects, newProject]);
      saveCurrentProject(newProject);
      setShowProjectModal(false);
      setCurrentProjectForm({});
      setAlertMessage({ type: 'success', message: '项目已创建' });
    } catch (error) {
      console.error('创建项目失败:', error);
      setAlertMessage({ type: 'danger', message: '创建项目失败' });
    }
  };

  // 处理项目删除
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除此项目及其所有合同数据吗？')) {
      return;
    }

    try {
      await projectsApi.delete(projectId);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);

      if (currentProject?.id === projectId) {
        saveCurrentProject(null);
      }

      setAlertMessage({ type: 'success', message: '项目已删除' });
    } catch (error) {
      console.error('删除项目失败:', error);
      setAlertMessage({ type: 'danger', message: '删除项目失败' });
    }
  };

  // 处理模板保存
  const handleSaveTemplate = async () => {
    if (!currentTemplateForm.name) {
      setAlertMessage({ type: 'danger', message: '请填写模板名称' });
      return;
    }

    try {
      const response = await templatesApi.create(currentTemplateForm);
      const newTemplate = {
        ...currentTemplateForm,
        id: response.template.id.toString(),
        createdAt: new Date().toLocaleString('zh-CN'),
      };

      setTemplates([...templates, newTemplate]);
      setShowTemplateModal(false);
      setCurrentTemplateForm({});
      setAlertMessage({ type: 'success', message: '模板已保存' });
    } catch (error) {
      console.error('保存模板失败:', error);
      setAlertMessage({ type: 'danger', message: '保存模板失败' });
    }
  };

  // 处理模板删除
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除此模板吗？')) {
      return;
    }

    try {
      await templatesApi.delete(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
      setAlertMessage({ type: 'success', message: '模板已删除' });
    } catch (error) {
      console.error('删除模板失败:', error);
      setAlertMessage({ type: 'danger', message: '删除模板失败' });
    }
  };

  // 从模板导入
  const handleImportFromTemplate = (template: Template) => {
    setCurrentContract({
      contractName: template.contractName,
      supplier: template.supplier,
      contractNumber: template.contractNumber,
      contractAmount: template.contractAmount,
      bidMethod: template.bidMethod,
      signDate: template.signDate,
      taxRate: template.taxRate,
      category: template.category,
    });

    setShowImportTemplateModal(false);
    setShowModal(true);
  };

  // 处理合同删除
  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('确定要删除此合同吗？')) {
      return;
    }

    try {
      await contractsApi.delete(contractId);
      setContracts(contracts.filter(c => c.id !== contractId));
      setAlertMessage({ type: 'success', message: '合同已删除' });
    } catch (error) {
      console.error('删除合同失败:', error);
      setAlertMessage({ type: 'danger', message: '删除合同失败' });
    }
  };

  // 导出 Excel
  const handleExportExcel = () => {
    const filteredContracts = getFilteredContracts();

    if (filteredContracts.length === 0) {
      setAlertMessage({ type: 'warning', message: '暂无数据可导出' });
      return;
    }

    // 准备表头和数据
    const headers = [
      '合同名称',
      '供应单位',
      '合同编号',
      '合同签订时间',
      '合同金额',
      '累计计价(含税)',
      '累计计价(不含税)',
      '累计付款(含税)',
      '累计付款(不含税)',
      '支付比例',
      '分类',
      '创建时间',
    ];

    // 准备数据行
    const rows = filteredContracts.map(contract => [
      contract.contractName,
      contract.supplier,
      contract.contractNumber || '',
      contract.signDate || '',
      contract.contractAmount || '',
      contract.totalBillingTaxIncluded || '',
      contract.totalBillingTaxExcluded || '',
      contract.totalPaymentTaxIncluded || '',
      contract.totalPaymentTaxExcluded || '',
      contract.paymentRatio ? `${contract.paymentRatio}%` : '',
      categoryNames[contract.category] || contract.category,
      contract.createdAt,
    ]);

    // 合并表头和数据
    const exportData = [headers, ...rows];

    // 创建工作簿
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '合同列表');

    // 设置列宽
    const colWidths = [
      { wch: 30 }, // 合同名称
      { wch: 20 }, // 供应单位
      { wch: 20 }, // 合同编号
      { wch: 15 }, // 合同签订时间
      { wch: 15 }, // 合同金额
      { wch: 15 }, // 累计计价(含税)
      { wch: 15 }, // 累计计价(不含税)
      { wch: 15 }, // 累计付款(含税)
      { wch: 15 }, // 累计付款(不含税)
      { wch: 10 }, // 支付比例
      { wch: 10 }, // 分类
      { wch: 20 }, // 创建时间
    ];
    ws['!cols'] = colWidths;

    // 生成文件名
    const fileName = `合同台账_${categoryNames[activeTab]}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // 下载文件
    XLSX.writeFile(wb, fileName);

    setAlertMessage({ type: 'success', message: '导出成功' });
  };

  const stats = getStatistics();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0',
    }}>
      <Container fluid="xl">
        {/* 顶部导航栏 */}
        <Card className="mb-4" style={{
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <h4 className="mb-0">📋 合同台账管理系统</h4>
                <small className="text-muted">欢迎, {currentUser?.username || '用户'}</small>
              </Col>
              <Col md={6} className="text-end">
                <span className="me-3 text-muted">
                  当前项目: <strong>{currentProject?.name || '未选择'}</strong>
                </span>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('currentProject');
                    router.push('/select-project');
                  }}
                  className="me-2"
                >
                  🔄 切换项目
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLogout}
                  style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    border: 'none',
                  }}
                >
                  退出登录
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* 分类标签 */}
        <Row className="mb-4 g-2">
          <Col>
            {categories.map(category => (
              <Button
                key={category}
                variant={activeTab === category ? 'primary' : 'outline-primary'}
                size="sm"
                className="me-2 mb-2 px-4"
                onClick={() => setActiveTab(category)}
                style={{
                  background: activeTab === category
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'white',
                  border: activeTab === category ? 'none' : '2px solid #667eea',
                  color: activeTab === category ? 'white' : '#667eea',
                  fontWeight: activeTab === category ? '600' : '400',
                }}
              >
                {categoryNames[category]}
              </Button>
            ))}
          </Col>
        </Row>

        {/* 总览统计卡片 */}
        {activeTab === 'overview' && (
          <Card style={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <Card.Body>
              {/* 顶部总体统计 */}
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <div className="text-center p-3" style={{
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '10px',
                  }}>
                    <h3 className="mb-2">{stats.totalContracts}</h3>
                    <p className="text-muted mb-0">合同总数</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3" style={{
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    borderRadius: '10px',
                  }}>
                    <h3 className="mb-2">¥{stats.totalContractAmount.toLocaleString()}</h3>
                    <p className="text-muted mb-0">合同总金额</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3" style={{
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    borderRadius: '10px',
                  }}>
                    <h3 className="mb-2">¥{stats.totalBilling.toLocaleString()}</h3>
                    <p className="text-muted mb-0">累计计价</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3" style={{
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    borderRadius: '10px',
                  }}>
                    <h3 className="mb-2">¥{stats.totalPayment.toLocaleString()}</h3>
                    <p className="text-muted mb-0">累计付款</p>
                  </div>
                </Col>
              </Row>
              
              {/* 分类统计 - 块状卡片 */}
              <Row className="g-4">
                {Object.entries(stats.byCategory).map(([key, value]) => (
                  <Col md={3} key={key}>
                    <div className="p-4 h-100" style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '10px',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                    }}>
                      <h6 className="text-primary mb-3">{categoryNames[key]}</h6>
                      <div className="mb-2">
                        <small className="text-muted">合同数量：</small>
                        <span className="fw-semibold">{value.count}</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">合同金额：</small>
                        <span className="fw-semibold">¥{value.amount.toLocaleString()}</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">累计计价：</small>
                        <span className="fw-semibold">¥{value.billing.toLocaleString()}</span>
                      </div>
                      <div>
                        <small className="text-muted">累计付款：</small>
                        <span className="fw-semibold">¥{value.payment.toLocaleString()}</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* 合同列表 */}
        <Card style={{
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <Card.Body>
            <Row className="align-items-center mb-4">
              <Col>
                <h5 className="mb-0">{categoryNames[activeTab]}</h5>
                <small className="text-muted">共 {getFilteredContracts().length} 条记录</small>
              </Col>
              <Col className="text-end">
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => setShowUploadModal(true)}
                >
                  📤 上传PDF
                </Button>
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => {
                    setCurrentContract({});
                    setShowModal(true);
                  }}
                  disabled={activeTab === 'overview'}
                >
                  ➕ 新建合同
                </Button>
                <Button
                  variant="outline-success"
                  onClick={handleExportExcel}
                  disabled={getFilteredContracts().length === 0}
                >
                  📥 导出Excel
                </Button>
              </Col>
            </Row>

            {getFilteredContracts().length === 0 ? (
              <Alert variant="info">
                暂无合同数据，点击"上传PDF"或"新建合同"开始使用
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle" style={{ fontSize: '14px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px' }}>合同名称</th>
                      <th style={{ padding: '12px 16px' }}>供应单位</th>
                      <th style={{ padding: '12px 16px' }}>合同编号</th>
                      <th style={{ padding: '12px 16px' }}>合同金额</th>
                      <th style={{ padding: '12px 16px' }}>累计计价(含税)</th>
                      <th style={{ padding: '12px 16px' }}>累计付款(含税)</th>
                      <th style={{ padding: '12px 16px' }}>支付比例</th>
                      <th style={{ padding: '12px 16px' }}>计价与付款</th>
                      <th style={{ padding: '12px 16px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredContracts().map(contract => (
                      <tr key={contract.id} style={{ verticalAlign: 'middle' }}>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center">
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              backgroundColor: getCategoryColor(contract.category),
                              color: 'white',
                              marginRight: '8px',
                              flexShrink: 0,
                            }}>
                              {getCategoryBadge(contract.category)}
                            </span>
                            <span className="text-truncate">{contract.contractName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>{contract.supplier}</td>
                        <td style={{ padding: '16px' }}>{contract.contractNumber || '-'}</td>
                        <td style={{ padding: '16px' }}>¥{contract.contractAmount || '-'}</td>
                        <td style={{ padding: '16px' }}>¥{contract.totalBillingTaxIncluded || '-'}</td>
                        <td style={{ padding: '16px' }}>¥{contract.totalPaymentTaxIncluded || '-'}</td>
                        <td style={{ padding: '16px' }}>{contract.paymentRatio || '-'}%</td>
                        <td style={{ padding: '16px' }}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              localStorage.setItem('savedTab', activeTab); // 保存当前标签页到 localStorage
                              router.push(`/contract/${contract.id}`);
                            }}
                          >
                            查看
                          </Button>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setCurrentContract(contract);
                                setShowModal(true);
                              }}
                            >
                              编辑
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* 编辑合同模态框 */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{currentContract.id ? '编辑合同' : '新建合同'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>合同名称 *</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.contractName || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, contractName: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>供应单位 *</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.supplier || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, supplier: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>合同编号</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.contractNumber || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, contractNumber: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>合同金额</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.contractAmount || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, contractAmount: e.target.value })}
                      placeholder="例如: 1,000,000.00"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>招标方式</Form.Label>
                    <Form.Control
                      as="select"
                      value={currentContract.bidMethod || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, bidMethod: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="公开招标">公开招标</option>
                      <option value="邀请招标">邀请招标</option>
                      <option value="竞争性谈判">竞争性谈判</option>
                      <option value="单一来源">单一来源</option>
                      <option value="其他">其他</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>签订时间</Form.Label>
                    <Form.Control
                      type="date"
                      value={currentContract.signDate || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, signDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>税率 (%)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={currentContract.taxRate || 9}
                        onChange={(e) => setCurrentContract({ ...currentContract, taxRate: parseInt(e.target.value) })}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setCurrentContract({ ...currentContract, taxRate: 9 })}
                      >
                        9%
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setCurrentContract({ ...currentContract, taxRate: 13 })}
                      >
                        13%
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>分类</Form.Label>
                    <Form.Control
                      as="select"
                      value={currentContract.category || (activeTab === 'overview' ? 'labor' : activeTab)}
                      onChange={(e) => setCurrentContract({ ...currentContract, category: e.target.value })}
                    >
                      <option value="labor">劳务分包</option>
                      <option value="professional">专业分包</option>
                      <option value="technology">技术服务</option>
                      <option value="material">物资租赁</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>累计计价（不含税）</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.totalBillingTaxExcluded || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCurrentContract({
                          ...currentContract,
                          totalBillingTaxExcluded: value,
                          totalBillingTaxIncluded: calculateTaxIncluded(value, currentContract.taxRate || 9),
                        });
                      }}
                      placeholder="系统自动计算"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>累计计价（含税）</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.totalBillingTaxIncluded || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCurrentContract({
                          ...currentContract,
                          totalBillingTaxIncluded: value,
                          totalBillingTaxExcluded: calculateTaxExcluded(value, currentContract.taxRate || 9),
                        });
                      }}
                      placeholder="系统自动计算"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>累计付款（不含税）</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.totalPaymentTaxExcluded || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCurrentContract({
                          ...currentContract,
                          totalPaymentTaxExcluded: value,
                          totalPaymentTaxIncluded: calculateTaxIncluded(value, currentContract.taxRate || 9),
                          paymentRatio: calculatePaymentRatio(
                            calculateTaxIncluded(value, currentContract.taxRate || 9),
                            currentContract.contractAmount || ''
                          ),
                        });
                      }}
                      placeholder="系统自动计算"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>累计付款（含税）</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentContract.totalPaymentTaxIncluded || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCurrentContract({
                          ...currentContract,
                          totalPaymentTaxIncluded: value,
                          totalPaymentTaxExcluded: calculateTaxExcluded(value, currentContract.taxRate || 9),
                          paymentRatio: calculatePaymentRatio(
                            value,
                            currentContract.contractAmount || ''
                          ),
                        });
                      }}
                      placeholder="系统自动计算"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>支付比例 (%)</Form.Label>
                <Form.Control
                  type="text"
                  value={currentContract.paymentRatio || ''}
                  readOnly
                  placeholder="系统自动计算"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveContract}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              保存
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 上传PDF模态框 */}
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>上传PDF识别</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div
              style={{
                border: '2px dashed #667eea',
                borderRadius: '15px',
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: dragActive ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                transition: 'all 0.3s',
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isLoading ? (
                <div>
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <p>正在处理PDF文件...</p>
                </div>
              ) : (
                <div className="mb-3">
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
            </div>
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
            <Button
              variant="primary"
              onClick={handleSaveProject}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              创建
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 保存模板模态框 */}
        <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>保存为模板</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>模板名称 *</Form.Label>
                <Form.Control
                  type="text"
                  value={currentTemplateForm.name || ''}
                  onChange={(e) => setCurrentTemplateForm({ ...currentTemplateForm, name: e.target.value })}
                  placeholder="例如：标准劳务分包合同模板"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveTemplate}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              保存
            </Button>
          </Modal.Footer>
        </Modal>

        {/* 导入模板模态框 */}
        <Modal show={showImportTemplateModal} onHide={() => setShowImportTemplateModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>从模板导入</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {templates.length === 0 ? (
              <Alert variant="info">暂无模板，请先创建模板</Alert>
            ) : (
              <Table hover>
                <thead>
                  <tr>
                    <th>模板名称</th>
                    <th>合同名称</th>
                    <th>供应单位</th>
                    <th>合同编号</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(template => (
                    <tr key={template.id}>
                      <td>{template.name}</td>
                      <td>{template.contractName || '-'}</td>
                      <td>{template.supplier || '-'}</td>
                      <td>{template.contractNumber || '-'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleImportFromTemplate(template)}
                        >
                          导入
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-1"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
        </Modal>

        {/* 提示消息 */}
        {alertMessage && (
          <Alert
            variant={alertMessage.type}
            dismissible
            onClose={() => setAlertMessage(null)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              minWidth: '300px',
            }}
          >
            {alertMessage.message}
          </Alert>
        )}
      </Container>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    labor: '#667eea',
    professional: '#764ba2',
    technology: '#f093fb',
    material: '#f5576c',
  };
  return colors[category] || '#667eea';
}

function getCategoryBadge(category: string): string {
  const badges: Record<string, string> = {
    labor: '劳',
    professional: '专',
    technology: '技',
    material: '物',
  };
  return badges[category] || '';
}

<style jsx global>{`
  .contract-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2) !important;
  }
`}</style>