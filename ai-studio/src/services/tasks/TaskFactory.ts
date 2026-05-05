import type { GenType } from "@/types/generation";
import type { GenerateService } from "./GenerateService";
import { TextToImageTask } from "./TextToImageTask";
import { InpaintTask } from "./InpaintTask";
import { ArchitectureTask } from "./ArchitectureTask";
import { AgentImageTask } from "./AgentImageTask";

export class TaskFactory {
  private static taskMap: Partial<Record<GenType, () => GenerateService>> = {
    TEXT_TO_IMAGE: () => new TextToImageTask(),
    INPAINT: () => new InpaintTask(),
    ARCHITECTURE: () => new ArchitectureTask(),
    AGENT_IMAGE: () => new AgentImageTask(),
  };

  static createTask(type: GenType): GenerateService {
    const taskCreator = this.taskMap[type];
    if (!taskCreator) {
      throw new Error(`Unsupported task type: ${type}`);
    }
    return taskCreator();
  }

  static getSupportedTaskTypes(): GenType[] {
    return Object.keys(this.taskMap) as GenType[];
  }

  static isTaskTypeSupported(type: string): type is GenType {
    return type in this.taskMap;
  }
}
