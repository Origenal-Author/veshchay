'use client'

import { useWeather } from './WeatherProvider'

const themes = [
  { key: 'night', icon: '🌙', label: 'НОЧЬ' },
  { key: 'clear', icon: '☀️', label: 'ЯСНО' },
  { key: 'rain',  icon: '🌧️', label: 'ДОЖДЬ' },
  { key: 'snow',  icon: '❄️', label: 'СНЕГ' },
  { key: 'storm', icon: '⛈️', label: 'ГРОЗА' },
  { key: 'fog',   icon: '🌫️', label: 'ТУМАН' },
] as const

export default function WeatherSwitcher() {
  const { weather, setWeather } = useWeather()

  return (
    <div className="weather-switcher">
      <span className="weather-switcher-label">// ПОГОДА:</span>
      {themes.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`weather-btn${weather === key ? ' active' : ''}`}
          onClick={() => setWeather(key)}
        >
          <span>{icon}</span> {label}
        </button>
      ))}
    </div>
  )
}
