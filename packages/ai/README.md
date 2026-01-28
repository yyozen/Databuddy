# @databuddy/ai

LLM observability for OpenAI, Anthropic, and Vercel AI SDK.

## Installation

```bash
bun add @databuddy/ai
```

## OpenAI SDK

```typescript
import { OpenAI } from "@databuddy/ai/openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  databuddy: {
    apiKey: process.env.DATABUDDY_API_KEY,
  },
});

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Anthropic SDK

```typescript
import { Anthropic } from "@databuddy/ai/anthropic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  databuddy: {
    apiKey: process.env.DATABUDDY_API_KEY,
  },
});

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Vercel AI SDK

```typescript
import { createTracker } from "@databuddy/ai/vercel";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const { track } = createTracker({
  apiKey: process.env.DATABUDDY_API_KEY,
});

const result = await generateText({
  model: track(openai("gpt-4o")),
  prompt: "Hello!",
});
```

## Configuration Options

```typescript
// OpenAI / Anthropic
const client = new OpenAI({
  databuddy: {
    apiUrl: "https://your-endpoint.com/llm",
    apiKey: "your-api-key",
    computeCosts: true,       // Calculate costs (default: true)
    privacyMode: false,       // Hide input/output (default: false)
    onSuccess: (call) => {},  // Called on success
    onError: (call) => {},    // Called on error
  },
});

// Vercel AI SDK
const { track } = createTracker({
  apiUrl: "https://your-endpoint.com/llm",
  apiKey: "your-api-key",
  computeCosts: true,
  privacyMode: false,
  maxContentSize: 1_048_576,
  onSuccess: (call) => {},
  onError: (call) => {},
});
```

## Per-call Options

```typescript
// OpenAI / Anthropic
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
  databuddy: {
    traceId: "custom-trace-id",
    privacyMode: true,
  },
});

// Vercel AI SDK
const result = await generateText({
  model: track(openai("gpt-4o"), {
    traceId: "custom-trace-id",
    privacyMode: true,
  }),
  prompt: "Hello!",
});
```

## Custom Transport

```typescript
import { OpenAI, httpTransport } from "@databuddy/ai/openai";

const openai = new OpenAI({
  databuddy: {
    transport: httpTransport("https://your-api.com/llm", "your-api-key"),
  },
});

// Or fully custom:
const openai = new OpenAI({
  databuddy: {
    transport: async (call) => {
      console.log("LLM call:", call);
    },
  },
});
```

## Features

- Automatic token counting and cost calculation
- Support for streaming and non-streaming calls
- Tool call tracking
- Cache token tracking (Anthropic)
- Web search usage detection
- Error tracking
- Privacy mode for sensitive data
- Works with OpenAI, Anthropic, and all Vercel AI SDK providers
