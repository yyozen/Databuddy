import type { NotificationPayload, NotificationResult } from "../types";

export interface NotificationProvider {
	send(payload: NotificationPayload): Promise<NotificationResult>;
}

export abstract class BaseProvider implements NotificationProvider {
	protected timeout: number;
	protected retries: number;
	protected retryDelay: number;

	constructor(options?: {
		timeout?: number;
		retries?: number;
		retryDelay?: number;
	}) {
		this.timeout = options?.timeout ?? 10_000;
		this.retries = options?.retries ?? 0;
		this.retryDelay = options?.retryDelay ?? 1000;
	}

	abstract send(payload: NotificationPayload): Promise<NotificationResult>;

	protected async withRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
		try {
			return await this.withTimeout(fn());
		} catch (error) {
			if (attempt < this.retries) {
				await this.delay(this.retryDelay);
				return this.withRetry(fn, attempt + 1);
			}
			throw error;
		}
	}

	protected async withTimeout<T>(promise: Promise<T>): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const result = await promise;
			clearTimeout(timeoutId);
			return result;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === "AbortError") {
				throw new Error(`Request timed out after ${this.timeout}ms`);
			}
			throw error;
		}
	}

	protected delay(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
