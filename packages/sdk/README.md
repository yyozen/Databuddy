# Databuddy SDK

A modern, type-safe analytics SDK and React component for integrating [Databuddy](https://www.databuddy.cc) into your web apps.

## Features

- 📊 **Automatic page/screen view tracking**
- ⚡ **Performance, Web Vitals, and error tracking**
- 🧑‍💻 **Custom event tracking**
- 🧩 **Drop-in React/Next.js component: `<Databuddy />`**
- 🛡️ **Privacy-first: anonymized by default, sampling, batching, and more**
- 🛠️ **Type-safe config and autocompletion**

---

## Installation

```sh
bun add @databuddy/sdk
# or
npm install @databuddy/sdk
```

---

## Usage

### 1. **React/Next.js: Drop-in Component**

Add the `<Databuddy />` component to your root layout (e.g. `app/layout.tsx`):

```tsx
import { Databuddy } from '@databuddy/sdk';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <Databuddy
        clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID!}
        trackScreenViews
        trackPerformance
        trackErrors
        enableBatching
        batchSize={20}
      />
      <body>{children}</body>
    </html>
  );
}
```

- **All config options are type-safe and passed as data attributes to the script.**
- **No need to manually add `<Script />` or manage the script tag.**

### 2. **Script Tag (Vanilla HTML/JS)**

If you don't use React, you can add the script directly:

```html
<script
  src="https://app.databuddy.cc/databuddy.js"
  data-client-id="YOUR_CLIENT_ID"
  data-track-screen-views="true"
  data-track-performance="true"
  defer
></script>
```

---

## Configuration Options

All options are type-safe and documented in `DatabuddyConfig`:

| Option              | Type      | Default      | Description |
|---------------------|-----------|--------------|-------------|
| `clientId`          | string    | —            | **Required.** Your Databuddy project client ID. |
| `clientSecret`      | string    | —            | (Advanced) For server-side use only. |
| `apiUrl`            | string    | `https://api.databuddy.cc` | Custom API endpoint. |
| `scriptUrl`         | string    | `https://app.databuddy.cc/databuddy.js` | Custom script URL. |
| `sdk`               | string    | `web`        | SDK name. Only override for custom builds. |
| `sdkVersion`        | string    | `1.0.0`      | SDK version. Only override for custom builds. |
| `disabled`          | boolean   | `false`      | Disable all tracking. |
| `waitForProfile`    | boolean   | `false`      | Wait for user profile before sending events. |
| `trackScreenViews`  | boolean   | `true`       | Auto-track page/screen views. |
| `trackHashChanges`  | boolean   | `false`      | Track hash changes in URL. |
| `trackAttributes`   | boolean   | `false`      | Track data-* attributes. |
| `trackOutgoingLinks`| boolean   | `false`      | Track outgoing link clicks. |
| `trackSessions`     | boolean   | `false`      | Track user sessions. |
| `trackPerformance`  | boolean   | `true`       | Track page performance. |
| `trackWebVitals`    | boolean   | `true`       | Track Web Vitals. |
| `trackEngagement`   | boolean   | `false`      | Track engagement metrics. |
| `trackScrollDepth`  | boolean   | `false`      | Track scroll depth. |
| `trackExitIntent`   | boolean   | `false`      | Track exit intent. |
| `trackInteractions` | boolean   | `false`      | Track user interactions. |
| `trackErrors`       | boolean   | `true`       | Track JS errors. |
| `trackBounceRate`   | boolean   | `false`      | Track bounce rate. |
| `samplingRate`      | number    | `1.0`        | Sampling rate (0.0–1.0). |
| `enableRetries`     | boolean   | `true`       | Retry failed requests. |
| `maxRetries`        | number    | `3`          | Max retries. |
| `initialRetryDelay` | number    | `500`        | Initial retry delay (ms). |
| `enableBatching`    | boolean   | `true`       | Enable event batching. |
| `batchSize`         | number    | `20`         | Events per batch (1–50). |
| `batchTimeout`      | number    | `5000`       | Batch timeout (ms, 100–30000). |

---

## Troubleshooting

- **Script not loading?**
  - Make sure your `clientId` is correct and the script URL is reachable.
- **No events in dashboard?**
  - Check your config, especially `clientId` and network requests in the browser dev tools.
- **Type errors?**
  - All config options are type-safe. Use your IDE's autocomplete for help.
- **SSR/Next.js?**
  - The component is safe for SSR/React Server Components. It only injects the script on the client.

---

## Documentation & Support

- [Databuddy Docs](https://docs.databuddy.cc)
- [Dashboard](https://app.databuddy.cc)
- [Contact Support](https://www.databuddy.cc/contact)

---

© Databuddy. All rights reserved. 