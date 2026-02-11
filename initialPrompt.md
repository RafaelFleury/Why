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
- **Markdown rendering library** (react-native-markdown-display or similar)

**State Management:**
- Zustand or Redux Toolkit (TBD)

**Database:**
- expo-sqlite (local SQLite)

**API:**
- OpenRouter SDK (OpenAI-compatible)

**Storage:**
- AsyncStorage (user preferences)

**Languages:**
- Brazilian Portuguese + English UI

**Type Safety:**
- **TypeScript** (required for all code)

**Platforms:**
- Mobile (iOS/Android via Expo Go for dev, APK for production)
- Web (development preview via `npx expo start --web`)

---

## **Core Features**

### **1. Feed & Content Generation**
- **UI must closely replicate Twitter/X mobile and web design**
- **Posts support markdown formatting** (code blocks, bold, italic, lists, links)
- Posts generated on-demand as user scrolls
- Posts stored in SQLite after generation
- **Feed does NOT generate content endlessly**:
  - Max number of posts per generation batch (configurable in settings)
  - When user reaches end of feed, a **"Load More" button** appears
  - Clicking button generates next batch of posts
- **Backend must handle API request constraints**:
  - Default: Parallel requests for faster feed generation
  - Fallback: Sequential requests (one at a time) when parallel fails
  - Error handling for rate limits and API constraints
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
- Infinite scroll feed with "Load More" button at bottom
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
- **Set max posts per generation batch** (how many posts load before "Load More" button appears)
- Language selection (PT-BR or English)

### **7. UI/UX**
- **Dark mode only**
- **Design must closely replicate Twitter/X mobile and web interface**
- Smooth scrolling feed (Twitter-like)
- Clear visual hierarchy
- Brazilian Portuguese and English support

---

## **Database Schema (SQLite)**

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
- max_posts_per_batch (integer)
- language

**spaced_repetition_schedule**
- id (primary key)
- concept_id
- topic
- next_review_date
- review_count

---

## **Project Structure**

**Note:** All files must use TypeScript (.tsx/.ts extensions)

```
/src
  /components
    Post.tsx
    Reply.tsx
    PersonalityAvatar.tsx
    ProgressBar.tsx
    FeedbackButtons.tsx
    SearchBar.tsx
    LoadMoreButton.tsx
    MarkdownRenderer.tsx  # Markdown rendering component
  /screens
    FeedScreen.tsx
    BookmarksScreen.tsx
    SettingsScreen.tsx
    WeeklyRecapScreen.tsx
  /services
    database.ts          # SQLite operations
    openrouter.ts        # LLM API calls with parallel/sequential fallback
    spacedRepetition.ts  # Spaced repetition algorithm
    feedAlgorithm.ts     # Content distribution logic
  /utils
    personalities.ts     # Personality definitions
    i18n.ts             # PT-BR/EN translations
  /types
    index.ts            # TypeScript type definitions
  /navigation
    AppNavigator.tsx    # Bottom tabs navigation
```

---

## **Key Algorithms**

### **Feed Algorithm:**
1. Calculate topic distribution based on active topics
2. Check for spaced repetition posts due
3. Weight topics by engagement score
4. Generate next batch (up to max_posts_per_batch)
5. Attempt parallel generation, fallback to sequential on error
6. Store and display
7. Show "Load More" button at end

### **API Request Handler:**
1. Attempt parallel requests for batch generation
2. On error (rate limit, connection issue):
   - Log error
   - Switch to sequential mode
   - Retry failed requests one at a time
3. Track which mode is working and prefer it

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

## **Testing Strategy**

### **Testing Framework:**
- **Jest** for unit and integration tests
- **React Native Testing Library** for component tests
- **@testing-library/react-hooks** for custom hooks
- **MSW (Mock Service Worker)** for API mocking
- **Jest coverage reports** (target: 80%+ coverage)

### **Test Organization:**

