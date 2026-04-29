import type { Metadata } from 'next'
import './globals.css'
import { WeatherProvider } from '@/app/components/WeatherProvider'
import WeatherSwitcher from '@/app/components/WeatherSwitcher'
import EasterEggs from '@/app/components/EasterEggs'

export const metadata: Metadata = {
  title: 'ВЕЩАЙ',
  description: 'Видеохостинг нового поколения',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <WeatherProvider>
          {children}
          <WeatherSwitcher />
          <EasterEggs />
        </WeatherProvider>
      </body>
    </html>
  )
}
