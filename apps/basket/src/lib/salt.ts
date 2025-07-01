import { createHash } from "node:crypto";
import crypto from "node:crypto";
import { redis } from "@databuddy/redis";

export async function getDailySalt(): Promise<string> {
    const saltKey = `salt:${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`;
    let salt = await redis.get(saltKey);
    if (!salt) {
        salt = crypto.randomBytes(32).toString("hex");
        await redis.setex(saltKey, 60 * 60 * 24, salt);
    }
    return salt;
}

export function saltAnonymousId(anonymousId: string, salt: string): string {
    return createHash("sha256")
        .update(anonymousId + salt)
        .digest("hex");
}