```
/__tests__
  /components
    Post.test.tsx
    Reply.test.tsx
    PersonalityAvatar.test.tsx
    ProgressBar.test.tsx
    FeedbackButtons.test.tsx
    SearchBar.test.tsx
    LoadMoreButton.test.tsx
    MarkdownRenderer.test.tsx
  /screens
    FeedScreen.test.tsx
    BookmarksScreen.test.tsx
    SettingsScreen.test.tsx
    WeeklyRecapScreen.test.tsx
  /services
    database.test.ts
    openrouter.test.ts
    spacedRepetition.test.ts
    feedAlgorithm.test.ts
  /utils
    personalities.test.ts
    i18n.test.ts
  /integration
    feedGeneration.integration.test.ts
    userInteraction.integration.test.ts
    spacedRepetition.integration.test.ts
  /e2e
    feedFlow.e2e.test.ts
    bookmarkFlow.e2e.test.ts
    settingsFlow.e2e.test.ts
```

---

### **Unit Tests - Components**

#### **Post.test.tsx**
- ✓ Renders post content with markdown formatting
- ✓ Displays personality avatar and name
- ✓ Shows difficulty level indicator
- ✓ Renders feedback buttons (too easy/too hard)
- ✓ Handles like button click
- ✓ Handles bookmark button click
- ✓ Expands/collapses reply thread
- ✓ Shows post timestamp in user's language
- ✓ Displays post type badge (standalone/sequential/quiz/deep_dive)
- ✓ Handles long content truncation
- ✓ Applies correct styling in dark mode
- ✓ Accessibility: proper ARIA labels and roles

#### **Reply.test.tsx**
- ✓ Renders reply content with markdown
- ✓ Shows replying personality avatar
- ✓ Distinguishes user-generated vs AI-generated replies
- ✓ Handles nested reply indentation
- ✓ Displays timestamp
- ✓ Shows "typing" indicator for loading replies
- ✓ Accessibility: proper reply threading

#### **PersonalityAvatar.test.tsx**
- ✓ Renders avatar image correctly
- ✓ Shows fallback for missing avatar
- ✓ Displays personality name on press
- ✓ Handles different avatar sizes (small/medium/large)
- ✓ Shows "followed" indicator badge
- ✓ Accessibility: image alt text

#### **ProgressBar.test.tsx**
- ✓ Renders progress indicator for topic
- ✓ Shows correct percentage (0-100%)
- ✓ Displays difficulty level labels (beginner/intermediate/advanced)
- ✓ Animates progress changes
- ✓ Shows multiple topics side by side
- ✓ Handles empty state (no progress yet)

#### **FeedbackButtons.test.tsx**
- ✓ Renders "Too Easy" and "Too Hard" buttons
- ✓ Calls callback with correct feedback type
- ✓ Disables buttons after feedback given
- ✓ Shows visual confirmation after press
- ✓ Handles rapid clicks (debouncing)
- ✓ Accessibility: button labels

#### **SearchBar.test.tsx**
- ✓ Renders search input
- ✓ Calls onSearch callback with debounced input
- ✓ Shows clear button when text entered
- ✓ Filters bookmarked posts by keywords
- ✓ Highlights matching text in results
- ✓ Handles empty search results
- ✓ Accessibility: keyboard navigation

#### **LoadMoreButton.test.tsx**
- ✓ Renders button at feed end
- ✓ Shows loading spinner when pressed
- ✓ Disables button during loading
- ✓ Calls onLoadMore callback
- ✓ Displays post count to load
- ✓ Handles loading errors with retry
- ✓ Accessibility: loading state announcements

#### **MarkdownRenderer.test.tsx**
- ✓ Renders plain text correctly
- ✓ Formats bold text (**text**)
- ✓ Formats italic text (*text*)
- ✓ Renders code blocks with syntax highlighting
- ✓ Renders inline code (`code`)
- ✓ Formats lists (ordered and unordered)
- ✓ Renders links as clickable
- ✓ Handles malformed markdown gracefully
- ✓ Applies dark mode styling
- ✓ Limits nested depth for security

