import { memo, useContext } from "react";
import "./Weather.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
const getWeatherInfo = (
  code: number,
  isDay: boolean,
): { icon: string; label: string } => {
  if (code === 0) return { icon: isDay ? "☀️" : "🌙", label: "Clear sky" };
  if (code === 1) return { icon: isDay ? "🌤️" : "🌙", label: "Mainly clear" };
  if (code === 2) return { icon: "⛅", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Fog" };
  if (code === 51 || code === 53 || code === 55)
    return { icon: "🌦️", label: "Drizzle" };
  if (code === 56 || code === 57)
    return { icon: "🌧️", label: "Freezing drizzle" };
  if (code === 61 || code === 63 || code === 65)
    return { icon: "🌧️", label: "Rain" };
  if (code === 66 || code === 67) return { icon: "🌧️", label: "Freezing rain" };
  if (code === 71 || code === 73 || code === 75)
    return { icon: "❄️", label: "Snow" };
  if (code === 77) return { icon: "🌨️", label: "Snow grains" };
  if (code === 80 || code === 81 || code === 82)
    return { icon: "🌧️", label: "Rain showers" };
  if (code === 85 || code === 86) return { icon: "🌨️", label: "Snow showers" };
  if (code === 95) return { icon: "⛈️", label: "Thunderstorm" };
  if (code === 96 || code === 99)
    return { icon: "⛈️", label: "Thunderstorm with hail" };
  return { icon: "🌡️", label: "Unknown" };
};

const Weather = memo(function Weather() {
  const { locale, weatherTempUnit, weatherData, weatherLoading, weatherError } =
    useContext(AppContext);

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

  const { icon, label } = getWeatherInfo(
    weatherData.weatherCode,
    weatherData.isDay,
  );

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
      <span className="weather-label">{label}</span>
    </div>
  );
});

export default Weather;
