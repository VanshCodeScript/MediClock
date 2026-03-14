const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    return String(envBase).replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5001/api/v1`;
  }

  return "http://localhost:5001/api/v1";
};

const API_BASE_URL = getApiBaseUrl();
const USER_ID_KEY = "mediclock_user_id";
const USER_CACHE_KEY = "mediclock_user";
const TOKEN_KEY = "mediclock_token";

const isLikelyObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

const cacheUserId = (user: unknown): string | null => {
  if (!user || typeof user !== "object") return null;
  const maybeId = (user as { _id?: unknown })._id;
  if (typeof maybeId === "string" && isLikelyObjectId(maybeId)) {
    localStorage.setItem(USER_ID_KEY, maybeId);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    return maybeId;
  }
  return null;
};

const resolveUserIdFromToken = async (): Promise<string | null> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const user = await response.json();
    return cacheUserId(user);
  } catch {
    return null;
  }
};

export const getOrCreateCurrentUserId = async (): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("User session requires browser environment");
  }

  // Prefer the authenticated user set during login/register.
  const storedUser = localStorage.getItem(USER_CACHE_KEY);
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      const cachedFromUser = cacheUserId(parsed);
      if (cachedFromUser) return cachedFromUser;
    } catch {
      // malformed, fall through
    }
  }

  const cachedId = localStorage.getItem(USER_ID_KEY);
  if (cachedId && isLikelyObjectId(cachedId)) {
    return cachedId;
  }

  const resolvedFromToken = await resolveUserIdFromToken();
  if (resolvedFromToken) {
    return resolvedFromToken;
  }

  throw new Error("No authenticated user found. Please log in again.");
};