---

### **Unit Tests - Screens**

#### **FeedScreen.test.tsx**
- ✓ Renders feed on mount
- ✓ Shows loading indicator on initial load
- ✓ Displays posts in correct order (newest first)
- ✓ Triggers post generation on scroll to bottom
- ✓ Shows "Load More" button when batch complete
- ✓ Loads next batch on button press
- ✓ Handles empty feed state (first launch)
- ✓ Persists scroll position on navigation away
- ✓ Pulls to refresh feed
- ✓ Handles API errors gracefully
- ✓ Shows error message with retry option
- ✓ Tracks time spent on each post for engagement
- ✓ Opens reply thread on post tap
- ✓ Navigation to bookmarks/settings/recap

#### **BookmarksScreen.test.tsx**
- ✓ Renders all bookmarked posts
- ✓ Shows empty state with message
- ✓ Search bar filters bookmarks
- ✓ Removes bookmark on un-bookmark
- ✓ Sorts by date (newest first)
- ✓ Groups by topic (optional view)
- ✓ Navigates to full post on tap
- ✓ Handles deletion of bookmarked posts
- ✓ Shows bookmark count

#### **SettingsScreen.test.tsx**
- ✓ Renders all settings sections
- ✓ Displays active topics list
- ✓ Allows adding/removing topics
- ✓ Shows difficulty slider per topic
- ✓ Saves difficulty changes to database
- ✓ Displays personality follow list
- ✓ Toggles personality following
- ✓ Shows post length preference selector
- ✓ Updates max posts per batch setting
- ✓ Language toggle (PT-BR/EN)
- ✓ API key and endpoint configuration
- ✓ Validates API key format
- ✓ Tests API connection on save
- ✓ Shows success/error messages
- ✓ Resets settings to defaults
- ✓ Persists changes to database

#### **WeeklyRecapScreen.test.tsx**
- ✓ Calculates stats for past 7 days
- ✓ Shows total posts read
- ✓ Displays most engaged topics
- ✓ Shows progress made per topic
- ✓ Lists bookmarked posts from week
- ✓ Shows engagement heatmap/graph
- ✓ Handles weeks with no activity
- ✓ Allows navigating to previous weeks
- ✓ Shares recap (export functionality)

---

### **Unit Tests - Services**

#### **database.test.ts**
**Setup/Teardown:**
- ✓ Initializes SQLite database
- ✓ Creates all tables with correct schema
- ✓ Handles database migration (version upgrades)
- ✓ Cleans up test database after each test

**Posts:**
- ✓ Inserts post with all fields
- ✓ Retrieves post by ID
- ✓ Retrieves posts by topic
- ✓ Retrieves posts by personality
- ✓ Retrieves posts by thread_id (deep dive)
- ✓ Updates post fields
- ✓ Deletes post and cascades to replies
- ✓ Queries posts by date range
- ✓ Handles null/optional fields correctly

**Personalities:**
- ✓ Inserts personality
- ✓ Retrieves all personalities
- ✓ Retrieves personality by ID
- ✓ Updates personality bio/style
- ✓ Checks if personality is followed

**Replies:**
- ✓ Inserts reply for post
- ✓ Retrieves all replies for post
- ✓ Distinguishes user vs AI replies
- ✓ Orders replies by timestamp
- ✓ Deletes replies when post deleted

**User Interactions:**
- ✓ Records read interaction
- ✓ Records like interaction
- ✓ Records bookmark interaction
- ✓ Records feedback (too easy/hard)
- ✓ Records question asked
- ✓ Retrieves interactions by type
- ✓ Calculates engagement score for post
- ✓ Queries interactions by date range

