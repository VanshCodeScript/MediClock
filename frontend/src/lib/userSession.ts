const USER_ID_KEY = "mediclock_user_id";

const isLikelyObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

export const getOrCreateCurrentUserId = async (): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("User session requires browser environment");
  }

  // Prefer the authenticated user set during login/register.
  const storedUser = localStorage.getItem("mediclock_user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?._id && isLikelyObjectId(parsed._id)) {
        localStorage.setItem(USER_ID_KEY, parsed._id);
        return parsed._id;
      }
    } catch {
      // malformed, fall through
    }
  }

  const cachedId = localStorage.getItem(USER_ID_KEY);
  if (cachedId && isLikelyObjectId(cachedId)) {
    return cachedId;
  }

  throw new Error("No authenticated user found. Please log in.");
};
