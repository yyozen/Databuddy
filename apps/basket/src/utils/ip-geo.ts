import type { City } from "@maxmind/geoip2-node";
import { Reader } from "@maxmind/geoip2-node";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from 'node:crypto';

interface GeoIPReader extends Reader {
  city(ip: string): City;
}

const dbPath = path.join(process.cwd(), "maxmind", "GeoLite2-City.mmdb");
let reader: GeoIPReader | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;
let loadError: Error | null = null;

async function loadDatabase() {
  if (loadError) {
    throw loadError;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  if (reader) {
    return;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      console.log("Loading GeoIP database...");

      // Check if file exists first
      try {
        await readFile(dbPath);
      } catch (error) {
        throw new Error(`GeoIP database file not found at ${dbPath}`);
      }

      const dbBuffer = await readFile(dbPath);

      // Add a small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));

      reader = Reader.openBuffer(dbBuffer) as GeoIPReader;
      console.log("GeoIP database loaded successfully");
    } catch (error) {
      console.error("Failed to load GeoIP database:", error);
      loadError = error as Error;
      reader = null;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

// Don't initialize on module load - wait for first use
const ignore = ['127.0.0.1', '::1'];

export async function getGeoLocation(ip: string) {
  if (!ip || ignore.includes(ip)) {
    return { country: undefined, region: undefined };
  }

  // Lazy load database on first use
  if (!reader && !isLoading && !loadError) {
    try {
      await loadDatabase();
    } catch (error) {
      console.error("Failed to load database for IP lookup:", error);
      return { country: undefined, region: undefined };
    }
  }

  if (!reader) {
    return { country: undefined, region: undefined };
  }

  try {
    const response = reader.city(ip);
    return {
      country: response.country?.names?.en,
      region: response.subdivisions?.[0]?.names?.en,
    };
  } catch (error) {
    console.error("Error looking up IP:", ip, error);
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