**Bookmarks:**
- ✓ Creates bookmark
- ✓ Retrieves all bookmarks with post data
- ✓ Deletes bookmark
- ✓ Checks if post is bookmarked
- ✓ Searches bookmarks by content

**User Progress:**
- ✓ Initializes progress for new topic
- ✓ Updates difficulty level
- ✓ Updates engagement score
- ✓ Retrieves progress for topic
- ✓ Retrieves all progress records
- ✓ Calculates overall progress percentage

**User Preferences:**
- ✓ Saves active topics (JSON array)
- ✓ Saves initial difficulties (JSON object)
- ✓ Saves followed personalities (JSON array)
- ✓ Saves post length preference
- ✓ Saves max posts per batch
- ✓ Saves language preference
- ✓ Retrieves all preferences
- ✓ Updates individual preference fields
- ✓ Handles missing preferences (defaults)

**Spaced Repetition Schedule:**
- ✓ Creates schedule for concept
- ✓ Updates next review date
- ✓ Increments review count
- ✓ Retrieves due reviews
- ✓ Resets schedule on "too hard" feedback
- ✓ Deletes old schedules

**Performance:**
- ✓ Batch inserts (100+ posts) complete < 1s
- ✓ Complex queries with JOINs < 100ms
- ✓ Database size doesn't exceed 50MB with 10k posts

---

#### **openrouter.test.ts**
**Configuration:**
- ✓ Loads API key from settings database
- ✓ Falls back to .env for development
- ✓ Validates API key format
- ✓ Sets correct endpoint URL
- ✓ Handles missing configuration gracefully

**Single Request:**
- ✓ Generates post with correct prompt structure
- ✓ Includes personality context in prompt
- ✓ Includes topic and difficulty in prompt
- ✓ Parses markdown response correctly
- ✓ Handles API errors (rate limit, timeout)
- ✓ Retries failed requests (max 3 attempts)
- ✓ Returns error message on total failure

**Parallel Requests:**
- ✓ Sends multiple requests simultaneously
- ✓ Returns all successful responses
- ✓ Handles partial failures (some succeed, some fail)
- ✓ Catches rate limit errors
- ✓ Falls back to sequential on parallel failure

**Sequential Fallback:**
- ✓ Switches to sequential mode on parallel error
- ✓ Processes requests one at a time
- ✓ Logs mode switch for debugging
- ✓ Respects rate limits (delay between requests)
- ✓ Returns all responses in order

**Reply Generation:**
- ✓ Generates reply in personality's voice
- ✓ Includes original post context in prompt
- ✓ Generates simulated user questions
- ✓ Generates misconception explorations
- ✓ Handles reply to user-generated questions

**Prompt Engineering:**
- ✓ Constructs system prompt with personality
- ✓ Includes topic constraints
- ✓ Sets difficulty level instructions
- ✓ Requests markdown formatting
- ✓ Limits response length (Twitter-style)
- ✓ Includes language preference (PT-BR/EN)

**Mocking:**
- ✓ Uses MSW to mock OpenRouter API
- ✓ Simulates various response types
- ✓ Simulates rate limit errors
- ✓ Simulates network timeouts
- ✓ Simulates malformed responses

---

#### **spacedRepetition.test.ts**
**Scheduling Algorithm:**
- ✓ Calculates initial review date (1 day)
- ✓ Increases interval on successful review (1→3→7→14→30 days)
- ✓ Resets interval on "too hard" feedback
- ✓ Handles timezone differences correctly
- ✓ Prevents scheduling same concept multiple times

**Review Detection:**
- ✓ Identifies concepts due for review
- ✓ Prioritizes overdue reviews
- ✓ Limits reviews per day (avoid overwhelming)
- ✓ Mixes reviews with new content

**Concept Tracking:**
- ✓ Extracts concepts from post content
- ✓ Groups similar concepts together
- ✓ Tracks which personality taught concept
- ✓ Stores original post reference

