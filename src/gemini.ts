const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite-preview-06-17",
];

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set (check your .env file)");
  }
  return key;
}

function getModels(): string[] {
  const configured = process.env.GEMINI_MODELS;
  if (!configured) return DEFAULT_MODELS;
  const models = configured
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return models.length > 0 ? models : DEFAULT_MODELS;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

export interface GenerateOptions {
  /**
   * Enables Gemini 2.5's extended thinking so the model reasons through
   * diagram structure before answering. -1 lets the model pick its own
   * budget; omit for models that don't support thinking (they'll just
   * ignore or reject the field, which falls through to the next model).
   */
  thinkingBudget?: number;
}

// gemini-2.5-flash-lite has thinking off by default and can be flaky about
// accepting thinkingConfig, so only request it from models known to support it well.
function supportsThinking(model: string): boolean {
  return !model.includes("lite");
}

async function callModel(
  model: string,
  systemInstruction: string,
  prompt: string,
  options: GenerateOptions
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getApiKey()}`;

  const generationConfig: Record<string, unknown> = { temperature: 0.3 };
  if (options.thinkingBudget !== undefined && supportsThinking(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  const json = (await res.json()) as GeminiResponse;

  if (!res.ok) {
    throw new Error(`Gemini model ${model} returned ${res.status}: ${json.error?.message ?? res.statusText}`);
  }

  // Thought-summary parts (when includeThoughts is enabled) are marked
  // thought:true; skip them so only the final answer is returned.
  const text =
    json.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("") ?? "";
  if (!text.trim()) {
    throw new Error(`Gemini model ${model} returned an empty response`);
  }
  return text;
}

/**
 * Calls Gemini, falling back through GEMINI_MODELS in order if a model
 * errors out (e.g. rate limited or temporarily unavailable).
 */
export async function generateWithFallback(
  systemInstruction: string,
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const models = getModels();
  const errors: string[] = [];

  for (const model of models) {
    try {
      return await callModel(model, systemInstruction, prompt, options);
    } catch (error) {
      errors.push(`${model}: ${(error as Error).message}`);
    }
  }

  throw new Error(`All Gemini models failed:\n${errors.join("\n")}`);
}

export function extractXml(text: string): string {
  const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("<mxfile");
  const startFallback = start === -1 ? candidate.indexOf("<mxGraphModel") : start;
  const trimmed = startFallback === -1 ? candidate : candidate.slice(startFallback);
  return trimmed.trim();
}
