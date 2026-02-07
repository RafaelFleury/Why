import type { PostType, Language, PostLength, Personality } from "@/types";
import { POST_LENGTH_CHARS, DIFFICULTY_LABELS } from "@/utils/constants";

interface PromptContext {
  personality: Personality;
  topic: string;
  difficultyLevel: number;
  postLength: PostLength;
  language: Language;
  previousContext?: string;
  originalConcept?: string;
  question?: string;
  originalPost?: string;
}

function getLanguageInstruction(language: Language): string {
  return language === "pt-BR"
    ? "Responda em Português Brasileiro."
    : "Respond in English.";
}

function getDifficultyDescription(level: number, language: Language): string {
  return DIFFICULTY_LABELS[level]?.[language] ?? DIFFICULTY_LABELS[1][language];
}

function getLengthInstruction(postLength: PostLength, language: Language): string {
  const maxChars = POST_LENGTH_CHARS[postLength];
  if (language === "pt-BR") {
    return `Mantenha a resposta com no máximo ${maxChars} caracteres.`;
  }
  return `Keep your response under ${maxChars} characters.`;
}

export function buildPostPrompt(
  postType: PostType,
  context: PromptContext
): { system: string; user: string } {
  const {
    personality,
    topic,
    difficultyLevel,
    postLength,
    language,
    previousContext,
    originalConcept,
  } = context;

  const langInstruction = getLanguageInstruction(language);
  const diffDesc = getDifficultyDescription(difficultyLevel, language);
  const lengthInstruction = getLengthInstruction(postLength, language);

  const system = `${personality.systemPrompt}\n\n${langInstruction}\n${lengthInstruction}\nDifficulty level: ${diffDesc} (${difficultyLevel}/5).\nDo NOT include any meta-commentary about yourself or the format. Just teach naturally as this personality would.`;

  let user: string;

  switch (postType) {
    case "standalone":
      user =
        language === "pt-BR"
          ? `Ensine um conceito interessante sobre "${topic}" no nível ${diffDesc}. Seja direto e educativo.`
          : `Teach an interesting concept about "${topic}" at ${diffDesc} level. Be direct and educational.`;
      break;

    case "sequential":
      user =
        language === "pt-BR"
          ? `Continue ensinando sobre "${topic}" no nível ${diffDesc}. Contexto anterior:\n\n${previousContext ?? "Este é o início da série."}\n\nExpanda o tópico com o próximo conceito lógico.`
          : `Continue teaching about "${topic}" at ${diffDesc} level. Previous context:\n\n${previousContext ?? "This is the start of the series."}\n\nExpand with the next logical concept.`;
      break;

    case "quiz":
      user =
        language === "pt-BR"
          ? `Crie um desafio ou pergunta rápida sobre "${topic}" no nível ${diffDesc}. Inclua a pergunta e depois a resposta. Formato: primeiro a pergunta, depois "Resposta:" com a explicação.`
          : `Create a quick challenge or question about "${topic}" at ${diffDesc} level. Include the question then the answer. Format: question first, then "Answer:" with the explanation.`;
      break;

    case "deep_dive":
      user =
        language === "pt-BR"
          ? `Faça uma exploração aprofundada sobre "${topic}" no nível ${diffDesc}.${previousContext ? `\n\nPosts anteriores nesta thread:\n${previousContext}` : ""}\n\nAprofunde em um aspecto específico com detalhes e nuances.`
          : `Do a deep exploration of "${topic}" at ${diffDesc} level.${previousContext ? `\n\nPrevious posts in this thread:\n${previousContext}` : ""}\n\nDive deep into a specific aspect with detail and nuance.`;
      break;

    case "spaced_review":
      user =
        language === "pt-BR"
          ? `Reforce este conceito com uma explicação diferente e novos exemplos:\n\n"${originalConcept ?? topic}"\n\nUse uma abordagem diferente da original para ajudar na memorização.`
          : `Reinforce this concept with a different explanation and new examples:\n\n"${originalConcept ?? topic}"\n\nUse a different approach from the original to aid retention.`;
      break;

    default:
      user =
        language === "pt-BR"
          ? `Ensine algo sobre "${topic}" no nível ${diffDesc}.`
          : `Teach something about "${topic}" at ${diffDesc} level.`;
  }

  return { system, user };
}

