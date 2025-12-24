import type {
	FlagType,
	FlagWithScheduleForm,
	Variant,
} from "@databuddy/shared/flags";
import type { UseFormReturn } from "react-hook-form";

export interface Flag {
	id: string;
	key: string;
	name?: string | null;
	description?: string | null;
	type: FlagType;
	status: "active" | "inactive" | "archived";
	defaultValue?: boolean;
	payload?: unknown;
	rolloutPercentage?: number | null;
	rules?: UserRule[];
	variants?: Variant[];
	dependencies?: string[];
	environment?: string;
	persistAcrossAuth?: boolean;
	websiteId?: string | null;
	organizationId?: string | null;
	userId?: string | null;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date | null;
}

export interface UserRule {
	type: "user_id" | "email" | "property";
	operator:
	| "equals"
	| "contains"
	| "starts_with"
	| "ends_with"
	| "in"
	| "not_in"
	| "exists"
	| "not_exists";
	field?: string;
	value?: string;
	values?: string[];
	enabled: boolean;
	batch: boolean;
	batchValues?: string[];
}

export type FlagStatus = "active" | "inactive" | "archived";

export interface FlagSheetProps {
	isOpen: boolean;
	onCloseAction: () => void;
	websiteId: string;
	flag?: Flag | null;
}

export interface FlagsListProps {
	flags: Flag[];
	isLoading: boolean;
	onCreateFlagAction: () => void;
	onEditFlagAction: (flag: Flag) => void;
}

export interface VariantEditorProps {
	variants: Variant[];
	onChangeAction: (variants: Variant[]) => void;
}

export interface ScheduleManagerProps {
	form: UseFormReturn<FlagWithScheduleForm>;
	flagId?: string;
}

export interface DependencySelectorProps {
	value: string[];
	onChange: (dependencies: string[]) => void;
	availableFlags: Flag[];
	currentFlagKey?: string;
}

export interface UserRulesBuilderProps {
	rules: UserRule[];
	onChange: (rules: UserRule[]) => void;
}
