# AI 创意工作室架构优化 - 实现计划

## [x] Task 1: 创建模型抽象层
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建统一的模型接口和实现类
  - 实现 Gemini 和 OpenRouter 模型的具体实现
  - 创建模型工厂用于管理和获取模型实例
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-1.1: 所有模型实现都实现了统一的接口
  - `programmatic` TR-1.2: 模型工厂能正确注册和获取模型
  - `human-judgment` TR-1.3: 代码结构清晰，模块化程度高
- **Notes**: 参考之前的模型抽象架构建议

## [x] Task 2: 实现统一的任务处理架构
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 创建统一的任务接口和任务处理器
  - 实现文生图、局部重绘、进阶设计、Agent 图片的任务处理器
  - 创建任务工厂用于管理任务处理器
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-2.1: 所有任务处理器实现统一接口
  - `programmatic` TR-2.2: 任务工厂能正确获取对应任务处理器
  - `human-judgment` TR-2.3: 代码复用率高，逻辑清晰
- **Notes**: 确保所有任务处理器使用统一的积分处理和文件保存逻辑

## [x] Task 3: 重构后端服务层
- **Priority**: P0
- **Depends On**: Task 2
- **Description**:
  - 重构 generation.service.ts，使用新的任务处理架构
  - 统一积分处理、文件保存等共享逻辑
  - 确保所有生成功能使用统一的服务接口
- **Acceptance Criteria Addressed**: AC-1, AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: 所有生成功能调用统一的服务接口
  - `human-judgment` TR-3.2: 代码结构清晰，便于维护
- **Notes**: 保持向后兼容性，确保现有 API 调用正常

## [x] Task 4: 优化前端状态管理
- **Priority**: P1
- **Depends On**: Task 3
- **Description**:
  - 创建统一的生成状态管理 store
  - 实现生成过程中的状态管理（等待、生成中、完成、失败）
  - 确保所有生成页面共享相同的状态管理逻辑
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-4.1: 生成过程中显示等待状态提示
  - `human-judgment` TR-4.2: 生成中按钮显示为"生成中"且不可点击
  - `human-judgment` TR-4.3: 状态更新及时响应
- **Notes**: 使用 Zustand 实现状态管理

## [x] Task 5: 统一前端参数选项
- **Priority**: P1
- **Depends On**: Task 4
- **Description**:
  - 为所有生成功能页面添加图片质量、比例和模型切换选项
  - 确保选项 UI 一致，用户体验统一
  - 实现选项的状态管理
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-5.1: 所有生成页面都有图片质量选项
  - `human-judgment` TR-5.2: 所有生成页面都有图片比例选项
  - `human-judgment` TR-5.3: 所有生成页面都有模型切换选项
- **Notes**: 确保选项与后端 API 参数一致

## [x] Task 6: 测试和验证
- **Priority**: P1
- **Depends On**: Task 5
- **Description**:
  - 测试所有生成功能的正常运行
  - 验证前端状态管理和 UI 交互
  - 确保代码质量和可维护性
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-6.1: 所有生成 API 调用正常
  - `human-judgment` TR-6.2: 前端状态管理和 UI 交互正常
  - `human-judgment` TR-6.3: 代码结构清晰，便于维护
- **Notes**: 进行全面的功能测试和代码审查