**Review Post Generation:**
- ✓ Requests new wording for same concept
- ✓ Can use different personality
- ✓ Maintains same difficulty level
- ✓ Links to original post
- ✓ Marks as spaced repetition post

**Edge Cases:**
- ✓ Handles user with no learned concepts
- ✓ Handles all concepts recently reviewed
- ✓ Handles deleted original posts
- ✓ Handles changed user difficulty level

---

#### **feedAlgorithm.test.ts**
**Topic Distribution:**
- ✓ Generates 1 post per active topic initially
- ✓ Adjusts frequency based on engagement scores
- ✓ Prioritizes highly engaged topics
- ✓ Includes low-engagement topics occasionally
- ✓ Handles single active topic
- ✓ Handles 10+ active topics

**Post Type Selection:**
- ✓ Generates standalone posts by default
- ✓ Creates sequential posts for building concepts
- ✓ Generates quiz posts occasionally (10% chance)
- ✓ Creates deep dive threads for complex topics
- ✓ Balances post type distribution

**Difficulty Adaptation:**
- ✓ Uses user's initial difficulty setting
- ✓ Increases difficulty after positive engagement
- ✓ Decreases difficulty after "too hard" feedback
- ✓ Caps difficulty at user's max level
- ✓ Prevents difficulty from dropping too low

**Personality Rotation:**
- ✓ Rotates through all followed personalities
- ✓ Assigns personalities to topics randomly
- ✓ Allows same personality for deep dive threads
- ✓ Respects user's followed list
- ✓ Falls back to all personalities if none followed

**Batch Generation:**
- ✓ Respects max_posts_per_batch setting
- ✓ Generates exact number requested
- ✓ Includes spaced repetition posts in batch
- ✓ Balances new content vs reviews
- ✓ Prevents duplicate posts in same batch

**Spaced Repetition Integration:**
- ✓ Checks for due reviews before generating
- ✓ Includes 20-30% reviews in batch
- ✓ Prioritizes overdue reviews
- ✓ Skips reviews if none due

**Engagement Scoring:**
- ✓ Calculates score from multiple interaction types
- ✓ Weights: read (1), like (3), bookmark (5), question (10)
- ✓ Normalizes scores across topics
- ✓ Decays old scores over time
- ✓ Handles topics with no interactions yet

**Edge Cases:**
- ✓ Handles no active topics (shows onboarding)
- ✓ Handles API failures during batch generation
- ✓ Handles partial batch generation (some succeed)
- ✓ Handles user with no interaction history
- ✓ Handles empty database (first launch)

---

### **Unit Tests - Utils**

#### **personalities.test.ts**
- ✓ Returns all predefined personalities
- ✓ Each personality has required fields (id, name, bio, style, avatar)
- ✓ Retrieves personality by ID
- ✓ Returns undefined for invalid ID
- ✓ Validates teaching style format
- ✓ Ensures unique personality IDs
- ✓ Checks avatar URLs are valid
- ✓ Personalities have distinct characteristics

**Example Personalities to Test:**
- ✓ "Code Sensei" - Patient, detailed technical explanations
- ✓ "Startup Guru" - Fast-paced, practical, startup-focused
- ✓ "Prof. Theory" - Academic, research-backed, formal
- ✓ "Debug Duck" - Friendly, rubber duck debugging style
- ✓ "Hacker Collective" - Security-focused, ethical hacking

#### **i18n.test.ts**
**Translation Loading:**
- ✓ Loads PT-BR translations
- ✓ Loads EN translations
- ✓ Falls back to EN if key missing in PT-BR
- ✓ Handles missing translation files

**Key Coverage:**
- ✓ All UI strings have translations
- ✓ No hardcoded strings in components
- ✓ Error messages translated
- ✓ Button labels translated
- ✓ Screen titles translated

**Dynamic Translations:**
- ✓ Supports string interpolation (e.g., "Hello, {name}")
- ✓ Handles pluralization rules
- ✓ Formats dates in user's language
- ✓ Formats numbers in user's language

