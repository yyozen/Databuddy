class FlagStorage {
	private dbName = 'databuddy-flags';
	private version = 1;
	private storeName = 'flags';
	private ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	async get(key: string): Promise<any> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			return new Promise((resolve) => {
				const request = store.get(key);
				request.onsuccess = () => {
					const result = request.result;
					if (result && this.isExpired(result.expiresAt)) {
						this.delete(key);
						resolve(null);
					} else {
						resolve(result?.value);
					}
				};
				request.onerror = () => resolve(null);
			});
		} catch {
			return this.getFromLocalStorage(key);
		}
	}

	async set(key: string, value: unknown): Promise<void> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const expiresAt = Date.now() + this.ttl;
			store.put({ key, value, timestamp: Date.now(), expiresAt });
		} catch {
			this.setToLocalStorage(key, value);
		}
	}

	async getAll(): Promise<Record<string, unknown>> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			return new Promise((resolve) => {
				const request = store.getAll();
				request.onsuccess = () => {
					const result: Record<string, unknown> = {};
					const expiredKeys: string[] = [];

					for (const item of request.result || []) {
						if (this.isExpired(item.expiresAt)) {
							expiredKeys.push(item.key);
						} else {
							result[item.key] = item.value;
						}
					}

					if (expiredKeys.length > 0) {
						this.deleteMultiple(expiredKeys);
					}

					resolve(result);
				};
				request.onerror = () => resolve({});
			});
		} catch {
			const result: Record<string, unknown> = {};
			const now = Date.now();
			Object.keys(localStorage)
				.filter((key) => key.startsWith('db-flag-'))
				.forEach((key) => {
					const flagKey = key.replace('db-flag-', '');
					try {
						const item = localStorage.getItem(key);
						if (item) {
							const parsed = JSON.parse(item);
							if (parsed.expiresAt && now > parsed.expiresAt) {
								localStorage.removeItem(key);
							} else {
								result[flagKey] = parsed.value || parsed; // Support both new and old format
							}
						}
					} catch {}
				});
			return result;
		}
	}

	async clear(): Promise<void> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			store.clear();
		} catch {
			Object.keys(localStorage)
				.filter((key) => key.startsWith('db-flag-'))
				.forEach((key) => {
					localStorage.removeItem(key);
				});

			return;
		}
	}

	private async openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: 'key' });
				}
			};
		});
	}

	private getFromLocalStorage(key: string): any {
		try {
			const item = localStorage.getItem(`db-flag-${key}`);
			if (!item) {
				return null;
			}

			const parsed = JSON.parse(item);

			if (parsed.expiresAt) {
				if (this.isExpired(parsed.expiresAt)) {
					localStorage.removeItem(`db-flag-${key}`);
					return null;
				}
				return parsed.value;
			}

			return parsed;
		} catch {
			return null;
		}
	}

	private setToLocalStorage(key: string, value: unknown): void {
		try {
			const item = {
				value,
				timestamp: Date.now(),
				expiresAt: Date.now() + this.ttl,
			};
			localStorage.setItem(`db-flag-${key}`, JSON.stringify(item));
		} catch {}
	}

	private isExpired(expiresAt?: number): boolean {
		if (!expiresAt) {
			return false;
		}
		return Date.now() > expiresAt;
	}

	async delete(key: string): Promise<void> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			store.delete(key);
		} catch {
			localStorage.removeItem(`db-flag-${key}`);
		}
	}

	async deleteMultiple(keys: string[]): Promise<void> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			for (const key of keys) {
				store.delete(key);
			}
		} catch {
			for (const key of keys) {
				localStorage.removeItem(`db-flag-${key}`);
			}
		}
	}

	async setAll(flags: Record<string, unknown>): Promise<void> {
		const currentFlags = await this.getAll();
		const currentKeys = Object.keys(currentFlags);
		const newKeys = Object.keys(flags);

		const removedKeys = currentKeys.filter((key) => !newKeys.includes(key));

		if (removedKeys.length > 0) {
			await this.deleteMultiple(removedKeys);
		}

		for (const [key, value] of Object.entries(flags)) {
			await this.set(key, value);
		}
	}

	async cleanupExpired(): Promise<void> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);

			return new Promise((resolve) => {
				const request = store.getAll();
				request.onsuccess = () => {
					const expiredKeys: string[] = [];
					for (const item of request.result || []) {
						if (this.isExpired(item.expiresAt)) {
							expiredKeys.push(item.key);
						}
					}

					if (expiredKeys.length > 0) {
						this.deleteMultiple(expiredKeys)
							.then(() => resolve())
							.catch(() => resolve());
					} else {
						resolve();
					}
				};
				request.onerror = () => resolve();
			});
		} catch {
			this.cleanupExpired();
			const now = Date.now();
			Object.keys(localStorage)
				.filter((key) => key.startsWith('db-flag-'))
				.forEach((key) => {
					try {
						const item = localStorage.getItem(key);
						if (item) {
							const parsed = JSON.parse(item);
							if (parsed.expiresAt && now > parsed.expiresAt) {
								localStorage.removeItem(key);
							}
						}
					} catch {
						localStorage.removeItem(key);
					}
				});
		}
	}
}

export const flagStorage = new FlagStorage();
