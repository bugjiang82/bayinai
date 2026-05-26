# 图片上传功能优化计划

## 问题分析

当前 ImageNode.tsx 中的图片上传功能存在以下问题：
1. 使用 `URL.createObjectURL(file)` 存储上传图片，页面刷新后失效
2. 没有文件大小限制检查
3. 没有持久化机制

## 实现方案

### 1. 修改 `handleFileUpload` 函数
- 添加文件大小检查（10MB限制）
- 使用 base64 格式而非 object URL 存储图片
- 添加 localStorage 持久化

### 2. 添加警告弹窗组件
- 当文件超过10MB时显示警告
- 使用简单的模态框实现

### 3. 修改图片加载逻辑
- 在组件挂载时从 localStorage 恢复图片
- 使用 base64 格式确保 API 调用可用

## 具体修改

### 文件1: `/home/ubuntu/bayinai/ai-studio/src/components/workflow/nodes/ImageNode.tsx`

#### 修改内容：
1. 添加文件大小常量 `const MAX_FILE_SIZE = 10 * 1024 * 1024;` (10MB)
2. 修改 `handleFileUpload` 函数：
   - 首先检查文件大小
   - 如果超过限制，显示警告
   - 否则读取为 base64
   - 同时保存到 localStorage（使用节点 ID 作为 key）
3. 添加 `useEffect` 在组件挂载时恢复图片
4. 修改图片存储方式，使用 base64 而非 object URL

### 文件2: 添加警告弹窗（可选，直接用 alert 或创建简单组件）
- 可以用简单的 alert 或使用项目现有的 UI 组件

## 技术细节

- localStorage 存储 key 格式: `uploaded_image_${nodeId}`
- 文件大小检查: `file.size > MAX_FILE_SIZE`
- base64 读取: 使用 `FileReader.readAsDataURL()`
- 确保 base64 图片可以被 generateImage API 正确处理

## 风险评估

- localStorage 存储限制：单个图片 base64 可能较大，但 10MB 以内是可接受的
- 页面加载速度：base64 图片可能影响加载，但对于单张图片影响不大
