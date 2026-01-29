"use client";

import dayjs from "dayjs";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { useOrganizationsContext } from "@/components/providers/organizations-provider";
import { useWebsitesLight } from "@/hooks/use-websites";

type RefreshFn = () => void;

interface EventsPageContextValue {
	selectedWebsiteId: string | null;
	setSelectedWebsiteId: (id: string | null) => void;
	selectedWebsite: { id: string; name: string; domain: string } | undefined;
	websites: Array<{ id: string; name: string; domain: string }>;
	isLoadingWebsites: boolean;
	queryOptions: { websiteId?: string; organizationId?: string };
	hasQueryId: boolean;
	dateRange: {
		start_date: string;
		end_date: string;
		granularity: "daily" | "hourly";
	};
	isLoadingOrg: boolean;
	registerRefresh: (fn: RefreshFn) => () => void;
	refresh: () => void;
	isFetching: boolean;
	setIsFetching: (fetching: boolean) => void;
}

const EventsPageContext = createContext<EventsPageContextValue | null>(null);

export const DEFAULT_DATE_RANGE = {
	start_date: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
	end_date: dayjs().format("YYYY-MM-DD"),
	granularity: "daily" as const,
};

export function EventsPageProvider({ children }: { children: React.ReactNode }) {
	const { activeOrganization, isLoading: isLoadingOrg } =
		useOrganizationsContext();
	const { websites, isLoading: isLoadingWebsites } = useWebsitesLight();
	const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(
		null
	);
	const [isFetching, setIsFetching] = useState(false);
	const refreshFnsRef = useRef<Set<RefreshFn>>(new Set());

	const registerRefresh = useCallback((fn: RefreshFn) => {
		refreshFnsRef.current.add(fn);
		return () => {
			refreshFnsRef.current.delete(fn);
		};
	}, []);

	const refresh = useCallback(() => {
		for (const fn of refreshFnsRef.current) {
			fn();
		}
	}, []);

	const queryOptions = useMemo(() => {
		if (selectedWebsiteId) {
			return { websiteId: selectedWebsiteId };
		}
		if (activeOrganization?.id) {
			return { organizationId: activeOrganization.id };
		}
		return {};
	}, [selectedWebsiteId, activeOrganization?.id]);

	const hasQueryId = !!(selectedWebsiteId || activeOrganization?.id);
	const selectedWebsite = websites.find((w) => w.id === selectedWebsiteId);

	const value = useMemo(
		() => ({
			selectedWebsiteId,
			setSelectedWebsiteId,
			selectedWebsite,
			websites,
			isLoadingWebsites,
			queryOptions,
			hasQueryId,
			dateRange: DEFAULT_DATE_RANGE,
			isLoadingOrg,
			registerRefresh,
			refresh,
			isFetching,
			setIsFetching,
		}),
		[
			selectedWebsiteId,
			selectedWebsite,
			websites,
			isLoadingWebsites,
			queryOptions,
			hasQueryId,
			isLoadingOrg,
			registerRefresh,
			refresh,
			isFetching,
		]
	);

	return (
		<EventsPageContext.Provider value={value}>{children}</EventsPageContext.Provider>
	);
}

export function useEventsPageContext() {
	const context = useContext(EventsPageContext);
	if (!context) {
		throw new Error("useEventsPageContext must be used within EventsPageProvider");
	}
	return context;
}
