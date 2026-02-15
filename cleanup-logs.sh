#!/bin/bash

# 清理 TypeScript 文件中的 console.log 调试日志
# 注意：这个脚本会删除所有 console.log、console.error、console.warn 语句

echo "开始清理调试日志..."

# 查找所有需要清理的文件
files=$(find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules)

# 统计需要清理的文件数量
count=$(echo "$files" | grep -c "tsx" || echo "0")
echo "找到 $count 个 TypeScript/TSX 文件"

# 询问用户确认
echo ""
echo "⚠️  警告：此操作将删除所有 console.log、console.error、console.warn 语句"
echo "建议在生产环境中保留这些日志，仅在必要时使用"
echo ""
read -p "是否继续？(y/N): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "操作已取消"
    exit 0
fi

# 执行清理
for file in $files; do
    echo "清理文件: $file"
    # 删除 console.log 语句
    sed -i '' '/console\.log/d' "$file"
    # 删除 console.error 语句
    sed -i '' '/console\.error/d' "$file"
    # 删除 console.warn 语句
    sed -i '' '/console\.warn/d' "$file"
done

echo ""
echo "✅ 清理完成！"
echo "请检查代码，确保没有删除重要的错误日志"