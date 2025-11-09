// Google OAuth configuration
export const GOOGLE_CLIENT_ID =
  "685848442779-bigfu97dhb03jc3ju4buadl23uop006f.apps.googleusercontent.com";
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
  location?: string;
  recurringEventId?: string;
}

// Get OAuth token using Chrome Identity API
export const getGoogleAuthToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
};

// Remove cached OAuth token
export const removeGoogleAuthToken = (token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

// Fetch user profile from Google
export const fetchGoogleUserProfile = async (
  token: string
): Promise<GoogleUser> => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
};

// Fetch calendar events from Google Calendar API
export const fetchGoogleCalendarEvents = async (
  token: string,
  maxResults: number = 100
): Promise<GoogleCalendarEvent[]> => {
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString(); // 30 days ahead

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.append("timeMin", timeMin);
  url.searchParams.append("timeMax", timeMax);
  url.searchParams.append("maxResults", String(maxResults));
  url.searchParams.append("orderBy", "startTime");
  url.searchParams.append("singleEvents", "true");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch calendar events");
  }

  const data = await response.json();
  return data.items || [];
};

export const getIdentityPermissionAccess = async () => {
  const hasIdentityPermission = await new Promise((resolve) =>
    chrome.permissions.contains({ permissions: ["identity"] }, resolve)
  );

  if (!hasIdentityPermission) {
    const permissionGranted = await new Promise((resolve) =>
      chrome.permissions.request({ permissions: ["identity"] }, resolve)
    );

    if (!permissionGranted) {
      return false;
    }
  }

  return true;
};