export function buildReplyPrompt(context: {
  personality: Personality;
  originalPost: string;
  question: string;
  language: Language;
  postLength: PostLength;
}): { system: string; user: string } {
  const { personality, originalPost, question, language, postLength } = context;
  const langInstruction = getLanguageInstruction(language);
  const lengthInstruction = getLengthInstruction(postLength, language);

  const system = `${personality.systemPrompt}\n\n${langInstruction}\n${lengthInstruction}\nYou are replying in a discussion thread. Stay in character.`;

  const user =
    language === "pt-BR"
      ? `Post original:\n"${originalPost}"\n\nPergunta/comentário:\n"${question}"\n\nResponda como ${personality.name} responderia.`
      : `Original post:\n"${originalPost}"\n\nQuestion/comment:\n"${question}"\n\nRespond as ${personality.name} would.`;

  return { system, user };
}

export function buildDiscussionPrompt(context: {
  personality: Personality;
  originalPost: string;
  topic: string;
  language: Language;
  postLength: PostLength;
}): { system: string; user: string } {
  const { personality, originalPost, topic, language, postLength } = context;
  const langInstruction = getLanguageInstruction(language);
  const lengthInstruction = getLengthInstruction(postLength, language);

  const system = `${personality.systemPrompt}\n\n${langInstruction}\n${lengthInstruction}`;

  const user =
    language === "pt-BR"
      ? `Gere uma thread de discussão para este post sobre "${topic}":\n\n"${originalPost}"\n\nGere 2-3 respostas naturais: uma pergunta de um aluno curioso, sua resposta detalhada, e opcionalmente um esclarecimento de equívoco comum. Formate cada resposta separada por "---".`
      : `Generate a discussion thread for this post about "${topic}":\n\n"${originalPost}"\n\nGenerate 2-3 natural replies: a question from a curious student, your detailed answer, and optionally a common misconception clarification. Format each reply separated by "---".`;

  return { system, user };
}

export function buildRecapPrompt(context: {
  language: Language;
  topicsStudied: string[];
  totalPosts: number;
  totalLikes: number;
  conceptsReviewed: number;
  topicBreakdown: { topic: string; count: number }[];
}): { system: string; user: string } {
  const { language, topicsStudied, totalPosts, totalLikes, conceptsReviewed, topicBreakdown } = context;

  const system =
    language === "pt-BR"
      ? `Você é um assistente educacional que cria resumos semanais motivacionais e informativos. Responda em Português Brasileiro. Seja encorajador e específico.`
      : `You are an educational assistant creating motivational and informative weekly recaps. Respond in English. Be encouraging and specific.`;

  const breakdown = topicBreakdown
    .map((t) => `- ${t.topic}: ${t.count} posts`)
    .join("\n");

  const user =
    language === "pt-BR"
      ? `Crie um resumo semanal de aprendizado baseado nestas estatísticas:\n\n- Tópicos estudados: ${topicsStudied.join(", ")}\n- Total de posts lidos: ${totalPosts}\n- Curtidas: ${totalLikes}\n- Conceitos revisados: ${conceptsReviewed}\n\nDetalhamento:\n${breakdown}\n\nFaça um resumo motivacional e destaque o progresso.`
      : `Create a weekly learning recap based on these stats:\n\n- Topics studied: ${topicsStudied.join(", ")}\n- Total posts read: ${totalPosts}\n- Likes: ${totalLikes}\n- Concepts reviewed: ${conceptsReviewed}\n\nBreakdown:\n${breakdown}\n\nMake it motivational and highlight progress.`;

  return { system, user };
}

export function buildConceptExtractionPrompt(
  postContent: string,
  language: Language
): { system: string; user: string } {
  const system =
    language === "pt-BR"
      ? `Você é um assistente que extrai o conceito principal de posts educacionais. Responda com apenas uma frase curta descrevendo o conceito central.`
      : `You are an assistant that extracts the core concept from educational posts. Reply with just one short sentence describing the central concept.`;

  const user =
    language === "pt-BR"
      ? `Extraia o conceito principal deste post educacional:\n\n"${postContent}"`
      : `Extract the core concept from this educational post:\n\n"${postContent}"`;

  return { system, user };
}
