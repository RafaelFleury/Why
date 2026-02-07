please search about the OpenAI sdk and Openrouter sdk to see how they actually work. also create openai_sdk.md and openrouter_sdk.md teaching how to use the apis.

I want to create a new app in this repository. See bellow for all the details. I added specific suggestions for the database schema and directory organization. You dont necessarily have to follow them. Please make a good plan adressing everything to create the app. Follow the stack i asked for. The api keys and compatible endpoints must be setted on the settings page of the app and saved on the sqlite database, no .env. Keep a .env only for development to overwrite the settings so its easier for me to test.

# **Educational Feed App - Complete Plan**

---

## **Concept**
A Twitter-like educational app where AI personalities teach through posts and replies. Content is generated on-demand, adapts to user engagement, and uses spaced repetition to reinforce learning.

---

## **Tech Stack**

**Frontend:**
- React Native + Expo
- NativeWind (Tailwind for React Native)
- React Navigation (screen navigation)

**State Management:**
- Zustand or Redux Toolkit (TBD)

**Database:**
- expo-sqlite (local SQLite)

**API:**
- OpenRouter SDK (OpenAI-compatible) + OpenRouter SDK

**Storage:**
- AsyncStorage (user preferences)

**Languages:**
- Brazilian Portuguese + English UI

**Platforms:**
- Mobile (iOS/Android via Expo Go for dev, APK for production)
- Web (development preview via `npx expo start --web`)

---

## **Core Features**

### **1. Feed & Content Generation**
- Posts generated on-demand as user scrolls
- Posts stored in SQLite after generation
- Adaptive algorithm:
  - Tracks engagement (likes, time spent, interactions)
  - Generates more of what user engages with (e.g., more technical posts)
- Topic distribution:
  - Initially 1 post per N active topics (N = number of active topics)
  - Frequency increases for highly engaged topics
- **Spaced repetition**: Background system generates new posts about old topics with different wording (same or different personality) to reinforce learning
- **Deep dive threads**: Connected series of posts from one personality exploring a topic in depth
- Post length: Twitter-style default (configurable in settings)

### **2. Personality System**
- Multiple predefined AI "accounts" with distinct teaching styles
- Each personality has consistent voice/characteristics
- Personalities rotate across different topics based on user preferences
- **Users can follow specific personalities** they like
- Personalities maintain their style across all posts and replies

### **3. Learning Progression**
- Tracks user interactions (reads, likes, bookmarks, questions asked)
- Mix of:
  - Standalone posts (independent concepts)
  - Sequential posts (building on previous content)
- User sets initial difficulty per topic
- System adapts difficulty based on:
  - Engagement patterns
  - **"Too easy/too hard" feedback buttons** on each post
- Occasional quiz-style posts or challenges
- **Visual progress tracking per topic** (beginner → intermediate → advanced)

### **4. Interaction System**
- **AI-generated reply threads** under each post:
  - Questions from simulated users
  - Answers from original personality
  - Exploration of misconceptions
  - Alternative explanations/approaches
- **User can ask their own questions** and get AI replies in the personality's voice

### **5. User Features**
- **Bookmark posts** for later review
- **Search through bookmarked posts**
- Infinite scroll feed
- **Weekly recap tab**: User-initiated view showing:
  - What they learned that week
  - Most engaged topics
  - Progress made
  - Acts as manual spaced repetition reinforcement

### **6. Configuration Screen**
- Select active topics
  - Granularity varies (broad like "Python" or specific like "list comprehensions")
- Set initial difficulty level per topic
- Choose/follow preferred personalities
- Adjust post length preferences
- Language selection (PT-BR or English)

### **7. UI/UX**
- **Dark mode only**
- Smooth scrolling feed (Twitter-like)
- Clear visual hierarchy
- Brazilian Portuguese and English support

---

## **Database Schema (SQLite)** SUGGESTION

### **Tables:**

**posts**
- id (primary key)
- personality_id (foreign key)
- topic
- content
- difficulty_level
- post_type (standalone/sequential/quiz/deep_dive)
- thread_id (for deep dives, null otherwise)
- created_at
- is_spaced_repetition (boolean)
- original_concept_id (for spaced repetition posts)

**personalities**
- id (primary key)
- name
- bio
- teaching_style
- avatar_url

**replies**
- id (primary key)
- post_id (foreign key)
- personality_id (foreign key, who replied)
- content
- is_user_generated (boolean)
- created_at

**user_interactions**
- id (primary key)
- post_id (foreign key)
- interaction_type (read/like/bookmark/too_easy/too_hard/question_asked)
- timestamp

**bookmarks**
- id (primary key)
- post_id (foreign key)
- created_at

**user_progress**
- id (primary key)
- topic
- difficulty_level
- engagement_score
- last_updated

**user_preferences**
- id (primary key)
- active_topics (JSON array)
- initial_difficulties (JSON object)
- followed_personalities (JSON array)
- post_length_preference
- language

**spaced_repetition_schedule**
- id (primary key)
- concept_id
- topic
- next_review_date
- review_count

---

## **Project Structure** SUGGESTION

```
/src
  /components
    Post.jsx
    Reply.jsx
    PersonalityAvatar.jsx
    ProgressBar.jsx
    FeedbackButtons.jsx
    SearchBar.jsx
  /screens
    FeedScreen.jsx
    BookmarksScreen.jsx
    SettingsScreen.jsx
    WeeklyRecapScreen.jsx
  /services
    database.js          # SQLite operations
    openrouter.js        # LLM API calls
    spacedRepetition.js  # Spaced repetition algorithm
    feedAlgorithm.js     # Content distribution logic
  /utils
    personalities.js     # Personality definitions
    i18n.js             # PT-BR/EN translations
  /navigation
    AppNavigator.jsx    # Bottom tabs navigation
```

---

## **Key Algorithms**

### **Feed Algorithm:**
1. Calculate topic distribution based on active topics
2. Check for spaced repetition posts due
3. Weight topics by engagement score
4. Generate next post from appropriate personality
5. Store and display

### **Spaced Repetition:**
1. Track concepts user has learned
2. Schedule review posts at intervals (1 day, 3 days, 1 week, 2 weeks, 1 month)
3. Generate new posts with different wording about old concepts
4. Reset schedule if user marks "too hard"

### **Difficulty Adaptation:**
1. Track "too easy/too hard" feedback
2. Monitor engagement metrics (time spent, questions asked)
3. Adjust difficulty_level in user_progress table
4. Generate future posts at adjusted level

---