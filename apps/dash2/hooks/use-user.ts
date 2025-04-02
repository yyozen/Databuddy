import { useUser as useAuthUser } from "@databuddy/auth/client";

export function useUser() {
  const { user, isLoading } = useAuthUser();

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
} 