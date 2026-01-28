# @databuddy/ai

LLM observability for the Vercel AI SDK.

## Installation

```bash
bun add @databuddy/ai
```

## Usage

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

## Configuration

```typescript
const { track } = createTracker({
  apiUrl: "https://your-endpoint.com/llm", // Custom API endpoint
  apiKey: "your-api-key",                  // API key
  computeCosts: true,                      // Calculate costs (default: true)
  privacyMode: false,                      // Hide input/output (default: false)
  maxContentSize: 1_048_576,               // Max content size (default: 1MB)
  onSuccess: (call) => {},                 // Called on success
  onError: (call) => {},                   // Called on error
});
```

## Per-call Options

```typescript
const result = await generateText({
  model: track(openai("gpt-4o"), {
    traceId: "custom-trace-id",
    privacyMode: true,
    computeCosts: false,
  }),
  prompt: "Hello!",
});
```

## Custom Transport

```typescript
import { createTracker, httpTransport } from "@databuddy/ai/vercel";

const { track } = createTracker({
  transport: httpTransport("https://your-api.com/llm", "your-api-key"),
});

// Or fully custom:
const { track } = createTracker({
  transport: async (call) => {
    console.log("LLM call:", call);
    // Send to your backend
  },
});
```

## Features

- Automatic token counting and cost calculation
- Support for streaming and non-streaming calls
- Tool call tracking
- Web search usage detection
- Error tracking
- Privacy mode for sensitive data
- Works with all Vercel AI SDK providers
