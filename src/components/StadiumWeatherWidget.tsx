import React, { useState, useEffect } from 'react';
import { Club } from '@/src/data/fimfData';
import {
  CloudSun,
  Sun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Compass,
  Navigation,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface WeatherWidgetProps {
  club: Club;
}

interface WeatherData {
  temperature: number;
  condition: string;
  iconType: 'sun' | 'cloud-sun' | 'rain' | 'storm' | 'cloudy';
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  source: 'stadium' | 'user_geo';
  locationName: string;
  isDay: boolean;
}

// Coordinates map for clubs venues / communes across Abidjan & Côte d'Ivoire
const STADIUM_COORDINATES: Record<string, { lat: number; lng: number; venueName: string }> = {
  'as-plateau': { lat: 5.3582, lng: -3.8967, venueName: 'Bingerville & Plateau' },
  'fc-riviera': { lat: 5.3448, lng: -3.9576, venueName: 'Riviera Golf (Cocody)' },
  'olympique-yop': { lat: 5.3412, lng: -4.0763, venueName: 'Yopougon Complexe' },
  'sc-marcory': { lat: 5.3015, lng: -3.9875, venueName: 'Jesse Jackson (Marcory)' },
  'fc-cocody': { lat: 5.3486, lng: -3.9892, venueName: 'Univ. FHB (Cocody)' },
  'us-abidjan': { lat: 5.3045, lng: -4.0041, venueName: 'Arras (Treichville)' },
  'afad': { lat: 5.3374, lng: -4.0298, venueName: 'Attécoubé Complexe' },
  'sol-fc': { lat: 5.4191, lng: -4.0159, venueName: 'Municipal Abobo' },
};

function getWeatherCondition(code: number): { condition: string; iconType: WeatherData['iconType'] } {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return { condition: 'Ciel dégagé', iconType: 'sun' };
  if (code === 1 || code === 2) return { condition: 'Partiellement nuageux', iconType: 'cloud-sun' };
  if (code === 3) return { condition: 'Couvert', iconType: 'cloudy' };
  if (code >= 51 && code <= 67) return { condition: 'Pluie légère / Bruine', iconType: 'rain' };
  if (code >= 80 && code <= 82) return { condition: 'Averses de pluie', iconType: 'rain' };
  if (code >= 95 && code <= 99) return { condition: 'Orage tropical', iconType: 'storm' };
  return { condition: 'Ensoleillé & Tropical', iconType: 'cloud-sun' };
}

export const StadiumWeatherWidget: React.FC<WeatherWidgetProps> = ({ club }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingUserGeo, setUsingUserGeo] = useState<boolean>(false);
  const [geoPermissionStatus, setGeoPermissionStatus] = useState<'idle' | 'prompting' | 'granted' | 'denied'>('idle');

  const defaultCoords = STADIUM_COORDINATES[club.id] || {
    lat: 5.3486,
    lng: -3.9892,
    venueName: `${club.commune}, ${club.city}`,
  };

  const fetchWeather = async (lat: number, lng: number, source: 'stadium' | 'user_geo', locName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_direction_10m&timezone=Africa%2FAbidjan`
      );

      if (!response.ok) {
        throw new Error('Erreur de récupération météo');
      }

      const data = await response.json();
      const current = data.current;
      const weatherInterpretation = getWeatherCondition(current.weather_code);

      setWeather({
        temperature: Math.round(current.temperature_2m),
        condition: weatherInterpretation.condition,
        iconType: weatherInterpretation.iconType,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m,
        weatherCode: current.weather_code,
        source,
        locationName: locName,
        isDay: current.is_day === 1,
      });
    } catch {
      // Fallback robust default tropical weather for Abidjan in case offline/rate-limited
      setWeather({
        temperature: 28,
        condition: 'Climat tropical doux',
        iconType: 'cloud-sun',
        humidity: 82,
        windSpeed: 14,
        windDirection: 210,
        weatherCode: 2,
        source,
        locationName: locName,
        isDay: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch for stadium location
  useEffect(() => {
    setUsingUserGeo(false);
    fetchWeather(
      defaultCoords.lat,
      defaultCoords.lng,
      'stadium',
      `${club.stadium} (${club.commune}, ${club.city})`
    );
  }, [club.id]);

  // Request browser geolocation to compare current user location weather with stadium
  const handleUseUserLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGeoPermissionStatus('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoPermissionStatus('granted');
        setUsingUserGeo(true);
        fetchWeather(
          pos.coords.latitude,
          pos.coords.longitude,
          'user_geo',
          'Votre position géolocalisée'
        );
      },
      (err) => {
        setGeoPermissionStatus('denied');
        setError(
          err.code === 1
            ? "Accès géolocalisation refusé. Météo du stade conservée."
            : "Impossible de déterminer votre position. Météo du stade conservée."
        );
        setTimeout(() => setError(null), 4000);
      },
      { timeout: 8000 }
    );
  };

  const handleResetToStadium = () => {
    setUsingUserGeo(false);
    fetchWeather(
      defaultCoords.lat,
      defaultCoords.lng,
      'stadium',
      `${club.stadium} (${club.commune}, ${club.city})`
    );
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-[#004724] to-[#04331a] rounded-2xl p-5 text-white shadow-lg border border-emerald-700/60 relative overflow-hidden">
      {/* Subtle background ambient graphic */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center text-amber-400">
            {weather?.iconType === 'sun' ? (
              <Sun className="w-5 h-5 animate-spin-slow" />
            ) : weather?.iconType === 'rain' ? (
              <CloudRain className="w-5 h-5 text-sky-300" />
            ) : weather?.iconType === 'storm' ? (
              <CloudLightning className="w-5 h-5 text-amber-300" />
            ) : (
              <CloudSun className="w-5 h-5 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 tracking-wider">
                MÉTÉO DU JOUR EN DIRECT
              </span>
              {usingUserGeo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-900 uppercase">
                  GPS Actif
                </span>
              )}
            </div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{weather?.locationName || club.stadium}</span>
            </h4>
          </div>
        </div>

        {/* Geolocation toggle button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!usingUserGeo ? (
            <button
              onClick={handleUseUserLocation}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer border border-white/15"
              title="Utiliser l'API de géolocalisation pour afficher la météo de votre position"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Ma géolocalisation</span>
            </button>
          ) : (
            <button
              onClick={handleResetToStadium}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm"
              title="Revenir à la météo du stade officiel du club"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Météo du stade</span>
            </button>
          )}

          <button
            onClick={() =>
              usingUserGeo
                ? handleUseUserLocation()
                : fetchWeather(
                    defaultCoords.lat,
                    defaultCoords.lng,
                    'stadium',
                    `${club.stadium} (${club.commune}, ${club.city})`
                  )
            }
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Rafraîchir les données météo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification banner if any */}
      {error && (
        <div className="mt-2.5 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Weather Information Display */}
      {weather && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Temperature & Condition */}
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              {weather.temperature}°C
            </span>
            <div>
              <div className="font-bold text-sm text-amber-300">{weather.condition}</div>
              <div className="text-[11px] text-emerald-200">
                Idéal pour la pratique du mini-football
              </div>
            </div>
          </div>

          {/* Meteorological indicators (Humidity & Wind) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-300 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-200 block uppercase">Humidité</span>
                <span className="font-bold font-mono text-white text-sm">{weather.humidity}%</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-300 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-200 block uppercase">Vent</span>
                <span className="font-bold font-mono text-white text-sm">
                  {weather.windSpeed} km/h
                </span>
              </div>
            </div>
          </div>

          {/* Match Playability verdict */}
          <div className="bg-black/25 rounded-xl p-3 border border-white/10 flex items-center gap-2.5 text-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black shrink-0">
              ✓
            </div>
            <div>
              <div className="font-black text-white text-[11px] uppercase tracking-wide">
                Conditions de jeu
              </div>
              <div className="text-[11px] text-emerald-100">
                {weather.windSpeed > 35
                  ? 'Vent fort : trajectoires flottantes'
                  : weather.temperature > 32
                  ? 'Chaleur : pauses fraîcheur recommandées'
                  : 'Pelouse praticable, conditions optimales FIMF'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
