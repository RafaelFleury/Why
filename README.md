# Why - Educational Feed App

A Twitter-like educational app where AI personalities teach through posts and replies. Content is generated on-demand, adapts to user engagement, and uses spaced repetition to reinforce learning.

## Tech Stack

- **React Native + Expo** (SDK 54)
- **TypeScript**
- **NativeWind** (Tailwind CSS for React Native)
- **Expo Router** (file-based navigation)
- **Zustand** (state management)
- **expo-sqlite** (local database)
- **OpenAI SDK** with configurable baseURL (supports OpenRouter + OpenAI)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Expo Go app on your phone (for mobile testing)

### Install

```bash
npm install
```

### Run

```bash
# Start Expo dev server
npx expo start

# Mobile (scan QR with Expo Go)
npx expo start --android
npx expo start --ios

# Web preview
npx expo start --web
```

### Development Environment

Create a `.env` file at the project root for development overrides:

```
EXPO_PUBLIC_API_KEY=your_api_key_here
EXPO_PUBLIC_BASE_URL=https://openrouter.ai/api/v1
EXPO_PUBLIC_DEFAULT_MODEL=openai/gpt-4o-mini
```

These override the in-app settings during development. In production, all configuration is done through the Settings screen and stored in the local SQLite database.

## Features

- **AI Personality Feed**: Multiple AI teaching personalities with distinct styles
- **Adaptive Learning**: Content difficulty adjusts based on your feedback
- **Spaced Repetition**: Automatically schedules reviews of concepts you've engaged with
- **Bookmarks**: Save and search through your favorite posts
- **Weekly Recap**: Track your learning progress with AI-generated summaries
- **Bilingual**: Full PT-BR and English support
- **Dark Mode**: Sleek dark-only UI

## Project Structure

```
src/
  app/           # Screens (expo-router file-based navigation)
  components/    # Reusable UI components
  services/      # Database, LLM, feed algorithm, spaced repetition
  stores/        # Zustand state stores
  types/         # TypeScript type definitions
  utils/         # Personalities, i18n, prompts, constants
```

## API Configuration

The app uses the OpenAI SDK with a configurable base URL, supporting:

- **OpenRouter** (`https://openrouter.ai/api/v1`) - access multiple models through one API
- **OpenAI** (`https://api.openai.com/v1`) - direct OpenAI access

Configure your API key and base URL in the Settings screen.
