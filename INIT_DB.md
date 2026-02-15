# 数据库初始化说明

## 默认账号

系统会自动创建默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

**⚠️ 重要: 首次登录后请立即修改密码！**

## 数据库位置

数据库文件位于: `data/contract-ledger.db`

## 数据库结构

数据库包含以下表：

1. **users** - 用户表
   - id: 用户ID
   - username: 用户名
   - password: 密码（已加密）
   - email: 邮箱
   - role: 角色（admin/user）
   - created_at: 创建时间

2. **projects** - 项目表
   - id: 项目ID
   - name: 项目名称
   - description: 项目描述
   - created_by: 创建者ID
   - created_at: 创建时间

3. **contracts** - 合同表
   - id: 合同ID
   - project_id: 所属项目ID
   - contract_name: 合同名称
   - supplier: 供应商
   - contract_number: 合同编号
   - contract_amount: 合同金额
   - bid_method: 招标方式
   - sign_date: 签订日期
   - payment_ratio: 付款比例
   - tax_rate: 税率（默认9%）
   - total_billing_tax_included: 累计计价（含税）
   - total_billing_tax_excluded: 累计计价（不含税）
   - total_payment_tax_included: 累计付款（含税）
   - total_payment_tax_excluded: 累计付款（不含税）
   - category: 类别（labor/material）
   - created_by: 创建者ID
   - created_at: 创建时间

4. **monthly_billing** - 月度计价表
   - id: 计价ID
   - contract_id: 合同ID
   - billing_date: 计价日期
   - amount: 金额
   - created_at: 创建时间

5. **monthly_payment** - 月度付款表
   - id: 付款ID
   - contract_id: 合同ID
   - payment_date: 付款日期
   - amount: 金额
   - created_at: 创建时间

6. **project_members** - 项目成员表
   - id: 成员ID
   - project_id: 项目ID
   - user_id: 用户ID
   - role: 角色
   - created_at: 创建时间

7. **templates** - 模板表
   - id: 模板ID
   - name: 模板名称
   - 其他字段与合同表类似
   - created_by: 创建者ID
   - created_at: 创建时间

## 自动初始化

首次运行 `npm run dev` 时，系统会自动：
1. 创建数据库文件 `data/contract-ledger.db`
2. 创建所有必要的表结构
3. 创建默认管理员账号

## 权限说明

- **admin**: 管理员，拥有所有权限
- **user**: 普通用户，只能访问自己有权限的项目