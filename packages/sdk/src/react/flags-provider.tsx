import { atom, createStore, Provider, useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { createElement, useEffect } from 'react';
import { flagStorage } from './flag-storage';
import type { FlagResult, FlagsConfig } from './types';

const flagsStore = createStore();

const configAtom = atom<FlagsConfig | null>(null);
const memoryFlagsAtom = atom<Record<string, FlagResult>>({});
const pendingFlagsAtom = atom<Set<string>>(new Set<string>());

export interface FlagsProviderProps extends FlagsConfig {
	children: ReactNode;
}

export function FlagsProvider({ children, ...config }: FlagsProviderProps) {
	console.log('[Databuddy Flags] Provider rendering with config:', {
		clientId: config.clientId,
		debug: config.debug,
		isPending: config.isPending,
		hasUser: !!config.user,
	});
	useEffect(() => {
		const newConfig = {
			clientId: config.clientId,
			apiUrl: config.apiUrl,
			user: config.user,
			disabled: config.disabled,
			debug: config.debug,
			skipStorage: config.skipStorage,
			isPending: config.isPending,
			autoFetch: config.autoFetch,
		};

		flagsStore.set(configAtom, newConfig);

		console.log('[Databuddy Flags] Config set on store', {
			clientId: config.clientId,
			apiUrl: config.apiUrl,
			user: config.user,
			isPending: config.isPending,
			skipStorage: config.skipStorage,
		});

		if (!config.skipStorage) {
			loadCachedFlagsImmediate(newConfig);
			flagStorage.cleanupExpired().catch(() => {});
		}
	}, [
		config.clientId,
		config.apiUrl,
		config.user?.userId,
		config.user?.email,
		config.disabled,
		config.debug,
		config.skipStorage,
		config.isPending,
		config.autoFetch,
	]);

	const loadCachedFlagsImmediate = (configToUse: FlagsConfig) => {
		if (configToUse.skipStorage) {
			return;
		}

		try {
			const cachedFlags: Record<string, FlagResult> = {};
			const flagKeys = Object.keys(localStorage).filter((key) =>
				key.startsWith('db-flag-')
			);

			for (const key of flagKeys) {
				const flagKey = key.replace('db-flag-', '');
				try {
					const value = localStorage.getItem(key);
					if (value) {
						cachedFlags[flagKey] = JSON.parse(value);
					}
				} catch {}
			}

			if (Object.keys(cachedFlags).length > 0) {
				flagsStore.set(memoryFlagsAtom, cachedFlags);
				if (configToUse.debug) {
					console.log(
						'[Databuddy Flags] Loaded cached flags immediately:',
						Object.keys(cachedFlags)
					);
				}
			}
		} catch (err) {
			if (configToUse.debug) {
				console.warn(
					'[Databuddy Flags] Error loading cached flags immediately:',
					err
				);
			}
		}

		flagStorage
			.getAll()
			.then((cachedFlags) => {
				if (Object.keys(cachedFlags).length > 0) {
					flagsStore.set(memoryFlagsAtom, (prev) => ({
						...prev,
						...(cachedFlags as Record<string, FlagResult>),
					}));
					if (configToUse.debug) {
						console.log(
							'[Databuddy Flags] Loaded cached flags from IndexedDB:',
							Object.keys(cachedFlags)
						);
					}
				}
			})
			.catch((err) => {
				if (configToUse.debug) {
					console.warn('[Databuddy Flags] Error loading from IndexedDB:', err);
				}
			});
	};

	return createElement(Provider, { store: flagsStore }, children);
}

export function useFlags() {
	const [config] = useAtom(configAtom, { store: flagsStore });
	const [memoryFlags, setMemoryFlags] = useAtom(memoryFlagsAtom, {
		store: flagsStore,
	});
	const [pendingFlags, setPendingFlags] = useAtom(pendingFlagsAtom, {
		store: flagsStore,
	});

	console.log('[Databuddy Flags] useFlags called with config:', {
		hasConfig: !!config,
		clientId: config?.clientId,
		isPending: config?.isPending,
		debug: config?.debug,
		skipStorage: config?.skipStorage,
		memoryFlagsCount: Object.keys(memoryFlags).length,
		memoryFlags: Object.keys(memoryFlags),
	});

	const fetchAllFlags = async (): Promise<void> => {
		if (!config) {
			console.warn('[Databuddy Flags] No config for bulk fetch');
			return;
		}

		if (config.isPending) {
			if (config.debug) {
				console.log('[Databuddy Flags] Session pending, skipping bulk fetch');
			}
			return;
		}

		const params = new URLSearchParams();
		params.set('clientId', config.clientId);
		if (config.user?.userId) {
			params.set('userId', config.user.userId);
		}
		if (config.user?.email) {
			params.set('email', config.user.email);
		}
		if (config.user?.properties) {
			params.set('properties', JSON.stringify(config.user.properties));
		}

		const url = `${config.apiUrl}/public/v1/flags/bulk?${params.toString()}`;

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: { Accept: 'application/json' },
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();

			if (config.debug) {
				console.log('[Databuddy Flags] Bulk fetch response:', result);
			}

			if (result.flags) {
				setMemoryFlags(result.flags);

				if (!config.skipStorage) {
					try {
						// Use setAll to properly sync cache (removes old flags)
						await flagStorage.setAll(result.flags);
						if (config.debug) {
							console.log(
								'[Databuddy Flags] Bulk flags synced to cache, removed old flags'
							);
						}
					} catch (err) {
						if (config.debug) {
							console.warn('[Databuddy Flags] Bulk storage error:', err);
						}
					}
				}
			}
		} catch (err) {
			if (config.debug) {
				console.error('[Databuddy Flags] Bulk fetch error:', err);
			}
		}
	};

	const fetchFlag = async (key: string): Promise<FlagResult> => {
		if (!config) {
			console.warn(`[Databuddy Flags] No config for flag: ${key}`);
			return {
				enabled: false,
				value: false,
				payload: null,
				reason: 'NO_CONFIG',
			};
		}

		setPendingFlags((prev: Set<string>) => new Set([...prev, key]));

		const params = new URLSearchParams();
		params.set('key', key);
		params.set('clientId', config.clientId);
		if (config.user?.userId) {
			params.set('userId', config.user.userId);
		}
		if (config.user?.email) {
			params.set('email', config.user.email);
		}
		if (config.user?.properties) {
			params.set('properties', JSON.stringify(config.user.properties));
		}

		const url = `${config.apiUrl}/public/v1/flags/evaluate?${params.toString()}`;

		if (config.debug) {
			console.log(`[Databuddy Flags] Fetching from server: ${key}`, { url });
			console.log(`[Databuddy Flags] Request details for ${key}:`, {
				hasConfig: !!config,
				hasUser: !!config.user,
				userId: config.user?.userId || 'MISSING',
				email: config.user?.email || 'MISSING',
				clientId: config.clientId || 'MISSING',
			});
		}

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: { Accept: 'application/json' },
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result: FlagResult = await response.json();

			if (config.debug) {
				console.log(`[Databuddy Flags] Server response for: ${key}`, result);
			}

			// Store in memory
			setMemoryFlags((prev) => ({ ...prev, [key]: result }));

			// Store in persistent storage (if not skipped)
			if (!config.skipStorage) {
				try {
					await flagStorage.set(key, result);
					if (config.debug) {
						console.log(`[Databuddy Flags] Stored in cache: ${key}`);
					}
				} catch (err) {
					if (config.debug) {
						console.warn(`[Databuddy Flags] Storage save error: ${key}`, err);
					}
				}
			}

			return result;
		} catch (err) {
			if (config.debug) {
				console.error(`[Databuddy Flags] Fetch error for: ${key}`, err);
			}

			const fallback = {
				enabled: false,
				value: false,
				payload: null,
				reason: 'ERROR',
			};
			setMemoryFlags((prev) => ({ ...prev, [key]: fallback }));
			return fallback;
		} finally {
			// Remove from pending flags
			setPendingFlags((prev: Set<string>) => {
				const newSet = new Set(prev);
				newSet.delete(key);
				return newSet;
			});
		}
	};

	const getFlag = async (key: string): Promise<FlagResult> => {
		if (config?.debug) {
			console.log(`[Databuddy Flags] Getting flag: ${key}`);
		}

		if (config?.isPending) {
			if (config?.debug) {
				console.log(
					`[Databuddy Flags] Session pending, returning default for: ${key}`
				);
			}
			return {
				enabled: false,
				value: false,
				payload: null,
				reason: 'SESSION_PENDING',
			};
		}

		if (memoryFlags[key]) {
			if (config?.debug) {
				console.log(
					`[Databuddy Flags] Found in memory: ${key}`,
					memoryFlags[key]
				);
			}
			return memoryFlags[key];
		}

		if (pendingFlags.has(key)) {
			if (config?.debug) {
				console.log(
					`[Databuddy Flags] Already fetching: ${key}, returning default`
				);
			}
			return {
				enabled: false,
				value: false,
				payload: null,
				reason: 'FETCHING',
			};
		}

		if (!config?.skipStorage) {
			try {
				const cached = await flagStorage.get(key);
				if (cached) {
					if (config?.debug) {
						console.log(`[Databuddy Flags] Found in storage: ${key}`, cached);
					}
					setMemoryFlags((prev) => ({ ...prev, [key]: cached }));
					return cached;
				}
			} catch (err) {
				if (config?.debug) {
					console.warn(`[Databuddy Flags] Storage error for: ${key}`, err);
				}
			}
		}

		return fetchFlag(key);
	};

	const isEnabled = (key: string): boolean => {
		if (memoryFlags[key]) {
			return memoryFlags[key].enabled;
		}
		getFlag(key);
		return false;
	};

	const getValue = (key: string, defaultValue = false): boolean => {
		if (memoryFlags[key]) {
			return memoryFlags[key].value ?? defaultValue;
		}
		getFlag(key);
		return defaultValue;
	};

	const refresh = async (forceClear = false): Promise<void> => {
		if (config?.debug) {
			console.log('[Databuddy Flags] Refreshing all flags', { forceClear });
		}

		if (forceClear) {
			setMemoryFlags({});
			if (!config?.skipStorage) {
				try {
					await flagStorage.clear();
					if (config?.debug) {
						console.log('[Databuddy Flags] Storage cleared');
					}
				} catch (err) {
					if (config?.debug) {
						console.warn('[Databuddy Flags] Storage clear error:', err);
					}
				}
			}
		}

		await fetchAllFlags();
	};

	const updateUser = (user: FlagsConfig['user']) => {
		if (config) {
			flagsStore.set(configAtom, { ...config, user });
			refresh();
		}
	};

	useEffect(() => {
		if (config && !config.isPending && config.autoFetch !== false) {
			if (config.debug) {
				console.log('[Databuddy Flags] Auto-fetching flags in background');
			}
			fetchAllFlags();
		}
	}, [
		config?.clientId,
		config?.user?.userId,
		config?.user?.email,
		config?.isPending,
		config?.autoFetch,
	]);

	return {
		isEnabled,
		getValue,
		fetchAllFlags,
		updateUser,
		refresh,
	};
}
