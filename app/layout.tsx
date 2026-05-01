import type { Metadata } from 'next'
import './globals.css'
import { WeatherProvider } from '@/app/components/WeatherProvider'
import EasterEggs from '@/app/components/EasterEggs'
import SnakeWrapper from '@/app/components/SnakeWrapper'

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
          <EasterEggs />
          <SnakeWrapper />
        </WeatherProvider>
      </body>
    </html>
  )
}
