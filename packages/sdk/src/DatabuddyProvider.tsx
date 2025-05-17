'use client';

import { useEffect } from 'react';
import type { DatabuddyConfig } from './types';

/**
 * <Databuddy /> component for Next.js/React apps
 * Injects the databuddy.js script with all config as data attributes
 * Usage: <Databuddy clientId="..." trackScreenViews trackPerformance ... />
 */
export function Databuddy(props: DatabuddyConfig) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[data-databuddy-injected]')) return;
    const script = document.createElement('script');
    script.src = props.scriptUrl || 'https://app.databuddy.cc/databuddy.js';
    script.defer = true;
    script.setAttribute('data-databuddy-injected', 'true');
    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        const dataKey = `data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        script.setAttribute(dataKey, String(value));
      }
    }
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [props]);
  return null;
}

export default Databuddy; 