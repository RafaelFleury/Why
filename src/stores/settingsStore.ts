import { create } from "zustand";
import Constants from "expo-constants";
import * as db from "@/services/database";
import type { AppSettings, Language, PostLength } from "@/types";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/utils/constants";

interface SettingsState extends AppSettings {
  isConfigured: boolean;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => Promise<void>;
  saveAllSettings: () => Promise<void>;
}

// Read dev environment overrides from expo-constants
function getEnvOverride(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra;
  if (extra && extra[key]) return extra[key] as string;
  // Also check process.env with EXPO_PUBLIC_ prefix
  const envKey = `EXPO_PUBLIC_${key.toUpperCase()}`;
  const val = (process.env as Record<string, string | undefined>)[envKey];
  return val || undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: "",
  baseURL: DEFAULT_BASE_URL,
  defaultModel: DEFAULT_MODEL,
  postLength: "medium" as PostLength,
  language: "en" as Language,
  isConfigured: false,
  isLoaded: false,

  loadSettings: async () => {
    const settings = await db.getAllSettings();

    // Start with DB values
    const apiKey = settings.api_key ?? "";
    const baseURL = settings.base_url ?? DEFAULT_BASE_URL;
    const defaultModel = settings.default_model ?? DEFAULT_MODEL;
    const postLength = (settings.post_length as PostLength) ?? "medium";
    const language = (settings.language as Language) ?? "en";

    // Overlay env overrides (development only)
    const envApiKey = getEnvOverride("API_KEY");
    const envBaseURL = getEnvOverride("BASE_URL");
    const envModel = getEnvOverride("DEFAULT_MODEL");

    const finalApiKey = envApiKey || apiKey;
    const finalBaseURL = envBaseURL || baseURL;
    const finalModel = envModel || defaultModel;

    set({
      apiKey: finalApiKey,
      baseURL: finalBaseURL,
      defaultModel: finalModel,
      postLength,
      language,
      isConfigured: finalApiKey.length > 0,
      isLoaded: true,
    });
  },

  updateSetting: async (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);

    // Map store key to DB key
    const dbKeyMap: Record<keyof AppSettings, string> = {
      apiKey: "api_key",
      baseURL: "base_url",
      defaultModel: "default_model",
      postLength: "post_length",
      language: "language",
    };

    await db.setSetting(dbKeyMap[key], String(value));

    // Update isConfigured when apiKey changes
    if (key === "apiKey") {
      set({ isConfigured: String(value).length > 0 });
    }
  },

  saveAllSettings: async () => {
    const state = get();
    await db.setSetting("api_key", state.apiKey);
    await db.setSetting("base_url", state.baseURL);
    await db.setSetting("default_model", state.defaultModel);
    await db.setSetting("post_length", state.postLength);
    await db.setSetting("language", state.language);
  },
}));
