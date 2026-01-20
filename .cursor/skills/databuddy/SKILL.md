---
name: databuddy-sdk
description: Integrate Databuddy analytics SDK into React, Next.js, Node.js, and Vue applications. Use when implementing analytics tracking, feature flags, custom events, Web Vitals, error tracking, or LLM observability with the Vercel AI SDK.
metadata:
  author: databuddy
  version: "2.3"
---

# Databuddy SDK

The Databuddy SDK (`@databuddy/sdk`) is a privacy-first analytics SDK for web and server applications.

## When to Use This Skill

Use this skill when:
- Setting up analytics in React/Next.js/Vue applications
- Implementing server-side tracking in Node.js
- Adding feature flags to an application
- Tracking custom events, errors, or Web Vitals
- Integrating LLM observability with Vercel AI SDK
- Configuring privacy-first tracking options

## SDK Entry Points

| Import Path | Environment | Description |
|-------------|-------------|-------------|
| `@databuddy/sdk` | Browser (Core) | Core tracking utilities and types |
| `@databuddy/sdk/react` | React/Next.js | React component and hooks |
| `@databuddy/sdk/node` | Node.js/Server | Server-side tracking with batching |
| `@databuddy/sdk/vue` | Vue.js | Vue plugin and composables |
| `@databuddy/sdk/ai/vercel` | AI/LLM | Vercel AI SDK middleware for LLM analytics |

## Quick Start

### React/Next.js

```tsx
import { Databuddy } from "@databuddy/sdk/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Databuddy
          clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID}
          trackWebVitals
          trackErrors
          trackPerformance
        />
      </body>
    </html>
  );
}
```

### Node.js Server-Side

```typescript
import { Databuddy } from "@databuddy/sdk/node";

const client = new Databuddy({
  clientId: process.env.DATABUDDY_CLIENT_ID,
  enableBatching: true,
});

await client.track({
  name: "api_call",
  properties: { endpoint: "/users", method: "GET" },
});

// Important: flush before process exit in serverless
await client.flush();
```

### Feature Flags

```tsx
import { FlagsProvider, useFlag, useFeature } from "@databuddy/sdk/react";

// Wrap your app
<FlagsProvider clientId="..." user={{ userId: "123" }}>
  <App />
</FlagsProvider>

// In components
function MyComponent() {
  const { on, loading } = useFeature("dark-mode");
  if (loading) return <Skeleton />;
  return on ? <DarkTheme /> : <LightTheme />;
}
```

### LLM Analytics

```typescript
import { databuddyLLM } from "@databuddy/sdk/ai/vercel";
import { openai } from "@ai-sdk/openai";

const { track } = databuddyLLM({
  apiKey: process.env.DATABUDDY_API_KEY,
});

const model = track(openai("gpt-4o"));
// All LLM calls are now automatically tracked
```

## Key Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientId` | `string` | Auto-detect | Project client ID |
| `disabled` | `boolean` | `false` | Disable all tracking |
| `trackWebVitals` | `boolean` | `false` | Track Web Vitals metrics |
| `trackErrors` | `boolean` | `false` | Track JavaScript errors |
| `trackPerformance` | `boolean` | `true` | Track performance metrics |
| `enableBatching` | `boolean` | `true` | Enable event batching |
| `samplingRate` | `number` | `1.0` | Sampling rate (0.0-1.0) |
| `skipPatterns` | `string[]` | — | Glob patterns to skip tracking |

## Common Patterns

### Disable in Development

```tsx
<Databuddy
  disabled={process.env.NODE_ENV === "development"}
  clientId="..."
/>
```

### Skip Sensitive Paths

```tsx
<Databuddy
  clientId="..."
  skipPatterns={["/admin/**", "/internal/**"]}
  maskPatterns={["/users/*", "/orders/*"]}
/>
```

### Custom Event Tracking

```typescript
// Browser
import { track } from "@databuddy/sdk/react";

track("purchase", {
  product_id: "sku-123",
  amount: 99.99,
  currency: "USD",
});

// Node.js
await client.track({
  name: "subscription_renewed",
  properties: { plan: "pro", amount: 29.99 },
});
```

### Global Properties

```typescript
// Browser
window.databuddy?.setGlobalProperties({
  plan: "enterprise",
  abVariant: "checkout-v2",
});

// Node.js
client.setGlobalProperties({
  environment: "production",
  version: "1.0.0",
});
```

## Reference Documentation

For detailed API documentation, see:

- [Core SDK Reference](references/core.md) - Browser tracking utilities and types
- [React Integration](references/react.md) - React/Next.js component and hooks
- [Node.js Integration](references/node.md) - Server-side tracking with batching
- [Feature Flags](references/flags.md) - Feature flags for all platforms
- [AI/LLM Tracking](references/ai-vercel.md) - Vercel AI SDK integration

## Source Code

The SDK source code is located at `packages/sdk/` in the repository.
