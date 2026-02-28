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
import "./WeatherSettings.css";

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
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
    locale,
  } = useContext(AppContext);

  const [autoCity, setAutoCity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect auto city only when weather is enabled
  useEffect(() => {
    if (!showWeather) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
            );
            const data = await res.json();
            setAutoCity(data.city || data.locality || "");
          } catch {
            setAutoCity("");
          }
        },
        () => {
          setAutoCity("");
        },
        { timeout: 10000 },
      );
    }
  }, [showWeather]);

  const searchCity = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`,
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

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
    (result: GeoResult) => {
      setWeatherManualLocation({
        latitude: result.latitude,
        longitude: result.longitude,
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

      {showWeather && weatherLocationMode === "auto" && autoCity && (
        <div className="weather-settings__city-search">
          <div className="weather-settings__city-label">
            <Translation value="weather_current_city" />
          </div>
          <div className="weather-settings__current-city">{autoCity}</div>
        </div>
      )}

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
                      {[result.admin1, result.country]
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
    </div>
  );
});

export default WeatherSettings;
