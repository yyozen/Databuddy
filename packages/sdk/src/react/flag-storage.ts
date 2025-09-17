class FlagStorage {
	private dbName = 'databuddy-flags';
	private version = 1;
	private storeName = 'flags';

	async get(key: string): Promise<any> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			return new Promise((resolve) => {
				const request = store.get(key);
				request.onsuccess = () => resolve(request.result?.value);
				request.onerror = () => resolve(null);
			});
		} catch {
			// Fallback to localStorage
			return this.getFromLocalStorage(key);
		}
	}

	async set(key: string, value: any): Promise<void> {
		try {
			const db = await this.openDB();
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			store.put({ key, value, timestamp: Date.now() });
		} catch {
			// Fallback to localStorage
			this.setToLocalStorage(key, value);
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
			return item ? JSON.parse(item) : null;
		} catch {
			return null;
		}
	}

	private setToLocalStorage(key: string, value: any): void {
		try {
			localStorage.setItem(`db-flag-${key}`, JSON.stringify(value));
		} catch {
			// Storage full or disabled, ignore
		}
	}
}

export const flagStorage = new FlagStorage();
