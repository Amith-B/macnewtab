import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Toggle from "../../toggle/Toggle";
import { Select } from "../../select/Select";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import { translation } from "../../../locale/languages";
import { ReactComponent as ShowIcon } from "./show.svg";
import { ReactComponent as HideIcon } from "./hide.svg";
import "./WeatherSettings.css";

interface SearchResult {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

const temperatureUnitOptions = [
  { label: "°C", value: "celsius" },
  { label: "°F", value: "fahrenheit" },
];

const WeatherSettings = memo(function WeatherSettings() {
  const {
    showWeather,
    setShowWeather,
    weatherTempUnit,
    setWeatherTempUnit,
    weatherLocationMode,
    setWeatherLocationMode,
    weatherManualLocation,
    setWeatherManualLocation,
    weatherApiKey,
    setWeatherApiKey,
    locale,
  } = useContext(AppContext);

  const [apiKeyInput, setApiKeyInput] = useState(weatherApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input when weatherApiKey changes externally
  useEffect(() => {
    setApiKeyInput(weatherApiKey || "");
  }, [weatherApiKey]);

  const handleApiKeySave = useCallback(() => {
    const trimmed = apiKeyInput.trim();
    setWeatherApiKey(trimmed);
    // Clear weather cache so it re-fetches with new key
    localStorage.removeItem("macnewtab_weather_cache");
  }, [apiKeyInput, setWeatherApiKey]);

  const handleApiKeyInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleApiKeySave();
      }
    },
    [handleApiKeySave],
  );

  const searchCity = useCallback(
    async (query: string) => {
      if (query.length < 2 || !weatherApiKey) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/search.json?key=${encodeURIComponent(weatherApiKey)}&q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [weatherApiKey],
  );

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchCity(value);
      }, 300);
    },
    [searchCity],
  );

  const handleCitySelect = useCallback(
    (result: SearchResult) => {
      setWeatherManualLocation({
        latitude: result.lat,
        longitude: result.lon,
        name: result.name,
      });
      setSearchQuery("");
      setSearchResults([]);
      // Clear weather cache so it re-fetches
      localStorage.removeItem("macnewtab_weather_cache");
    },
    [setWeatherManualLocation],
  );

  const handleModeToggle = useCallback(() => {
    const newMode = weatherLocationMode === "auto" ? "manual" : "auto";
    setWeatherLocationMode(newMode);
    // Clear weather cache so it re-fetches with new location
    localStorage.removeItem("macnewtab_weather_cache");
  }, [weatherLocationMode, setWeatherLocationMode]);

  return (
    <div className="weather-settings__container">
      <div className="weather-settings__row-item">
        <Translation value="show_weather" />
        <Toggle
          id="weather-toggle"
          name="Weather widget toggle"
          isChecked={showWeather}
          handleToggleChange={() => setShowWeather(!showWeather)}
        />
      </div>

      {showWeather && (
        <div className="weather-settings__api-key-section">
          <div className="weather-settings__city-label">
            <Translation value="weather_api_key" />
          </div>
          <div className="weather-settings__api-key-row">
            <div className="weather-settings__api-key-input-wrapper">
              <input
                className="weather-settings__search-input"
                type={showApiKey ? "text" : "password"}
                placeholder={
                  translation[locale]?.weather_api_key_placeholder ||
                  "Enter your WeatherAPI.com key"
                }
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onBlur={handleApiKeySave}
                onKeyDown={handleApiKeyInputKeyDown}
              />
              <button
                className="weather-settings__api-key-toggle"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <HideIcon /> : <ShowIcon />}
              </button>
            </div>
          </div>
          <div className="weather-settings__api-key-links">
            <a
              href="https://www.weatherapi.com/signup.aspx"
              target="_blank"
              rel="noreferrer"
              className="weather-settings__get-key-link"
            >
              {translation[locale]?.weather_get_api_key ||
                "Get your free API key"}{" "}
              ↗
            </a>
          </div>
        </div>
      )}

      <div
        className={
          "weather-settings__row-item" + (!showWeather ? " disabled" : "")
        }
      >
        <Translation value="weather_temperature_unit" />
        <Select
          id="weather-temp-unit-select"
          name="Temperature unit select"
          options={temperatureUnitOptions}
          value={weatherTempUnit}
          onChange={(event) => setWeatherTempUnit(event.target.value)}
        />
      </div>

      <div
        className={
          "weather-settings__row-item" + (!showWeather ? " disabled" : "")
        }
      >
        <Translation value="weather_manual_location" />
        <Toggle
          id="weather-location-mode-toggle"
          name="Location mode toggle"
          isChecked={weatherLocationMode === "manual"}
          handleToggleChange={handleModeToggle}
        />
      </div>

      {showWeather && weatherLocationMode === "manual" && (
        <div className="weather-settings__city-search">
          <div className="weather-settings__city-label">
            {weatherManualLocation ? (
              <>
                <Translation value="weather_current_city" />:{" "}
                <span className="weather-settings__current-city">
                  {weatherManualLocation.name}
                </span>
              </>
            ) : (
              <Translation value="weather_search_placeholder" />
            )}
          </div>
          <div className="weather-settings__search-wrapper">
            <input
              className="weather-settings__search-input"
              type="text"
              placeholder={
                translation[locale]?.weather_search_placeholder ||
                "Search city..."
              }
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              disabled={!weatherApiKey}
            />
            {searching && (
              <div className="weather-settings__searching">...</div>
            )}
            {searchResults.length > 0 && (
              <ul className="weather-settings__search-results">
                {searchResults.map((result, index) => (
                  <li
                    key={index}
                    className="weather-settings__search-result-item"
                    onClick={() => handleCitySelect(result)}
                  >
                    <span className="weather-settings__result-name">
                      {result.name}
                    </span>
                    <span className="weather-settings__result-detail">
                      {[result.region, result.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showWeather && (
        <div className="weather-settings__powered-by">
          <a
            href="https://www.weatherapi.com/"
            target="_blank"
            rel="noreferrer"
          >
            {translation[locale]?.weather_powered_by ||
              "Powered by WeatherAPI.com"}
          </a>
        </div>
      )}
    </div>
  );
});

export default WeatherSettings;
