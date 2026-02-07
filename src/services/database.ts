import * as SQLite from "expo-sqlite";
import type {
  SettingRow,
  PersonalityRow,
  PostRow,
  ReplyRow,
  UserInteractionRow,
  TopicRow,
  SpacedRepetitionRow,
  InteractionType,
  PostType,
} from "@/types";

let db: SQLite.SQLiteDatabase | null = null;

// ============================================================
// Initialization
// ============================================================

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("why.db");
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personalities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT NOT NULL,
      teaching_style TEXT NOT NULL,
      avatar_emoji TEXT NOT NULL,
      is_followed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      personality_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty_level INTEGER NOT NULL DEFAULT 1,
      post_type TEXT NOT NULL DEFAULT 'standalone',
      thread_id TEXT,
      created_at TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      original_concept_id TEXT,
      FOREIGN KEY (personality_id) REFERENCES personalities(id)
    );

    CREATE TABLE IF NOT EXISTS replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      personality_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_user_question INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (personality_id) REFERENCES personalities(id)
    );

    CREATE TABLE IF NOT EXISTS user_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      value TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      initial_difficulty INTEGER DEFAULT 1,
      current_difficulty INTEGER DEFAULT 1,
      engagement_score REAL DEFAULT 0.0,
      post_count INTEGER DEFAULT 0,
      last_post_at TEXT
    );

    CREATE TABLE IF NOT EXISTS spaced_repetition_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      concept_summary TEXT NOT NULL,
      next_review_at TEXT NOT NULL,
      interval_days INTEGER DEFAULT 1,
      review_count INTEGER DEFAULT 0,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);
    CREATE INDEX IF NOT EXISTS idx_posts_personality ON posts(personality_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);
    CREATE INDEX IF NOT EXISTS idx_replies_post ON replies(post_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_post ON user_interactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_interactions(interaction_type);
    CREATE INDEX IF NOT EXISTS idx_spaced_next ON spaced_repetition_schedule(next_review_at);
  `);
}

// ============================================================
// Settings CRUD
// ============================================================

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SettingRow>(
    "SELECT value FROM settings WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SettingRow>(
    "SELECT key, value FROM settings"
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
}

// ============================================================
// Personalities CRUD
// ============================================================

export async function getPersonalities(): Promise<PersonalityRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<PersonalityRow>(
    "SELECT * FROM personalities ORDER BY name"
  );
}

export async function getPersonality(
  id: string
): Promise<PersonalityRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<PersonalityRow>(
    "SELECT * FROM personalities WHERE id = ?",
    [id]
  );
}

export async function upsertPersonality(p: PersonalityRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO personalities (id, name, bio, teaching_style, avatar_emoji, is_followed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [p.id, p.name, p.bio, p.teaching_style, p.avatar_emoji, p.is_followed]
  );
}

export async function toggleFollowPersonality(
  id: string,
  followed: boolean
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE personalities SET is_followed = ? WHERE id = ?",
    [followed ? 1 : 0, id]
  );
}

export async function getFollowedPersonalities(): Promise<PersonalityRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<PersonalityRow>(
    "SELECT * FROM personalities WHERE is_followed = 1"
  );
}

// ============================================================
// Posts CRUD
// ============================================================

export async function insertPost(post: PostRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO posts (id, personality_id, topic, content, difficulty_level, post_type, thread_id, created_at, is_read, original_concept_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.personality_id,
      post.topic,
      post.content,
      post.difficulty_level,
      post.post_type,
      post.thread_id,
      post.created_at,
      post.is_read,
      post.original_concept_id,
    ]
  );
}

export async function getPosts(
  limit: number = 20,
  offset: number = 0
): Promise<PostRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<PostRow>(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
}

export async function getPostById(id: string): Promise<PostRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<PostRow>(
    "SELECT * FROM posts WHERE id = ?",
    [id]
  );
}

export async function getPostsByThread(threadId: string): Promise<PostRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<PostRow>(
    "SELECT * FROM posts WHERE thread_id = ? ORDER BY created_at ASC",
    [threadId]
  );
}

export async function getPostsByTopic(
  topic: string,
  limit: number = 10
): Promise<PostRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<PostRow>(
    "SELECT * FROM posts WHERE topic = ? ORDER BY created_at DESC LIMIT ?",
    [topic, limit]
  );
}

export async function markPostRead(postId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE posts SET is_read = 1 WHERE id = ?",
    [postId]
  );
}

export async function getPostCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM posts"
  );
  return row?.count ?? 0;
}

// ============================================================
// Replies CRUD
// ============================================================

export async function insertReply(reply: ReplyRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO replies (id, post_id, personality_id, content, is_user_question, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reply.id,
      reply.post_id,
      reply.personality_id,
      reply.content,
      reply.is_user_question,
      reply.created_at,
    ]
  );
}

export async function getRepliesForPost(postId: string): Promise<ReplyRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<ReplyRow>(
    "SELECT * FROM replies WHERE post_id = ? ORDER BY created_at ASC",
    [postId]
  );
}

// ============================================================
// User Interactions CRUD
// ============================================================

export async function recordInteraction(
  postId: string,
  type: InteractionType,
  value?: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO user_interactions (post_id, interaction_type, value, created_at)
     VALUES (?, ?, ?, ?)`,
    [postId, type, value ?? null, new Date().toISOString()]
  );
}

