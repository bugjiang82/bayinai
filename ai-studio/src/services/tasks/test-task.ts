import { TaskFactory } from "./TaskFactory.ts";
import { TextToImageTask } from "./TextToImageTask.ts";
import { InpaintTask } from "./InpaintTask.ts";
import { ArchitectureTask } from "./ArchitectureTask.ts";
import { AgentImageTask } from "./AgentImageTask.ts";

// 测试任务工厂
async function testTaskFactory() {
  console.log("Testing TaskFactory...");
  
  // 获取支持的任务类型
  const supportedTypes = TaskFactory.getSupportedTaskTypes();
  console.log("Supported task types:", supportedTypes);
  
  // 测试创建不同类型的任务
  for (const type of supportedTypes) {
    try {
      const task = TaskFactory.createTask(type);
      console.log(`Successfully created task for type: ${type}`);
      console.log(`Task type: ${task.getType()}`);
      console.log(`Task cost (flash): ${task.getCost("flash")}`);
      console.log(`Task cost (pro): ${task.getCost("pro")}`);
    } catch (error) {
      console.error(`Error creating task for type ${type}:`, error);
    }
  }
}

// 测试各个任务处理器
async function testTaskProcessors() {
  console.log("\nTesting Task Processors...");
  
  const textToImageTask = new TextToImageTask();
  console.log("TextToImageTask:", textToImageTask.getType(), textToImageTask.getCost("flash"));
  
  const inpaintTask = new InpaintTask();
  console.log("InpaintTask:", inpaintTask.getType(), inpaintTask.getCost("pro"));
  
  const architectureTask = new ArchitectureTask();
  console.log("ArchitectureTask:", architectureTask.getType(), architectureTask.getCost("pro"));
  
  const agentImageTask = new AgentImageTask();
  console.log("AgentImageTask:", agentImageTask.getType(), agentImageTask.getCost("flash"));
}

// 运行测试
async function runTests() {
  await testTaskFactory();
  await testTaskProcessors();
  console.log("\nAll tests completed!");
}

runTests().catch((error) => {
  console.error("Test failed:", error);
});
