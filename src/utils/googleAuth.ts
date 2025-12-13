// Google OAuth configuration
export const GOOGLE_CLIENT_ID_FOR_EDGE =
  process.env.REACT_APP_EDGE_CLIENT_ID;
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
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  description?: string;
  location?: string;
  recurringEventId?: string;
}

// Get OAuth token using Chrome Identity API or Web Auth Flow
export const getGoogleAuthToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Try the standard Chrome Identity API first
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        // If that fails (e.g. on Edge or dev env with ID mismatch), try Web Auth Flow
        const redirectUrl = chrome.identity.getRedirectURL();
        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${GOOGLE_CLIENT_ID_FOR_EDGE}&response_type=token&redirect_uri=${encodeURIComponent(
          redirectUrl
        )}&scope=${encodeURIComponent(GOOGLE_SCOPES)}`;

        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true,
          },
          (responseUrl) => {
            try {
              if (chrome.runtime.lastError || !responseUrl) {
                reject(chrome.runtime.lastError || new Error("Auth failed"));
              } else {
                // Extract token from redirect URL
                const url = new URL(responseUrl);
                const params = new URLSearchParams(url.hash.substring(1)); // hash contains the access_token
                const accessToken = params.get("access_token");
                if (accessToken) {
                  resolve(accessToken);
                } else {
                  reject(new Error("No access token found"));
                }
              }
            }
            catch (error) {
              console.error(error)
            }
          }
        );
      } else {
        resolve(token);
      }
    });
  });
};

// Remove cached OAuth token
export const removeGoogleAuthToken = (token: string): Promise<void> => {
  return new Promise((resolve) => {
    // Try to remove from cache (chrome.identity)
    chrome.identity.removeCachedAuthToken({ token }, () => {
      // Even if this fails (e.g. on Edge), we can consider it "removed" locally
      // but strictly following the API:
      if (chrome.runtime.lastError) {
        console.warn(
          "Failed to remove cached token (expected on Edge):",
          chrome.runtime.lastError
        );
      }
      resolve();
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