export async function hasInteraction(
  postId: string,
  type: InteractionType
): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_interactions WHERE post_id = ? AND interaction_type = ?",
    [postId, type]
  );
  return (row?.count ?? 0) > 0;
}

export async function removeInteraction(
  postId: string,
  type: InteractionType
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "DELETE FROM user_interactions WHERE post_id = ? AND interaction_type = ?",
    [postId, type]
  );
}

export async function getBookmarkedPosts(): Promise<PostRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<PostRow>(
    `SELECT p.* FROM posts p
     INNER JOIN user_interactions ui ON p.id = ui.post_id
     WHERE ui.interaction_type = 'bookmark'
     ORDER BY ui.created_at DESC`
  );
}

export async function searchBookmarkedPosts(
  query: string
): Promise<PostRow[]> {
  const database = await getDatabase();
  const searchTerm = `%${query}%`;
  return database.getAllAsync<PostRow>(
    `SELECT p.* FROM posts p
     INNER JOIN user_interactions ui ON p.id = ui.post_id
     WHERE ui.interaction_type = 'bookmark'
       AND (p.content LIKE ? OR p.topic LIKE ?)
     ORDER BY ui.created_at DESC`,
    [searchTerm, searchTerm]
  );
}

export async function getLikedPostIds(): Promise<Set<string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ post_id: string }>(
    "SELECT DISTINCT post_id FROM user_interactions WHERE interaction_type = 'like'"
  );
  return new Set(rows.map((r) => r.post_id));
}

export async function getBookmarkedPostIds(): Promise<Set<string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ post_id: string }>(
    "SELECT DISTINCT post_id FROM user_interactions WHERE interaction_type = 'bookmark'"
  );
  return new Set(rows.map((r) => r.post_id));
}

export async function getReplyCountsForPosts(
  postIds: string[]
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const database = await getDatabase();
  const placeholders = postIds.map(() => "?").join(",");
  const rows = await database.getAllAsync<{
    post_id: string;
    count: number;
  }>(
    `SELECT post_id, COUNT(*) as count FROM replies WHERE post_id IN (${placeholders}) GROUP BY post_id`,
    postIds
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.post_id] = row.count;
  }
  return result;
}

// ============================================================
// Topics CRUD
// ============================================================

export async function getTopics(): Promise<TopicRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<TopicRow>(
    "SELECT * FROM topics ORDER BY name"
  );
}

