import { memo, useContext } from "react";
import "./Weather.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";

// WeatherAPI.com condition code → emoji mapping
// https://www.weatherapi.com/docs/#weather-icons
const getWeatherEmoji = (code: number, isDay: boolean): string => {
  // Sunny / Clear
  if (code === 1000) return isDay ? "☀️" : "🌙";
  // Partly cloudy
  if (code === 1003) return isDay ? "🌤️" : "🌙";
  // Cloudy
  if (code === 1006) return "⛅";
  // Overcast
  if (code === 1009) return "☁️";
  // Mist, Fog, Freezing fog
  if (code === 1030 || code === 1135 || code === 1147) return "🌫️";
  // Drizzle variants
  if (
    code === 1150 ||
    code === 1153 ||
    code === 1168 ||
    code === 1171
  )
    return "🌦️";
  // Rain variants
  if (
    code === 1063 ||
    code === 1180 ||
    code === 1183 ||
    code === 1186 ||
    code === 1189 ||
    code === 1192 ||
    code === 1195 ||
    code === 1240 ||
    code === 1243 ||
    code === 1246
  )
    return "🌧️";
  // Freezing rain / sleet
  if (
    code === 1069 ||
    code === 1072 ||
    code === 1198 ||
    code === 1201 ||
    code === 1204 ||
    code === 1207 ||
    code === 1237 ||
    code === 1249 ||
    code === 1252
  )
    return "🌧️";
  // Snow variants
  if (
    code === 1066 ||
    code === 1114 ||
    code === 1117 ||
    code === 1210 ||
    code === 1213 ||
    code === 1216 ||
    code === 1219 ||
    code === 1222 ||
    code === 1225 ||
    code === 1255 ||
    code === 1258 ||
    code === 1261 ||
    code === 1264
  )
    return "❄️";
  // Thunderstorm variants
  if (code === 1087 || code === 1273 || code === 1276 || code === 1279 || code === 1282)
    return "⛈️";
  return "🌡️";
};

const Weather = memo(function Weather() {
  const {
    locale,
    weatherTempUnit,
    weatherData,
    weatherLoading,
    weatherError,
    setOpenSettingsToWeather,
  } = useContext(AppContext);

  const tempSymbol = weatherTempUnit === "fahrenheit" ? "°F" : "°C";

  if (weatherLoading) {
    return (
      <div className="weather-widget weather-loading">
        <span className="weather-icon">🌡️</span>
        <span className="weather-text">
          {translation[locale]?.weather_loading || "Loading weather..."}
        </span>
      </div>
    );
  }

  if (weatherError === "weather_api_key_needed") {
    return (
      <div
        className="weather-widget weather-api-key-needed"
        onClick={() => setOpenSettingsToWeather(true)}
        title={
          translation[locale]?.weather_api_key_needed || "API key needed"
        }
      >
        <span className="weather-icon">🔑</span>
        <span className="weather-text">
          {translation[locale]?.weather_api_key_needed || "API key needed"}
        </span>
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className="weather-widget weather-error">
        <span className="weather-icon">🌡️</span>
        <span className="weather-text">
          {translation[locale]?.[
            weatherError as keyof (typeof translation)[typeof locale]
          ] || weatherError}
        </span>
      </div>
    );
  }

  if (!weatherData) return null;

  const icon = getWeatherEmoji(weatherData.conditionCode, weatherData.isDay);

  return (
    <div className="weather-widget">
      {weatherData.cityName && (
        <span className="weather-city">{weatherData.cityName}</span>
      )}
      <div className="weather-main">
        <span className="weather-temp">
          {weatherData.temperature}
          <span className="weather-degree">{tempSymbol}</span>
        </span>
        <span className="weather-icon">{icon}</span>
      </div>
      <span className="weather-label">{weatherData.conditionText}</span>
    </div>
  );
});

export default Weather;
