
# 修复局部重绘 414 错误计划

## 问题分析
当用户在图片生成页面点击图片上的“局部重绘”按钮时，系统会通过 URL 参数的方式将图片 URL 和完整的提示词传递到局部重绘页面。如果提示词很长，会导致 URL 超出服务器的最大长度限制，出现 414 Request-URI Too Large 错误。

## 修复方案
只需要传递图片 URL，不需要传递历史提示词，这样可以极大缩短 URL 长度，同时符合用户需求（用户在局部重绘时需要重新输入描述）。

## 需要修改的文件
1. `/home/ubuntu/bayinai/ai-studio/src/components/generate/Canvas.tsx` - 修改 handleEdit 函数，移除 prompt 参数的传递
2. `/home/ubuntu/bayinai/ai-studio/src/app/(main)/generate/edit/page.tsx` - 保持现有代码即可，因为它不会再接收到 prompt 参数，inpaintDescription 会保持为空

## 具体修改
在 Canvas.tsx 的 handleEdit 函数中，将 URL 构造从：
```typescript
const editUrl = `/generate/edit?image=${encodeURIComponent(image.url)}&prompt=${encodeURIComponent(image.prompt || "")}`;
```
修改为：
```typescript
const editUrl = `/generate/edit?image=${encodeURIComponent(image.url)}`;
```
