import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      if (localStorage.getItem("auth_token")) {
        // Only clear and redirect if we thought we were logged in
        console.warn("Session expired. Logging out.");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/auth";
      }
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use VITE_API_URL if defined (for mobile), otherwise fallback to relative path (proxy)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const token = localStorage.getItem("auth_token");
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData && data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? (data as FormData) : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      };

      const url = queryKey.join("/");
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

      const res = await fetch(fullUrl, {
        credentials: "include",
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
