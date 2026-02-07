import OpenAI from "openai";
import { useSettingsStore } from "@/stores/settingsStore";

let client: OpenAI | null = null;
let lastApiKey = "";
let lastBaseURL = "";

function getClient(): OpenAI {
  const { apiKey, baseURL } = useSettingsStore.getState();

  // Recreate client if settings changed
  if (!client || apiKey !== lastApiKey || baseURL !== lastBaseURL) {
    client = new OpenAI({
      apiKey: apiKey || "missing-key",
      baseURL: baseURL || "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true, // Required for React Native
      defaultHeaders: {
        "HTTP-Referer": "https://why-app.local",
        "X-Title": "Why - Educational Feed",
      },
    });
    lastApiKey = apiKey;
    lastBaseURL = baseURL;
  }

  return client;
}

export interface CompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function generateCompletion(
  options: CompletionOptions
): Promise<string> {
  const { systemPrompt, userPrompt, model, maxTokens, temperature } = options;
  const { defaultModel } = useSettingsStore.getState();

  const openai = getClient();

  try {
    const completion = await openai.chat.completions.create({
      model: model ?? defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens ?? 1024,
      temperature: temperature ?? 0.8,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in API response");
    }

    return content.trim();
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error("Invalid API key. Please check your settings.");
      }
      if (error.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      if (error.status === 402) {
        throw new Error("Insufficient credits. Please check your API account.");
      }
      throw new Error(`API error (${error.status}): ${error.message}`);
    }

    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        throw new Error("Network error. Please check your connection and base URL.");
      }
      throw error;
    }

    throw new Error("An unexpected error occurred while generating content.");
  }
}

export function isConfigured(): boolean {
  const { apiKey } = useSettingsStore.getState();
  return apiKey.length > 0;
}
