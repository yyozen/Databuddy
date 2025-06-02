"use server";

import { chQuery } from "@databuddy/db";

export interface ClickhouseEvent {
  id: string;
  client_id: string;
  event_name: string;
  anonymous_id: string;
  time: string;
  session_id: string;
  referrer: string | null;
  url: string;
  path: string;
  title: string | null;
  ip: string;
  user_agent: string;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: string | null;
  screen_resolution: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  properties: string;
  created_at: string;
  [key: string]: any;
}

export interface EventsQueryParams {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  client_id?: string;
  event_name?: string;
  search?: string;
  browser_name?: string;
  os_name?: string;
  country?: string;
  device_type?: string;
  path?: string;
}

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

export async function fetchEvents(params: EventsQueryParams = {}) {
  try {
    const {
      limit = 25,
      offset = 0,
      from,
      to,
      client_id,
      event_name,
      search,
      browser_name,
      os_name,
      country,
      device_type,
      path,
    } = params;

    // Build the query conditions
    const conditions = [];
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        conditions.push(`time >= parseDateTimeBestEffort('${escapeString(from)}')`);
      }
    }
    if (to) {
      const toDate = new Date(`${to}T23:59:59`);
      if (!Number.isNaN(toDate.getTime())) {
        conditions.push(`time <= parseDateTimeBestEffort('${escapeString(`${to} 23:59:59`)}')`);
      }
    }
    if (client_id) conditions.push(`client_id = '${escapeString(client_id)}'`);
    if (event_name) conditions.push(`event_name = '${escapeString(event_name)}'`);
    if (browser_name) conditions.push(`browser_name ILIKE '%${escapeString(browser_name)}%'`);
    if (os_name) conditions.push(`os_name ILIKE '%${escapeString(os_name)}%'`);
    if (country) conditions.push(`country ILIKE '%${escapeString(country)}%'`);
    if (device_type) conditions.push(`device_type ILIKE '%${escapeString(device_type)}%'`);
    if (path) {
      // Support wildcard path matching
      if (path.includes('*')) {
        const pathPattern = escapeString(path.replace(/\*/g, '%'));
        conditions.push(`path ILIKE '${pathPattern}'`);
      } else {
        conditions.push(`path = '${escapeString(path)}'`);
      }
    }
    if (search) {
      const escapedSearch = escapeString(search);
      conditions.push(`(
        id ILIKE '%${escapedSearch}%' OR 
        event_name ILIKE '%${escapedSearch}%' OR
        url ILIKE '%${escapedSearch}%' OR
        path ILIKE '%${escapedSearch}%' OR
        title ILIKE '%${escapedSearch}%' OR
        properties ILIKE '%${escapedSearch}%' OR
        referrer ILIKE '%${escapedSearch}%' OR
        browser_name ILIKE '%${escapedSearch}%' OR
        os_name ILIKE '%${escapedSearch}%' OR
        country ILIKE '%${escapedSearch}%'
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total matching events
    const totalQuery = `
      SELECT count() as total 
      FROM analytics.events
      ${whereClause}
    `;
    
    const totalResult = await chQuery<{ total: number }>(totalQuery);
    const total = totalResult[0]?.total || 0;

    // Fetch events with pagination
    const eventsQuery = `
      SELECT *
      FROM analytics.events
      ${whereClause}
      ORDER BY time DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    const data = await chQuery<ClickhouseEvent>(eventsQuery);
    
    return { data, total };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { data: [], total: 0, error: String(error) };
  }
} 