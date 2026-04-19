import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI, Type } from "@google/genai";
import { TaskStatus, SubTask, Agent } from "@/types/ai-agent";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "" });

interface ParsedTask {
  id: string;
  title: string;
  description: string;
  agentId: string;
}

interface ParsedAgent {
  id: string;
  name: string;
  persona: string;
  capabilities: string[];
}

interface ParsedResponse {
  tasks?: ParsedTask[];
  agents?: ParsedAgent[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { objective } = body;

    if (!objective) {
      return NextResponse.json({ error: "请输入任务目标" }, { status: 400 });
    }

    const prompt = `
    Objective: "${objective}"

    You are a task architect. Decompose the objective into a sequence of specific sub-tasks.
    If the task involves creating visual content (images, icons, logos), explicitly mention it in the task description.
    Assign each sub-task to a specialized agent identity.

    CRITICAL: All user-facing values (task titles, task descriptions, agent names, agent personas, agent capabilities) MUST be written in Chinese (简体中文).

    Return a JSON object exactly like this:
    {
      "tasks": [
        { "id": "t1", "title": "任务标题", "description": "任务目标描述", "agentId": "a1" }
      ],
      "agents": [
        { "id": "a1", "name": "专家名称", "persona": "专家身份描述", "capabilities": ["能力1", "能力2"] }
      ]
    }
  `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  agentId: { type: Type.STRING }
                },
                required: ["id", "title", "description", "agentId"]
              }
            },
            agents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  persona: { type: Type.STRING },
                  capabilities: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "name", "persona", "capabilities"]
              }
            }
          },
          required: ["tasks", "agents"]
        }
      }
    });

    const data: ParsedResponse = JSON.parse(response.text || "{}");

    const tasks: SubTask[] = data.tasks?.map((t: ParsedTask) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      agentId: t.agentId,
      status: TaskStatus.PENDING,
      reasoning: "",
      progress: 0
    })) || [];

    const agents: Agent[] = data.agents?.map((a: ParsedAgent) => ({
      id: a.id,
      name: a.name,
      persona: a.persona,
      capabilities: a.capabilities,
      status: "idle" as const
    })) || [];

    return NextResponse.json({ tasks, agents });
  } catch (err) {
    console.error("Decompose task error:", err);
    return NextResponse.json({ error: "任务分解失败" }, { status: 500 });
  }
}