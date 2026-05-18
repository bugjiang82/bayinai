````markdown
# gpt-image-2 API 调用完整指南 (Node.js)

## 目录
- [环境准备](#环境准备)
- [一、文字生成图片 (Text-to-Image)](#一文字生成图片-text-to-image)
- [二、多图参考生成图片 (Image-to-Image / Edit)](#二多图参考生成图片-image-to-image--edit)
- [三、HTTP 请求原始版本](#三http-请求原始版本)
- [四、关键参数说明](#四关键参数说明)
- [五、重要注意事项](#五重要注意事项)
- [六、错误处理](#六错误处理)

---

## 环境准备

### 安装依赖

```bash
npm install openai dotenv


环境变量配置 (.env)
env
OPENAI_API_KEY=your_api_key_here
初始化客户端
javascript
import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 600 * 1000,  // 必须！生图可能需3-5分钟
  maxRetries: 2,
});
一、文字生成图片 (Text-to-Image)
基础版本
javascript
/**
 * 文字生成图片
 * @param {string} prompt - 图像描述文本
 * @param {string} outputPath - 输出路径
 * @param {Object} options - 可选参数
 */
async function generateImageFromText(prompt, outputPath, options = {}) {
  const {
    size = "1024x1024",
    quality = "high",
    n = 1,
    thinking = "medium",
  } = options;

  try {
    const response = await client.images.generate({
      model: "gpt-image-2",
      prompt: prompt,
      size: size,
      quality: quality,
      n: n,
      thinking: thinking,
      response_format: "b64_json",
    });

    // 保存图片
    const savePromises = response.data.map(async (img, idx) => {
      if (img.b64_json) {
        const savePath = n === 1 ? outputPath : 
          `${path.basename(outputPath, path.extname(outputPath))}_${idx + 1}.png`;
        await fs.writeFile(savePath, Buffer.from(img.b64_json, "base64"));
        console.log(`✅ 图片 ${idx + 1} 已保存: ${savePath}`);
      }
    });
    
    await Promise.all(savePromises);
    return response.data;
  } catch (error) {
    console.error("❌ 生成失败:", error.message);
    throw error;
  }
}

// 使用示例
await generateImageFromText(
  "一只穿着赛博朋克夹克的柴犬，戴着霓虹色护目镜，站在未来都市的霓虹灯下，4K高清",
  "./output/text_to_image.png",
  { size: "1536x1024", quality: "high", thinking: "medium" }
);
二、多图参考生成图片 (Image-to-Image / Edit)
单张参考图编辑
javascript
/**
 * 使用单张参考图生成新图片（编辑/风格化）
 * @param {string} imagePath - 参考图片本地路径
 * @param {string} prompt - 编辑指令
 * @param {string} outputPath - 输出路径
 */
async function generateWithSingleReference(imagePath, prompt, outputPath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    
    const response = await client.images.edit({
      model: "gpt-image-2",
      image: imageBuffer,
      prompt: prompt,
      size: "1024x1024",
      quality: "high",
      n: 1,
      response_format: "b64_json",
    });

    const base64Image = response.data[0].b64_json;
    await fs.writeFile(outputPath, Buffer.from(base64Image, "base64"));
    console.log(`✅ 图片已保存: ${outputPath}`);
  } catch (error) {
    console.error("❌ 生成失败:", error.message);
  }
}

// 使用示例
await generateWithSingleReference(
  "./input/portrait.jpg",
  "Change the background to a cyberpunk city at night, neon lights, keep the person's face and expression exactly the same",
  "./output/edited_portrait.png"
);
多图参考融合（推荐）
javascript
/**
 * 使用多张参考图生成新图片（融合多图特征）
 * @param {string[]} imagePaths - 多张参考图片路径数组
 * @param {string} prompt - 融合/编辑指令
 * @param {string} outputPath - 输出路径
 * @param {Object} options - 可选参数
 */
async function generateWithMultipleReferences(imagePaths, prompt, outputPath, options = {}) {
  const {
    size = "1024x1024",
    quality = "high",
    n = 1,
    thinking = "medium",
  } = options;

  try {
    // 读取所有参考图片
    const imageBuffers = await Promise.all(
      imagePaths.map(async (imgPath) => ({
        image: await fs.readFile(imgPath)
      }))
    );

    const response = await client.images.edit({
      model: "gpt-image-2",
      images: imageBuffers,         // 多图参数
      prompt: prompt,
      size: size,
      quality: quality,
      n: n,
      thinking: thinking,
      response_format: "b64_json",
    });

    // 保存所有生成的图片
    const savePromises = response.data.map(async (img, idx) => {
      if (img.b64_json) {
        const savePath = n === 1 ? outputPath : 
          `${path.basename(outputPath, path.extname(outputPath))}_${idx + 1}.png`;
        await fs.writeFile(savePath, Buffer.from(img.b64_json, "base64"));
        console.log(`✅ 图片 ${idx + 1} 已保存: ${savePath}`);
      }
    });
    
    await Promise.all(savePromises);
    return response.data;
  } catch (error) {
    console.error("❌ 多图融合失败:", error.message);
    throw error;
  }
}

// ============ 使用示例 ============

// 示例1: 融合两张图（人物姿势 + 服装风格）
await generateWithMultipleReferences(
  [
    "./input/pose_reference.jpg",      // 参考姿势
    "./input/clothing_reference.jpg",  // 参考服装
  ],
  "Combine the character's pose from the first image with the clothing style from the second image. "
  + "Preserve the facial features and expression exactly. Output in high quality photographic style.",
  "./output/fusion_result.png",
  { thinking: "high", quality: "high" }
);

// 示例2: 三图融合（背景 + 主体 + 艺术风格）
await generateWithMultipleReferences(
  [
    "./input/background_scene.jpg",     // 背景参考
    "./input/subject_person.jpg",       // 人物主体
    "./input/style_reference.jpg",      // 艺术风格参考
  ],
  "Create an image where: "
  + "- The background is taken from image 1 (the forest scene) "
  + "- The main subject (person) is from image 2, keep exact face, expression, pose "
  + "- Apply the artistic color grading and lighting style from image 3 "
  + "The output should look coherent and natural.",
  "./output/triple_fusion.png",
  { size: "1536x1024", thinking: "high", quality: "high", n: 2 }
);
人物一致性 Prompt 最佳实践
javascript
const CONSISTENCY_PROMPT = `
portrait orientation (2:3 aspect ratio), 
preserve the exact people, poses, facial expressions, and scene composition as faithfully as possible.
Maintain the original subject's identity without alteration.
`.trim();

// 使用时追加到描述后面
const fullPrompt = `${userPrompt}\n\n${CONSISTENCY_PROMPT}`;


三、HTTP 请求原始版本
如需更精细的控制，可直接使用 fetch：

javascript
async function generateWithMultipleImagesHTTP(imagePaths, prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  const formData = new FormData();
  formData.append("model", "gpt-image-2");
  formData.append("prompt", prompt);
  formData.append("size", "1024x1024");
  formData.append("quality", "high");
  formData.append("n", "1");
  formData.append("response_format", "b64_json");
  
  // 附加多张图片
  for (let i = 0; i < imagePaths.length; i++) {
    const imgBuffer = await fs.readFile(imagePaths[i]);
    const blob = new Blob([imgBuffer], { type: "image/jpeg" });
    formData.append(`images`, blob, `reference_${i + 1}.jpg`);
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result;
}
四、关键参数说明
参数	类型	说明	可选值
model	String	模型名称	"gpt-image-2"
prompt	String	图像描述/编辑指令	中英文皆可，描述越详细效果越好
size	String	输出尺寸	"1024x1024", "1536x1024", "1024x1536", "2048x2048" 等
quality	String	质量档位	"low" (快/便宜), "medium", "high" (佳/贵)
n	Integer	生成数量	1-10
response_format	String	返回格式	"b64_json" (推荐，直接保存), "url" (1小时有效链接)
thinking	String	思考预算	"off", "low", "medium", "high" (复杂任务推荐 medium/high)
五、重要注意事项
⚠️ 必须遵守
超时设置

生成高质量大图可能耗时 3-5 分钟

Node.js 客户端必须设置 timeout: 600000 (600秒)

多图 + thinking 模式可能耗时 30-60 秒

API Key 安全

❌ 绝对不要硬编码在代码中

✅ 始终通过环境变量读取

✅ 生产环境使用密钥管理服务

端点区分

文字生成图：/v1/images/generations

图生图/编辑：/v1/images/edits

多图限制

单次请求最多支持 8 张参考图

成本控制

quality: "high" 约为 standard 的 2 倍成本

thinking: "high" 会增加显著成本

生成前评估实际需求

💡 最佳实践
人物一致性

text
preserve the exact people, poses, facial expressions, and scene composition as faithfully as possible
复杂任务开启 thinking

多图融合 → thinking: "medium" 或 "high"

文字渲染/UI生成 → thinking: "high"

选择合适的 response_format

需要保存到本地 → "b64_json"

仅临时展示 → "url" (链接1小时有效)

使用代理服务（国内用户）

javascript
const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://api.apiyi.com/v1",  // 替换为代理地址
  timeout: 600 * 1000,
});
六、错误处理
常见错误码
错误码	含义	处理方式
429	速率限制/配额不足	增加重试延迟，检查账户余额
400	请求参数错误	检查 prompt、size 等参数
401	认证失败	检查 API Key 是否正确
408/超时	请求超时	增加 timeout 设置
500	服务器错误	重试或降级处理

带重试的生产级代码
javascript
async function generateImageWithRetry(prompt, outputPath, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateImageFromText(prompt, outputPath);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`遇到限流，${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
完整项目结构示例
text
your-project/
├── .env                    # API Key 配置
├── package.json
├── input/                  # 参考图片存放目录
│   ├── pose_reference.jpg
│   ├── clothing_reference.jpg
│   └── subject_person.jpg
├── output/                 # 生成图片输出目录
├── image2api.js            # 主代码文件
└── node_modules/
相关链接
OpenAI 官方文档

gpt-image-2 模型说明

OpenAI Node.js SDK

text








````

## **一、选区修改功能说明**

`gpt-image-2` 的 `images.edit` 接口支持通过 **mask（蒙版图）** 来指定要修改的区域。

### **工作原理**

- 上传原图 + 一张 **带 alpha 通道的 mask 图**
- mask 图中：**透明区域（alpha=0）= 要重绘/修改的区域**，**不透明区域 = 保留原样**
- 模型会根据你的 prompt 指令，只对透明区域进行修改，同时保持其他区域不变

### **核心特征**

**特征**

**说明**

**无需手动绘制选区**

可直接用自然语言描述要修改的内容，模型智能理解

**mask 软引导**

mask 是“软引导”而非精确边界，模型可能在蒙版周围轻微扩展/收敛

**支持多图融合编辑**

可同时上传 mask + 多张参考图，实现“用参考图替换选区内容”

**保留未修改区域**

mask 不透明区域完全保留，人物身份、光照、构图不变

***

## **二、选区修改代码示例**

### **单张 mask 局部重绘（带代码）**

javascript

```
import OpenAI from "openai";
import fs from "node:fs/promises";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 600 * 1000,
});

/**
 * 使用 mask 进行局部重绘
 * @param {string} originalImagePath - 原图路径
 * @param {string} maskPath - 蒙版图路径（透明区域=要修改的区域）
 * @param {string} prompt - 修改指令
 * @param {string} outputPath - 输出路径
 */
async function inpaintWithMask(originalImagePath, maskPath, prompt, outputPath) {
  try {
    const originalBuffer = await fs.readFile(originalImagePath);
    const maskBuffer = await fs.readFile(maskPath);

    const response = await client.images.edit({
      model: "gpt-image-2",
      image: originalBuffer,
      mask: maskBuffer,                    // 关键参数：指定修改区域
      prompt: prompt,
      size: "1024x1024",
      quality: "high",
      n: 1,
      response_format: "b64_json",
    });

    const base64Image = response.data[0].b64_json;
    await fs.writeFile(outputPath, Buffer.from(base64Image, "base64"));
    console.log(`✅ 局部重绘完成: ${outputPath}`);
  } catch (error) {
    console.error("❌ 重绘失败:", error.message);
  }
}

// 使用示例：将图中红帽子换成奶油色宽檐帽
await inpaintWithMask(
  "./input/portrait.jpg",
  "./input/hat_mask.png",  // hat_mask.png 中帽子区域为透明
  "Replace the red hat with a cream wide-brim sunhat, keep everything else unchanged",
  "./output/edited_hat.png"
);
```

### **多图参考 + mask 选区修改（进阶）**

选区修改时，你还可以**同时上传多张参考图**，让模型用参考图中的元素来填充选区。

javascript

```
/**
 * 使用 mask + 多张参考图进行选区填充/替换
 * @param {string} originalImagePath - 原图
 * @param {string} maskPath - 蒙版（透明区域=修改区）
 * @param {string[]} referencePaths - 参考图片数组
 * @param {string} prompt - 修改指令
 */
async function inpaintWithReferences(originalImagePath, maskPath, referencePaths, prompt, outputPath) {
  try {
    const originalBuffer = await fs.readFile(originalImagePath);
    const maskBuffer = await fs.readFile(maskPath);
    
    // 读取所有参考图
    const referenceBuffers = await Promise.all(
      referencePaths.map(async (path) => ({
        image: await fs.readFile(path)
      }))
    );

    const response = await client.images.edit({
      model: "gpt-image-2",
      image: originalBuffer,
      mask: maskBuffer,
      images: referenceBuffers,      // 参考图：用于提取风格/元素
      prompt: prompt,
      size: "1024x1024",
      quality: "high",
      thinking: "high",              // 复杂替换建议开启
      response_format: "b64_json",
    });

    const base64Image = response.data[0].b64_json;
    await fs.writeFile(outputPath, Buffer.from(base64Image, "base64"));
    console.log(`✅ 参考图融合+局部替换完成: ${outputPath}`);
  } catch (error) {
    console.error("❌ 操作失败:", error.message);
  }
}

// 使用示例：用参考图中的图案替换 T 恤区域
await inpaintWithReferences(
  "./input/model.jpg",                    // 原图
  "./input/shirt_mask.png",              // T恤区域为透明
  ["./input/floral_pattern.jpg", "./input/shirt_color_ref.jpg"],  // 印花+颜色参考
  "Replace the t-shirt area with the floral pattern from image 1 and color palette from image 2, keep the person's face and pose identical",
  "./output/floral_shirt.png"
);
```

***

## **三、mask 图制作要求**

**要求**

**说明**

**格式**

PNG（支持 alpha 通道）

**Alpha 通道规则**

透明区域（alpha=0）= 要重绘的区域；不透明区域 = 保留

**尺寸**

必须与原图**完全相同**的宽高

**文件大小**

单张 ≤ 50MB

### **如何制作 mask 图？**

如果你没有现成的 mask 图，可以用以下简单方法生成：

javascript

```
import sharp from "sharp";

async function createSimpleMask(imagePath, outputMaskPath, regions) {
  // regions: [{x, y, width, height}] 要修改的矩形区域
  const metadata = await sharp(imagePath).metadata();
  
  const maskBuffer = Buffer.alloc(metadata.width * metadata.height * 4, 255); // 全不透明（白色）
  
  // 将指定区域设为透明（alpha=0）
  // 此处简化，实际生产建议用 sharp.composite()
  
  await sharp(maskBuffer, { raw: { width: metadata.width, height: metadata.height, channels: 4 } })
    .png()
    .toFile(outputMaskPath);
}
```

> ⚠️ 注意：mask 是“软引导”，模型可能基于语义理解轻微调整选中区域边界

***

## **四、典型应用场景**

**场景**

**示例 Prompt**

**是否需要参考图**

**对象替换**

"Replace the red hat with a cream wide-brim sunhat"

❌ 可选

**背景更换**

"Place the subject on a foggy forest trail at golden hour"

❌ 可选

**文字修正**

"Change the sign to read exactly 'OPEN 8–6' in clean sans-serif"

❌ 可选

**风格迁移**

"Apply the color grading style from reference image to the selected area"

✅ 推荐

**图案填充**

"Replace the shirt with the floral pattern from reference image 1"

✅ 必需

**向外扩展**

"Extend the image 40% to the right, continue the beach scene"

❌ 可选

***

## **五、关键注意事项**

### **⚠️ mask 相关**

1. **mask 必须带 alpha 通道**，否则 API 会报错
2. **mask 尺寸必须与原图完全一致**
3. **mask 是软引导**，不是精确像素边界，模型可能在边缘小幅扩展
4. **仅对第一张 **`image`** 生效**（如果上传多张原图，只有第一张会应用 mask）

### **💡 最佳实践**

1. **选区修改时开启 \`thinking: "medium" 或 "high"**，尤其在需要精确保持未修改区域一致性时
2. **prompt 中明确约束不变区域**：如 "keep the person's face and pose identical"
3. **用参考图提升替换质量**：替换复杂图案/纹理时建议提供参考图
4. **无需自己绘制精确选区**：对于简单对象（如“把猫换成狗”），可不用 mask，直接用自然语言描述，模型会智能理解

