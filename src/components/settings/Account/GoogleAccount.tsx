import { memo, useContext, useState } from "react";
import "./GoogleAccount.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import { getIdentityPermissionAccess } from "../../../utils/googleAuth";
import Toggle from "../../toggle/Toggle";

const GoogleAccount = memo(function Google() {
  const {
    googleUser,
    handleGoogleSignIn,
    handleGoogleSignOut,
    showGoogleCalendar,
    setShowGoogleCalendar,
    showEventsCalendarWidget,
    setShowEventsCalendarWidget,
  } = useContext(AppContext);

  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    const permissionGranted = await getIdentityPermissionAccess();
    if (!permissionGranted) {
      return;
    }
    setIsLoading(true);
    try {
      await handleGoogleSignIn();
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await handleGoogleSignOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="google__container">
      {!googleUser ? (
        <>
          <p className="google-signin_description">
            To access Google Calendar, please sign in with your Google account.
          </p>
          <button
            className="google__sign-in-button button"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {
              isLoading
                ? "Signing In"
                : // <Translation value="signing_in" />
                  "Sign in with Google"
              // <Translation value="sign_in_with_google" />
            }
          </button>
        </>
      ) : (
        <div className="google__container-signed-in">
          <div className="google__user-details">
            {googleUser.picture && (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                className="google__user-avatar"
              />
            )}
            <div className="google__user-text">
              <div className="google__user-name">{googleUser.name}</div>
              <div className="google__user-email">{googleUser.email}</div>
            </div>
          </div>
          <div className="google__user-settings">
            <div className="google__user-settings-row-item">
              Show Calendar Events
              <Toggle
                id={"calendar-events-toggle"}
                name="Calendar events toggle"
                isChecked={showGoogleCalendar}
                handleToggleChange={() =>
                  setShowGoogleCalendar(!showGoogleCalendar)
                }
              />
            </div>
            <div className="google__user-settings-row-item">
              Show Events Calendar Widget
              <Toggle
                id={"show-events-toggle"}
                name="Events calendar toggle"
                isChecked={showEventsCalendarWidget}
                handleToggleChange={() =>
                  setShowEventsCalendarWidget(!showEventsCalendarWidget)
                }
              />
            </div>
          </div>
          <button
            className="google__sign-out-button button"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {
              isLoading
                ? "Signing Out"
                : //   <Translation value="signing_out" />
                  "Sign Out"
              //   <Translation value="sign_out" />
            }
          </button>
        </div>
      )}
    </div>
  );
});

export default GoogleAccount;
