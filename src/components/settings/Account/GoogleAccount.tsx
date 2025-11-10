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
            <Translation value="sign_in_description" />
          </p>
          <button
            className="google__sign-in-button button"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Translation value="signing_in" />
            ) : (
              <Translation value="sign_in_with_google" />
            )}
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
            <div className="google__user-settings-row-item with-description">
              <div className="calendar-events-toggle-row">
                <Translation value="show_calendar_events" />
                <Toggle
                  id={"calendar-events-toggle"}
                  name="Calendar events toggle"
                  isChecked={showGoogleCalendar}
                  handleToggleChange={() =>
                    setShowGoogleCalendar(!showGoogleCalendar)
                  }
                />
              </div>
              <div className="calendar-events-toggle-description">
                <Translation value="show_calendar_events_description" />
              </div>
            </div>
          </div>
          <button
            className="google__sign-out-button button"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <Translation value="signing_out" />
            ) : (
              <Translation value="sign_out" />
            )}
          </button>
        </div>
      )}
    </div>
  );
});

export default GoogleAccount;
