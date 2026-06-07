import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

function getApiKey(...keys: (string | undefined)[]): string {
  for (const key of keys) {
    if (key && key.length > 0) return key;
  }
  return "";
}

let googleGenAIInstance: GoogleGenAI | null = null;
let googleGenerativeAIInstance: GoogleGenerativeAI | null = null;
let openAIInstance: OpenAI | null = null;

export function getGoogleGenAI(): GoogleGenAI {
  if (!googleGenAIInstance) {
    googleGenAIInstance = new GoogleGenAI({
      apiKey: getApiKey(process.env.GOOGLE_GENAI_API_KEY, process.env.GEMINI_API_KEY),
    });
  }
  return googleGenAIInstance;
}

export function getGoogleGenerativeAI(): GoogleGenerativeAI {
  if (!googleGenerativeAIInstance) {
    googleGenerativeAIInstance = new GoogleGenerativeAI(
      getApiKey(process.env.GOOGLE_GENAI_API_KEY, process.env.GEMINI_API_KEY)
    );
  }
  return googleGenerativeAIInstance;
}

export function getOpenAI(): OpenAI {
  if (!openAIInstance) {
    openAIInstance = new OpenAI({
      apiKey: getApiKey(process.env.OPENAI_API_KEY, process.env.OPENAI),
      timeout: 600 * 1000,
      maxRetries: 2,
    });
  }
  return openAIInstance;
}

export function getDASHSCOPE_API_KEY(): string {
  return process.env.DASHSCOPE_API_KEY || "";
}

export function getARK_API_KEY(): string {
  return process.env.ARK_API_KEY || "";
}

export const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";
export const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";