const API_BASE_URL = "http://localhost:5000/api";
const USER_ID_KEY = "mediclock_user_id";
const DEMO_EMAIL = "demo@mediclock.local";

const isLikelyObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

export const getOrCreateCurrentUserId = async () => {
  if (typeof window === "undefined") {
    throw new Error("User session requires browser environment");
  }

  const cachedId = localStorage.getItem(USER_ID_KEY);
  if (cachedId && isLikelyObjectId(cachedId)) {
    // Validate cached id still exists and belongs to the demo account used by this app flow.
    const userByIdRes = await fetch(`${API_BASE_URL}/users/${cachedId}`);
    if (userByIdRes.ok) {
      const userById = await userByIdRes.json();
      if (String(userById?.email || '').toLowerCase() === DEMO_EMAIL) {
        return cachedId;
      }
    }
    localStorage.removeItem(USER_ID_KEY);
  } else if (cachedId) {
    // Clear legacy/stale ids like "demo-user".
    localStorage.removeItem(USER_ID_KEY);
  }

  // Try creating a deterministic demo user first.
  const createRes = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Demo User",
      email: DEMO_EMAIL,
      password: "demo12345",
    }),
  });

  const createJson = await createRes.json();
  if (createRes.ok && createJson?.userId) {
    localStorage.setItem(USER_ID_KEY, String(createJson.userId));
    return String(createJson.userId);
  }

  // If user already exists, resolve by email.
  const usersRes = await fetch(`${API_BASE_URL}/users`);
  if (!usersRes.ok) {
    throw new Error("Unable to resolve user session");
  }

  const users = await usersRes.json();
  const existing = Array.isArray(users)
    ? users.find((u) => String(u.email || "").toLowerCase() === DEMO_EMAIL)
    : null;

  if (!existing?._id) {
    throw new Error("Failed to resolve current user");
  }

  localStorage.setItem(USER_ID_KEY, String(existing._id));
  return String(existing._id);
};
