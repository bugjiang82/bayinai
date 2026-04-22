# Tasks
- [x] Task 1: 创建统一图像生成页面 `/generate/image/page.tsx`
  - [x] SubTask 1.1: 参考视频生成页面结构，创建左侧画布 + 右侧参数面板布局
  - [x] SubTask 1.2: 实现模式切换按钮（文生图 / 图生图）
  - [x] SubTask 1.3: 实现文生图模式功能（文本输入、参数面板、Canvas）
  - [x] SubTask 1.4: 实现图生图模式功能（参考图片上传、权重滑块、变换类型选择）
  - [x] SubTask 1.5: 实现历史记录加载和分页功能
  - [x] SubTask 1.6: 实现生成逻辑和进度展示

- [x] Task 2: 更新 Sidebar 导航链接
  - [x] SubTask 2.1: 将"文生图"链接改为"图像生成"，指向 `/generate/image`
  - [x] SubTask 2.2: 移除"图生图"导航项（合并到图像生成页面）

- [x] Task 3: 添加旧路由重定向
  - [x] SubTask 3.1: `/generate/text-to-image` 重定向到 `/generate/image?mode=text`
  - [x] SubTask 3.2: `/generate/image-to-image` 重定向到 `/generate/image?mode=image`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
