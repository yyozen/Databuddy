export interface FlagResult {
	enabled: boolean;
	value: boolean;
	payload: any;
	reason: string;
	flagId?: string;
	flagType?: 'boolean' | 'rollout';
}

export interface FlagsConfig {
	/** Client ID for flag evaluation */
	clientId: string;
	apiUrl?: string;
	websiteId?: string;
	organizationId?: string;
	user?: {
		userId?: string;
		email?: string;
		properties?: Record<string, any>;
	};
	disabled?: boolean;
	/** Enable debug logging */
	debug?: boolean;
	/** Skip persistent storage */
	skipStorage?: boolean;
	/** Whether session is loading */
	isPending?: boolean;
}

export interface FlagsContext {
	isEnabled: (key: string) => boolean;
	getValue: (key: string, defaultValue?: boolean) => boolean;
	updateUser: (user: FlagsConfig['user']) => void;
	refresh: () => Promise<void>;
}
