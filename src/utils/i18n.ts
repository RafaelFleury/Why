import { useSettingsStore } from "@/stores/settingsStore";
import type { Language } from "@/types";

type TranslationKeys = keyof typeof translations.en;

const translations = {
  en: {
    // Navigation
    "nav.feed": "Feed",
    "nav.bookmarks": "Bookmarks",
    "nav.recap": "Recap",
    "nav.settings": "Settings",

    // Feed
    "feed.title": "Feed",
    "feed.empty": "No posts yet. Configure your topics and API key in Settings to get started!",
    "feed.generating": "Generating new posts...",
    "feed.pullToRefresh": "Pull to refresh",
    "feed.goToSettings": "Go to Settings",
    "feed.setupRequired": "Setup Required",
    "feed.setupMessage": "Add your API key and select topics in Settings to start learning.",

    // Post
    "post.like": "Like",
    "post.bookmark": "Bookmark",
    "post.tooEasy": "Too Easy",
    "post.tooHard": "Too Hard",
    "post.askQuestion": "Ask a question...",
    "post.sendQuestion": "Send",
    "post.replies": "Replies",
    "post.noReplies": "No replies yet. Tap to generate discussion.",
    "post.generateReplies": "Generate Discussion",
    "post.relatedPosts": "Related Posts",
    "post.quiz": "Quiz",
    "post.deepDive": "Deep Dive",
    "post.spacedReview": "Review",
    "post.standalone": "Post",
    "post.sequential": "Thread",

    // Bookmarks
    "bookmarks.title": "Bookmarks",
    "bookmarks.empty": "No bookmarks yet. Like posts in your feed to save them here.",
    "bookmarks.search": "Search bookmarks...",

    // Settings
    "settings.title": "Settings",
    "settings.apiConfig": "API Configuration",
    "settings.apiKey": "API Key",
    "settings.apiKeyPlaceholder": "Enter your API key",
    "settings.baseURL": "Base URL",
    "settings.baseURLPlaceholder": "https://openrouter.ai/api/v1",
    "settings.model": "Model",
    "settings.modelPlaceholder": "openai/gpt-4o-mini",
    "settings.topics": "Topics",
    "settings.addTopic": "Add Topic",
    "settings.topicName": "Topic name",
    "settings.topicDifficulty": "Difficulty",
    "settings.noTopics": "No topics added yet.",
    "settings.personalities": "Personalities",
    "settings.following": "Following",
    "settings.follow": "Follow",
    "settings.unfollow": "Unfollow",
    "settings.preferences": "Preferences",
    "settings.postLength": "Post Length",
    "settings.short": "Short",
    "settings.medium": "Medium",
    "settings.long": "Long",
    "settings.language": "Language",
    "settings.about": "About",
    "settings.version": "Version",
    "settings.clearData": "Clear All Data",
    "settings.clearDataConfirm": "Are you sure? This will delete all posts, bookmarks, and progress.",
    "settings.saved": "Settings saved!",
    "settings.active": "Active",
    "settings.inactive": "Inactive",

    // Weekly Recap
    "recap.title": "Weekly Recap",
    "recap.generate": "Generate Recap",
    "recap.generating": "Generating your recap...",
    "recap.postsThisWeek": "Posts This Week",
    "recap.topicsStudied": "Topics Studied",
    "recap.likes": "Likes",
    "recap.bookmarks": "Bookmarks",
    "recap.conceptsReviewed": "Concepts Reviewed",
    "recap.topicBreakdown": "Topic Breakdown",
    "recap.progress": "Progress",
    "recap.noActivity": "No activity this week. Start reading posts to see your recap!",
    "recap.summary": "AI Summary",

    // Difficulty
    "difficulty.1": "Beginner",
    "difficulty.2": "Elementary",
    "difficulty.3": "Intermediate",
    "difficulty.4": "Advanced",
    "difficulty.5": "Expert",

    // General
    "general.loading": "Loading...",
    "general.error": "Something went wrong",
    "general.retry": "Retry",
    "general.cancel": "Cancel",
    "general.save": "Save",
    "general.delete": "Delete",
    "general.confirm": "Confirm",
  },
  "pt-BR": {
    // Navigation
    "nav.feed": "Feed",
    "nav.bookmarks": "Salvos",
    "nav.recap": "Resumo",
    "nav.settings": "Ajustes",

    // Feed
    "feed.title": "Feed",
    "feed.empty": "Nenhuma postagem ainda. Configure seus tópicos e chave de API nos Ajustes para começar!",
    "feed.generating": "Gerando novas postagens...",
    "feed.pullToRefresh": "Puxe para atualizar",
    "feed.goToSettings": "Ir para Ajustes",
    "feed.setupRequired": "Configuração Necessária",
    "feed.setupMessage": "Adicione sua chave de API e selecione tópicos nos Ajustes para começar a aprender.",

    // Post
    "post.like": "Curtir",
    "post.bookmark": "Salvar",
    "post.tooEasy": "Muito Fácil",
    "post.tooHard": "Muito Difícil",
    "post.askQuestion": "Faça uma pergunta...",
    "post.sendQuestion": "Enviar",
    "post.replies": "Respostas",
    "post.noReplies": "Sem respostas ainda. Toque para gerar discussão.",
    "post.generateReplies": "Gerar Discussão",
    "post.relatedPosts": "Posts Relacionados",
    "post.quiz": "Quiz",
    "post.deepDive": "Aprofundamento",
    "post.spacedReview": "Revisão",
    "post.standalone": "Post",
    "post.sequential": "Thread",

    // Bookmarks
    "bookmarks.title": "Salvos",
    "bookmarks.empty": "Nenhum item salvo ainda. Curta posts no seu feed para salvá-los aqui.",
    "bookmarks.search": "Buscar nos salvos...",

    // Settings
    "settings.title": "Ajustes",
    "settings.apiConfig": "Configuração de API",
    "settings.apiKey": "Chave de API",
    "settings.apiKeyPlaceholder": "Insira sua chave de API",
    "settings.baseURL": "URL Base",
    "settings.baseURLPlaceholder": "https://openrouter.ai/api/v1",
    "settings.model": "Modelo",
    "settings.modelPlaceholder": "openai/gpt-4o-mini",
    "settings.topics": "Tópicos",
    "settings.addTopic": "Adicionar Tópico",
    "settings.topicName": "Nome do tópico",
    "settings.topicDifficulty": "Dificuldade",
    "settings.noTopics": "Nenhum tópico adicionado ainda.",
    "settings.personalities": "Personalidades",
    "settings.following": "Seguindo",
    "settings.follow": "Seguir",
    "settings.unfollow": "Deixar de seguir",
    "settings.preferences": "Preferências",
    "settings.postLength": "Tamanho do Post",
    "settings.short": "Curto",
    "settings.medium": "Médio",
    "settings.long": "Longo",
    "settings.language": "Idioma",
    "settings.about": "Sobre",
    "settings.version": "Versão",
    "settings.clearData": "Limpar Todos os Dados",
    "settings.clearDataConfirm": "Tem certeza? Isso vai apagar todos os posts, salvos e progresso.",
    "settings.saved": "Ajustes salvos!",
    "settings.active": "Ativo",
    "settings.inactive": "Inativo",

    // Weekly Recap
    "recap.title": "Resumo Semanal",
    "recap.generate": "Gerar Resumo",
    "recap.generating": "Gerando seu resumo...",
    "recap.postsThisWeek": "Posts Esta Semana",
    "recap.topicsStudied": "Tópicos Estudados",
    "recap.likes": "Curtidas",
    "recap.bookmarks": "Salvos",
    "recap.conceptsReviewed": "Conceitos Revisados",
    "recap.topicBreakdown": "Detalhamento por Tópico",
    "recap.progress": "Progresso",
    "recap.noActivity": "Sem atividade esta semana. Comece a ler posts para ver seu resumo!",
    "recap.summary": "Resumo por IA",

    // Difficulty
    "difficulty.1": "Iniciante",
    "difficulty.2": "Elementar",
    "difficulty.3": "Intermediário",
    "difficulty.4": "Avançado",
    "difficulty.5": "Especialista",

    // General
    "general.loading": "Carregando...",
    "general.error": "Algo deu errado",
    "general.retry": "Tentar novamente",
    "general.cancel": "Cancelar",
    "general.save": "Salvar",
    "general.delete": "Excluir",
    "general.confirm": "Confirmar",
  },
} as const;

export function t(key: TranslationKeys, language?: Language): string {
  const lang = language ?? useSettingsStore.getState().language;
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);

  return {
    t: (key: TranslationKeys) => t(key, language),
    language,
  };
}

export type { TranslationKeys };
