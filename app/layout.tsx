import type { Metadata } from 'next'
import './globals.css'
import { WeatherProvider } from '@/app/components/WeatherProvider'
import EasterEggs from '@/app/components/EasterEggs'
import SnakeWrapper from '@/app/components/SnakeWrapper'
import DailyXP from '@/app/components/DailyXP'
import AchievementToast from '@/app/components/AchievementToast'
import InventoryPanel from '@/app/components/InventoryPanel'
import PetWalkerHost from '@/app/components/PetWalkerHost'

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
          <DailyXP />
          <AchievementToast />
          <InventoryPanel />
          <PetWalkerHost />
        </WeatherProvider>
      </body>
    </html>
  )
}
