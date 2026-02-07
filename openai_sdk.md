# OpenAI SDK quick guide

This guide shows the official OpenAI SDK basics and how requests map to the API. The current primary endpoint is the Responses API.

## 1) Install

Node.js (TypeScript/JavaScript):
```
npm install openai
```

Python:
```
pip install openai
```

## 2) Set your API key

Mac/Linux:
```
export OPENAI_API_KEY="your_api_key_here"
```

Windows (PowerShell):
```
setx OPENAI_API_KEY "your_api_key_here"
```

The SDK reads `OPENAI_API_KEY` automatically.

## 3) Basic text generation (Responses API)

JavaScript (Node.js):
```
import OpenAI from "openai";

const client = new OpenAI();

const response = await client.responses.create({
  model: "gpt-5.2",
  input: "Write a one-sentence bedtime story about a unicorn.",
});

console.log(response.output_text);
```

Python:
```
from openai import OpenAI

client = OpenAI()
response = client.responses.create(
    model="gpt-5.2",
    input="Write a one-sentence bedtime story about a unicorn.",
)
print(response.output_text)
```

## 4) Streaming (Responses API)

JavaScript (Node.js):
```
import OpenAI from "openai";

const client = new OpenAI();

const stream = await client.responses.create({
  model: "gpt-5.2",
  input: "Give me three short tips for focus.",
  stream: true,
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta);
  }
}
```

Python:
```
from openai import OpenAI

client = OpenAI()
stream = client.responses.create(
    model="gpt-5.2",
    input="Give me three short tips for focus.",
    stream=True,
)

for event in stream:
    if event.type == "response.output_text.delta":
        print(event.delta, end="")
```

## 5) Chat Completions (legacy but still available)

If you need the older chat format, you can still call `chat.completions.create`:

JavaScript:
```
import OpenAI from "openai";

const client = new OpenAI();
const completion = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Say this is a test." }],
});
console.log(completion.choices[0].message.content);
```

Python:
```
from openai import OpenAI

client = OpenAI()
completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Say this is a test."}],
)
print(completion.choices[0].message.content)
```

## 6) How it works (in short)

- The SDK is a thin client over the REST API.
- `responses.create(...)` maps to `POST /v1/responses`.
- The SDK reads your API key from `OPENAI_API_KEY` and sends it as a Bearer token.
- Streaming yields server-sent events as they arrive.

## References

- OpenAI SDKs and setup: https://platform.openai.com/docs/libraries  
- API reference (Responses, Chat, etc.): https://platform.openai.com/docs/api-reference