**Language Switching:**
- ✓ Changes language on user preference update
- ✓ Reloads screens with new translations
- ✓ Persists language choice
- ✓ Uses device language as default

---

### **Integration Tests**

#### **feedGeneration.integration.test.ts**
**Full Feed Flow:**
- ✓ User opens app with no posts
- ✓ System generates initial batch based on active topics
- ✓ Posts saved to database
- ✓ Feed renders with posts
- ✓ User scrolls to bottom
- ✓ "Load More" button appears
- ✓ User clicks button
- ✓ Next batch generated and appended
- ✓ User can continue scrolling

**API Integration:**
- ✓ Parallel request mode generates batch successfully
- ✓ On parallel failure, switches to sequential
- ✓ Sequential mode completes batch
- ✓ Error handling shows user-friendly message
- ✓ Retry mechanism works after network recovery

**Spaced Repetition Integration:**
- ✓ User interacts with posts over multiple days
- ✓ System schedules reviews
- ✓ Reviews appear in feed at correct intervals
- ✓ Review posts marked visually
- ✓ Feedback on reviews updates schedule

---

#### **userInteraction.integration.test.ts**
**Like Flow:**
- ✓ User likes post
- ✓ Like recorded in database
- ✓ Engagement score updated
- ✓ Topic gets higher priority in future

**Bookmark Flow:**
- ✓ User bookmarks post
- ✓ Bookmark saved to database
- ✓ Post appears in Bookmarks screen
- ✓ User searches bookmarks
- ✓ User removes bookmark

**Feedback Flow:**
- ✓ User marks post "too easy"
- ✓ Difficulty increased for topic
- ✓ Future posts generated at higher difficulty
- ✓ User marks post "too hard"
- ✓ Difficulty decreased for topic

**Question Flow:**
- ✓ User asks question on post
- ✓ AI generates reply in personality's voice
- ✓ Reply appears in thread
- ✓ Interaction tracked for engagement

---

#### **spacedRepetition.integration.test.ts**
**Full Spaced Repetition Cycle:**
- ✓ User reads post about "Python list comprehensions"
- ✓ Concept tracked in system
- ✓ Review scheduled for 1 day later
- ✓ After 1 day, review post generated
- ✓ User engages with review
- ✓ Next review scheduled for 3 days later
- ✓ Pattern continues (7, 14, 30 days)
- ✓ User marks review "too hard"
- ✓ Schedule resets to 1 day
- ✓ Difficulty adjusted downward

---

### **E2E Tests**

#### **feedFlow.e2e.test.ts**
- ✓ Complete user journey from app launch
- ✓ First launch onboarding (select topics)
- ✓ Initial feed generation
- ✓ Scrolling and loading more posts
- ✓ Liking and bookmarking posts
- ✓ Opening reply threads
- ✓ Asking questions and receiving replies
- ✓ Providing difficulty feedback
- ✓ Navigating between screens

#### **bookmarkFlow.e2e.test.ts**
- ✓ User bookmarks multiple posts
- ✓ Navigates to Bookmarks screen
- ✓ Searches bookmarks by keyword
- ✓ Opens bookmarked post
- ✓ Removes bookmark
- ✓ Bookmark disappears from list

#### **settingsFlow.e2e.test.ts**
- ✓ User opens Settings screen
- ✓ Adds new active topic
- ✓ Adjusts difficulty slider
- ✓ Follows/unfollows personalities
- ✓ Changes language (PT-BR ↔ EN)
- ✓ Updates API key and endpoint
- ✓ Tests API connection
- ✓ Saves settings
- ✓ Returns to feed with updated settings
- ✓ New posts reflect changes

---

### **Performance Tests**

#### **Database Performance:**
- ✓ 10,000 posts inserted < 5 seconds
- ✓ Query 100 posts with JOINs < 100ms
- ✓ Search across 10,000 posts < 200ms
- ✓ Database size manageable (< 50MB for 10k posts)

