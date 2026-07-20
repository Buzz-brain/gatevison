import { useState, useEffect } from "react";
import { CloudSun, Droplets, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getWeather } from "@/services/mock/weather.service";
import type { WeatherInfo } from "../types";

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    getWeather().then(setWeather);
  }, []);

  if (!weather) return null;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Weather</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold">{weather.temperature}°</span>
            <span className="text-xs text-muted-foreground/70">{weather.condition}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              {weather.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              {weather.windSpeed} km/h
            </span>
          </div>
        </div>
        <CloudSun className="h-8 w-8 text-warning/70" />
      </div>
    </Card>
  );
}

export { WeatherWidget };
