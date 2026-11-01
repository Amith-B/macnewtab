import { memo, useContext } from "react";
import "./Weather.css";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";

type WeatherKind =
  | "sun" | "partly-cloudy" | "cloud" | "fog"
  | "drizzle" | "rain" | "snow" | "sleet" | "thunder" | "unknown";

// WeatherAPI.com condition codes grouped by the type of weather.
const getWeatherKind = (code: number): WeatherKind => {
  if (code === 1000) return "sun";
  if (code === 1003) return "partly-cloudy";
  if (code === 1006 || code === 1009) return "cloud";
  if ([1030, 1135, 1147].includes(code)) return "fog";
  if ([1150, 1153, 1168, 1171].includes(code)) return "drizzle";
  if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return "rain";
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return "snow";
  if ([1069, 1072, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) return "sleet";
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "thunder";
  return "unknown";
};

const WeatherIcon = memo(function WeatherIcon({
  code,
  className = "",
}: {
  code: number;
  isDay?: boolean;
  className?: string;
}) {
  // Keep the original emoji-style icon pack, but choose a clearer icon for
  // each WeatherAPI condition family.
  let icon = "🌡️";
  let kind = "unknown";
  if (code === 1000) { icon = "☀️"; kind = "sun"; }
  else if (code === 1003) { icon = "🌤️"; kind = "partly-cloudy"; }
  else if (code === 1006 || code === 1009) { icon = "☁️"; kind = "cloud"; }
  else if ([1030, 1135, 1147].includes(code)) { icon = "🌫️"; kind = "fog"; }
  else if ([1150, 1153, 1168, 1171].includes(code)) { icon = "🌦️"; kind = "drizzle"; }
  else if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) { icon = "🌧️"; kind = "rain"; }
  else if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) { icon = "❄️"; kind = "snow"; }
  else if ([1069, 1072, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) { icon = "🌨️"; kind = "sleet"; }
  else if ([1087, 1273, 1276, 1279, 1282].includes(code)) { icon = "⛈️"; kind = "thunder"; }

  return (
    <span
      className={`weather-icon-emoji weather-icon--${kind} ${className}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
});

const Weather = memo(function Weather() {
  const {
    locale,
    weatherTempUnit,
    weatherData,
    weatherLoading,
    weatherError,
    weatherForecastDisplay,
    setOpenSettingsToWeather,
  } = useContext(AppContext);

  const tempSymbol = weatherTempUnit === "fahrenheit" ? "°F" : "°C";

  if (weatherLoading) {
    return (
      <div className="weather-widget weather-loading">
        <WeatherIcon code={1000} className="weather-status-icon" />
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
        title={translation[locale]?.weather_api_key_needed || "API key needed"}
      >
        <span className="weather-status-icon" aria-hidden="true">⚙</span>
        <span className="weather-text">
          {translation[locale]?.weather_api_key_needed || "API key needed"}
        </span>
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className="weather-widget weather-error">
        <WeatherIcon code={-1} className="weather-status-icon" />
        <span className="weather-text">
          {translation[locale]?.[
            weatherError as keyof (typeof translation)[typeof locale]
          ] || weatherError}
        </span>
      </div>
    );
  }

  if (!weatherData) return null;

  if (weatherForecastDisplay === "current") {
    return (
      <div className="weather-widget weather-widget--current">
        {weatherData.cityName && <span className="weather-city">{weatherData.cityName}</span>}
        <div className="weather-main">
          <span className="weather-temp">
            {weatherData.temperature}
            <span className="weather-degree">{tempSymbol}</span>
          </span>
          <WeatherIcon code={weatherData.conditionCode} className="weather-icon" />
        </div>
        <span className="weather-label">{weatherData.conditionText}</span>
      </div>
    );
  }

  return (
    <div className={`weather-widget weather-widget--${weatherForecastDisplay}`}>
      <div className="weather-current">
        <div className="weather-current-top">
          {weatherData.cityName && <span className="weather-city">{weatherData.cityName}</span>}
          <div className="weather-main">
            <span className="weather-temp">
              {weatherData.temperature}
              <span className="weather-degree">{tempSymbol}</span>
            </span>
            <WeatherIcon code={weatherData.conditionCode} className="weather-current-icon" />
          </div>
          <span className="weather-label">{weatherData.conditionText}</span>
        </div>
      </div>

      {(weatherForecastDisplay === "3-day" || weatherForecastDisplay === "both") && (
        <div className="weather-forecast-days">
          {weatherData.forecastDays?.map((day, index) => {
            const date = new Date(`${day.date}T12:00:00`);
            const dayLabel = index === 0 ? (translation[locale]?.weather_today || "Today") : index === 1 ? (translation[locale]?.weather_tomorrow || "Tomorrow") : date.toLocaleDateString(locale, { weekday: "short" });
            return (
              <div className="weather-forecast-day" key={day.date} title={day.conditionText}>
                <span className="weather-forecast-day-name">{dayLabel}</span>
                <WeatherIcon code={day.conditionCode} className="weather-forecast-day-icon" />
                <span className="weather-forecast-day-temps">{day.maxTemperature}° <span>{day.minTemperature}°</span></span>
                <span className="weather-forecast-rain">{day.chanceOfRain}% <span aria-hidden="true">☂</span></span>
              </div>
            );
          })}
        </div>
      )}

      {(weatherForecastDisplay === "hourly" || weatherForecastDisplay === "both") && (
        <div className="weather-forecast-hourly" aria-label={translation[locale]?.weather_forecast_hourly || "Hourly forecast"}>
          {weatherData.hourlyForecast?.map((hour) => (
            <div className="weather-forecast-hour" key={hour.time}>
              <span className="weather-forecast-hour-time">{hour.time.slice(11, 16)}</span>
              <WeatherIcon code={hour.conditionCode} className="weather-forecast-hour-icon" />
              <span className="weather-forecast-hour-temp">{hour.temperature}°</span>
              <span className="weather-forecast-rain">{hour.chanceOfRain}% <span aria-hidden="true">☂</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Weather;
