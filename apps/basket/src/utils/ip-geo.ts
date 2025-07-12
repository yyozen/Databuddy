import type { City } from "@maxmind/geoip2-node";
import { Reader } from "@maxmind/geoip2-node";

interface GeoIPReader extends Reader {
  city(ip: string): City;
}
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from 'node:crypto';

const dbPath = path.join(process.cwd(), "maxmind", "GeoLite2-City.mmdb");
let reader: GeoIPReader | null = null;

async function loadDatabase() {
  try {
    const dbBuffer = await readFile(dbPath);
    reader = Reader.openBuffer(dbBuffer) as GeoIPReader;
    console.log("GeoIP database loaded");
  } catch (error) {
    console.error("Failed to load GeoIP database:", error);
  }
}

// Initialize database loading
loadDatabase().catch(error => {
  console.error("Failed to initialize GeoIP database:", error);
});

const ignore = ['127.0.0.1', '::1'];

export async function getGeoLocation(ip: string) {
  if (!ip || ignore.includes(ip) || !reader) {
    return { country: undefined, region: undefined };
  }

  try {
    const response = reader.city(ip);
    return {
      country: response.country?.names?.en,
      region: response.subdivisions?.[0]?.names?.en,
    };
  } catch (error) {
    return { country: undefined, region: undefined };
  }
}

export function getClientIp(req: Request): string | undefined {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  return undefined;
}

export async function parseIp(req: Request) {
  const ip = getClientIp(req);
  return getGeoLocation(ip || '');
}

export function anonymizeIp(ip: string): string {
  if (!ip) return '';

  const salt = process.env.IP_HASH_SALT || 'databuddy-ip-salt';
  const hash = createHash('sha256');
  hash.update(`${ip}${salt}`);
  return hash.digest('hex').substring(0, 12);
}

export async function getGeo(ip: string) {
  const geo = await getGeoLocation(ip);
  return {
    anonymizedIP: anonymizeIp(ip),
    country: geo.country,
    region: geo.region,
  };
}

export function extractIpFromRequest(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstIp = forwardedFor?.split(',')[0]?.trim();
  if (firstIp) return firstIp;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '';
}

