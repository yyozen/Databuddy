/**
 * API Type Definitions
 */

import { Website } from '@databuddy/db';

// Tracking event interface shared between validation schema and controller
export interface TrackingEvent {
  type: 'track' | 'alias' | 'increment' | 'decrement';
  payload: {
    name?: string;
    anonymousId?: string;
    profileId?: string;
    properties?: Record<string, any>;
    property?: string;
    value?: number;
  };
}

// Variable types for Hono context
export interface AppVariables {
  website: Website;
  event?: TrackingEvent;
}

// Extended Website interface with additional fields
export interface WebsiteWithConfig extends Website {
  skipBotTraffic?: boolean;
  anonymizeIp?: boolean;
  sampleRate?: number;
} 