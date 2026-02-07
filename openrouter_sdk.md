# OpenRouter SDK quick guide

This guide shows the official OpenRouter SDK basics and the OpenAI-compatible option.

## 1) Install

TypeScript:
```
npm i @openrouter/sdk
```

Python:
```
pip install openrouter
```

## 2) Set your API key

Mac/Linux:
```
export OPENROUTER_API_KEY="your_api_key_here"
```

Windows (PowerShell):
```
setx OPENROUTER_API_KEY "your_api_key_here"
```

## 3) Use the OpenRouter SDK (Python)

```
from openrouter import OpenRouter
import os

with OpenRouter(api_key=os.getenv("OPENROUTER_API_KEY")) as client:
    response = client.chat.send(
        model="minimax/minimax-m2",
        messages=[{"role": "user", "content": "Hello!"}],
    )

print(response.choices[0].message.content)
```

Notes:
- The Python SDK is currently in beta.
- The SDK is generated from OpenRouter's OpenAPI specs and provides typed validation.

## 4) OpenAI SDK compatible mode (TypeScript)

OpenRouter supports the OpenAI SDK by setting the base URL and headers.

```
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://your-site.example", // Optional but recommended
    "X-Title": "Your App Name", // Optional
  },
});

const completion = await openai.chat.completions.create({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Say this is a test." }],
});

console.log(completion.choices[0].message.content);
```

## 5) How it works (in short)

- OpenRouter routes requests to many providers through one API.
- The SDK sends your key as a Bearer token using `OPENROUTER_API_KEY`.
- You can use OpenRouter's own SDKs or reuse the OpenAI SDK with a custom base URL.

## References

- OpenRouter Python SDK docs: https://openrouter.ai/docs/sdks/python  
- OpenAI SDK compatibility: https://openrouter.ai/docs/community/open-ai-sdk  
- OpenRouter SDK overview: https://openrouter.ai/sdk
