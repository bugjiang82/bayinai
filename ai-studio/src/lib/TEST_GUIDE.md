# 测试设置说明

## 概述

本测试文件验证混合存储方案的正确性，确保小文件和大文件分别使用正确的存储方式。

## 需要安装的依赖

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

## 运行测试

```bash
# 在项目根目录运行
npm test

# 或使用 vitest
npx vitest

# 监视模式
npx vitest --watch

# 只运行特定测试
npx vitest run imageStorage
```

## 测试覆盖的场景

### 1. 存储决策逻辑
- ✅ 总大小 < 2MB 时使用 localStorage
- ✅ 总大小 >= 2MB 时使用 IndexedDB
- ✅ 空数组清除所有存储

### 2. 加载逻辑
- ✅ localStorage 有数据时从 localStorage 加载
- ✅ localStorage 为空但 IndexedDB 有数据时从 IndexedDB 加载
- ✅ 两者都为空时返回空数组

### 3. 边界情况
- ✅ 正好 2MB 边界值使用 localStorage
- ✅ 略超过 2MB 使用 IndexedDB
- ✅ 多张小图片总和超过 2MB 时使用 IndexedDB

### 4. 数据完整性
- ✅ 存储后加载的数据与原始数据一致
- ✅ 大文件存储后数据内容不丢失

## 预期测试结果

```
✓ 小文件 (< 2MB) 使用 localStorage
✓ 大文件 (>= 2MB) 使用 IndexedDB
✓ 数据完整性验证通过
```
