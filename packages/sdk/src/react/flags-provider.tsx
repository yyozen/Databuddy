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

/**
 * @param children - React children
 */
export function FlagsProvider({ children, ...config }: FlagsProviderProps) {
	console.log('[Databuddy Flags] Provider rendering with config:', {
		clientId: config.clientId,
		debug: config.debug,
		isPending: config.isPending,
		hasUser: !!config.user,
	});

	// Set config directly on the store
	useEffect(() => {
		const newConfig = {
			clientId: config.clientId,
			apiUrl: config.apiUrl,
			websiteId: config.websiteId,
			organizationId: config.organizationId,
			user: config.user,
			disabled: config.disabled,
			debug: config.debug,
			skipStorage: config.skipStorage,
			isPending: config.isPending,
		};

		flagsStore.set(configAtom, newConfig);

		console.log('[Databuddy Flags] Config set on store', {
			clientId: config.clientId,
			apiUrl: config.apiUrl,
			websiteId: config.websiteId,
			organizationId: config.organizationId,
			user: config.user,
			isPending: config.isPending,
			skipStorage: config.skipStorage,
		});
	}, [
		config.clientId,
		config.apiUrl,
		config.websiteId,
		config.organizationId,
		config.user?.userId,
		config.user?.email,
		config.disabled,
		config.debug,
		config.skipStorage,
		config.isPending,
	]);

	return createElement(Provider, { store: flagsStore }, children);
}

/**
 * @returns Object with flag methods
 */
export function useFlags() {
	const [config] = useAtom(configAtom);
	const [memoryFlags, setMemoryFlags] = useAtom(memoryFlagsAtom);
	const [pendingFlags, setPendingFlags] = useAtom(pendingFlagsAtom);

	console.log('[Databuddy Flags] useFlags called with config:', {
		hasConfig: !!config,
		clientId: config?.clientId,
		isPending: config?.isPending,
		debug: config?.debug,
	});

	const getFlag = async (key: string): Promise<FlagResult> => {
		if (config?.debug) {
			console.log(`[Databuddy Flags] Getting flag: ${key}`);
		}

		// Don't fetch if session is still pending
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

		// 1. Check memory first
		if (memoryFlags[key]) {
			if (config?.debug) {
				console.log(
					`[Databuddy Flags] Found in memory: ${key}`,
					memoryFlags[key]
				);
			}
			return memoryFlags[key];
		}

		// 2. Check if already fetching to prevent duplicate requests
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

		// 3. Check storage (if not skipped)
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

		// 4. Fetch from server
		return fetchFlag(key);
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

		// Mark as pending to prevent duplicate requests
		setPendingFlags((prev: Set<string>) => new Set([...prev, key]));

		const requestBody = {
			key,
			websiteId: config.websiteId,
			organizationId: config.organizationId,
			userId: config.user?.userId,
			email: config.user?.email,
			properties: config.user?.properties,
		};

		if (config.debug) {
			console.log(`[Databuddy Flags] Fetching from server: ${key}`, {
				url: `${config.apiUrl}/v1/flags/evaluate`,
				body: requestBody,
			});
			console.log(`[Databuddy Flags] Request details for ${key}:`, {
				hasConfig: !!config,
				hasUser: !!config.user,
				userId: config.user?.userId || 'MISSING',
				email: config.user?.email || 'MISSING',
				websiteId: config.websiteId || 'MISSING',
				organizationId: config.organizationId || 'MISSING',
			});
		}

		try {
			const response = await fetch(`${config.apiUrl}/v1/flags/evaluate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
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

	/**
	 * @param key - Flag identifier
	 */
	const isEnabled = (key: string): boolean => {
		if (memoryFlags[key]) {
			return memoryFlags[key].enabled;
		}
		getFlag(key);
		return false;
	};

	/**
	 * @param key - Flag identifier
	 * @param defaultValue - Default value if flag not found
	 */
	const getValue = (key: string, defaultValue = false): boolean => {
		if (memoryFlags[key]) {
			return memoryFlags[key].value ?? defaultValue;
		}

		getFlag(key);
		return defaultValue;
	};

	const refresh = async (): Promise<void> => {
		if (config?.debug) {
			console.log('[Databuddy Flags] Refreshing all flags');
		}

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
	};

	/**
	 * @param user - User context for targeting
	 */
	const updateUser = (user: FlagsConfig['user']) => {
		if (config) {
			flagsStore.set(configAtom, { ...config, user });
			refresh();
		}
	};

	return {
		isEnabled,
		getValue,
		updateUser,
		refresh,
	};
}
