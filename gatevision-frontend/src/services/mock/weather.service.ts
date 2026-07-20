import type { WeatherInfo } from "@/features/dashboard/types";

const MOCK_WEATHER: WeatherInfo = {
  temperature: 24,
  condition: "Partly Cloudy",
  icon: "partly-cloudy",
  humidity: 58,
  windSpeed: 12,
};

export async function getWeather(): Promise<WeatherInfo> {
  return MOCK_WEATHER;
}