export async function getActiveTopics(): Promise<TopicRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<TopicRow>(
    "SELECT * FROM topics WHERE is_active = 1 ORDER BY name"
  );
}

export async function upsertTopic(topic: TopicRow): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO topics (id, name, is_active, initial_difficulty, current_difficulty, engagement_score, post_count, last_post_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      topic.id,
      topic.name,
      topic.is_active,
      topic.initial_difficulty,
      topic.current_difficulty,
      topic.engagement_score,
      topic.post_count,
      topic.last_post_at,
    ]
  );
}

export async function setTopicActive(
  id: string,
  active: boolean
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE topics SET is_active = ? WHERE id = ?",
    [active ? 1 : 0, id]
  );
}

export async function updateTopicDifficulty(
  id: string,
  difficulty: number
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE topics SET current_difficulty = ? WHERE id = ?",
    [difficulty, id]
  );
}

export async function updateTopicEngagement(
  id: string,
  engagementDelta: number
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE topics SET engagement_score = MAX(0, engagement_score + ?) WHERE id = ?",
    [engagementDelta, id]
  );
}

export async function incrementTopicPostCount(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE topics SET post_count = post_count + 1, last_post_at = ? WHERE id = ?",
    [new Date().toISOString(), id]
  );
}

export async function deleteTopic(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM topics WHERE id = ?", [id]);
}

// ============================================================
// Spaced Repetition CRUD
// ============================================================

export async function insertSpacedRepetition(
  item: Omit<SpacedRepetitionRow, "id">
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO spaced_repetition_schedule (post_id, topic, concept_summary, next_review_at, interval_days, review_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      item.post_id,
      item.topic,
      item.concept_summary,
      item.next_review_at,
      item.interval_days,
      item.review_count,
    ]
  );
}

export async function getDueReviews(): Promise<SpacedRepetitionRow[]> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  return database.getAllAsync<SpacedRepetitionRow>(
    "SELECT * FROM spaced_repetition_schedule WHERE next_review_at <= ? ORDER BY next_review_at ASC",
    [now]
  );
}

export async function updateReviewSchedule(
  id: number,
  nextReviewAt: string,
  intervalDays: number,
  reviewCount: number
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE spaced_repetition_schedule SET next_review_at = ?, interval_days = ?, review_count = ? WHERE id = ?",
    [nextReviewAt, intervalDays, reviewCount, id]
  );
}

export async function deleteReviewSchedule(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "DELETE FROM spaced_repetition_schedule WHERE id = ?",
    [id]
  );
}

// ============================================================
// Weekly Stats helpers
// ============================================================

export async function getWeeklyInteractionCount(
  type: InteractionType
): Promise<number> {
  const database = await getDatabase();
  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_interactions WHERE interaction_type = ? AND created_at >= ?",
    [type, weekAgo]
  );
  return row?.count ?? 0;
}

export async function getWeeklyPostCount(): Promise<number> {
  const database = await getDatabase();
  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM posts WHERE created_at >= ?",
    [weekAgo]
  );
  return row?.count ?? 0;
}

export async function getWeeklyTopicBreakdown(): Promise<
  { topic: string; count: number }[]
> {
  const database = await getDatabase();
  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  return database.getAllAsync<{ topic: string; count: number }>(
    `SELECT topic, COUNT(*) as count FROM posts WHERE created_at >= ? GROUP BY topic ORDER BY count DESC`,
    [weekAgo]
  );
}

export async function getWeeklyReviewCount(): Promise<number> {
  const database = await getDatabase();
  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM posts WHERE post_type = 'spaced_review' AND created_at >= ?",
    [weekAgo]
  );
  return row?.count ?? 0;
}

// ============================================================
// Data cleanup
// ============================================================

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM spaced_repetition_schedule;
    DELETE FROM user_interactions;
    DELETE FROM replies;
    DELETE FROM posts;
    DELETE FROM topics;
    DELETE FROM settings;
  `);
}