#### **Feed Rendering:**
- ✓ Initial render 50 posts < 1 second
- ✓ Scroll performance 60 FPS
- ✓ Load More button adds posts < 500ms (UI update)
- ✓ No memory leaks after 1000+ posts generated

#### **API Performance:**
- ✓ Single post generation < 3 seconds (API dependent)
- ✓ Parallel batch (10 posts) < 5 seconds
- ✓ Sequential batch (10 posts) < 30 seconds
- ✓ Timeout handling after 10 seconds per request

---

### **Accessibility Tests**

#### **Screen Reader Support:**
- ✓ All buttons have accessible labels
- ✓ Posts have semantic structure
- ✓ Navigation announces screen changes
- ✓ Interactive elements focusable
- ✓ Loading states announced

#### **Keyboard Navigation:**
- ✓ Tab order is logical
- ✓ All interactive elements keyboard accessible
- ✓ Search bar supports keyboard input
- ✓ Settings navigable by keyboard

#### **Color Contrast:**
- ✓ Text contrast ratio ≥ 4.5:1 (WCAG AA)
- ✓ Dark mode meets accessibility standards
- ✓ Interactive elements have sufficient contrast

---

### **Error Handling Tests**

#### **Network Errors:**
- ✓ Handles offline mode gracefully
- ✓ Shows cached content when offline
- ✓ Queues actions for when online
- ✓ Displays error message with retry
- ✓ Recovers automatically when connection restored

#### **API Errors:**
- ✓ Rate limit errors show appropriate message
- ✓ Invalid API key detected and reported
- ✓ Timeout errors handled with retry
- ✓ Malformed responses don't crash app
- ✓ Partial batch generation handled gracefully

#### **Database Errors:**
- ✓ Handles database corruption
- ✓ Migrates database on schema updates
- ✓ Handles full disk gracefully
- ✓ Transaction rollback on errors

#### **Input Validation:**
- ✓ API key format validated
- ✓ Empty topic names rejected
- ✓ Invalid difficulty values rejected
- ✓ Malicious markdown sanitized
- ✓ SQL injection prevented (parameterized queries)

---

### **Security Tests**

#### **Data Protection:**
- ✓ API keys encrypted in database
- ✓ No sensitive data in logs
- ✓ User data isolated (no leakage between users)
- ✓ Database file permissions correct

#### **Input Sanitization:**
- ✓ Markdown input sanitized (no XSS)
- ✓ SQL parameterization prevents injection
- ✓ API responses validated before storage
- ✓ User-generated content sanitized

#### **API Security:**
- ✓ API key not exposed in client code
- ✓ HTTPS used for all API calls
- ✓ Certificate validation enabled
- ✓ Request timeout prevents hanging

---

### **CI/CD Integration**

#### **Automated Testing:**
- ✓ All tests run on every commit (pre-commit hook)
- ✓ Unit tests required to pass for PR merge
- ✓ Coverage reports generated automatically
- ✓ E2E tests run nightly
- ✓ Performance regression tests on main branch

#### **Test Scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/(components|screens|services|utils)",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "jest --testPathPattern=__tests__/e2e",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

#### **Coverage Thresholds:**
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

---

### **Testing Best Practices**

1. **AAA Pattern**: Arrange, Act, Assert in all tests
2. **DRY**: Use test utilities and factories for common setups
3. **Isolation**: Each test independent and can run alone
4. **Descriptive Names**: Test names clearly state what they test
5. **Fast**: Unit tests complete in < 10 seconds total
6. **Deterministic**: Tests produce same result every time
7. **Minimal Mocking**: Mock only external dependencies (API, file system)
8. **Test Behavior**: Test what users experience, not implementation details
9. **Edge Cases**: Always test boundaries, empty states, error conditions
10. **Documentation**: Complex test setups have explanatory comments

---