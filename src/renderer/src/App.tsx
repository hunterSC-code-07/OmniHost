import { useEffect } from 'react'
import bootSound from './assets/boot-sound.mp3'
import 'overlayscrollbars/overlayscrollbars.css'

import { GlobalModalManager } from './components/modals/GlobalModalManager'
import { useIpcListeners } from './hooks/useIpcListeners'
import { useUiStore } from './store/useUiStore'

import { MainLayout } from './components/layout/MainLayout'
import { HubRouter } from './components/layout/HubRouter'
import { HUB_REGISTRY } from './components/layout/HubRegistry'

export default function App() {
  useIpcListeners()

  const { setGameCacheStatus, playBootSound, bootSoundVolume, useCustomBootSound } = useUiStore()

  useEffect(() => {
    const playAudio = async () => {
      if (!playBootSound) return

      let audioSrc: string = bootSound

      if (useCustomBootSound) {
        try {
          // @ts-ignore
          const buffer = await window.api.system.getCustomBootSound()
          if (buffer) {
            const blob = new Blob([buffer], { type: 'audio/mpeg' })
            audioSrc = URL.createObjectURL(blob)
          }
        } catch (e) {
          console.error('Failed to load custom boot sound:', e)
        }
      }

      const audio = new Audio(audioSrc)
      audio.volume = bootSoundVolume
      audio.play().catch((e) => console.error('Audio playback failed:', e))
    }

    playAudio()
  }, [])

  useEffect(() => {
    const checkCache = async () => {
      for (const [gameName, hubConfig] of Object.entries(HUB_REGISTRY)) {
        if (hubConfig.steamAppId) {
          // @ts-ignore
          const isCached = await window.api.steam.checkCache(hubConfig.steamAppId)
          setGameCacheStatus(gameName, isCached)
        }
      }
    }
    checkCache()
  }, [setGameCacheStatus])

  return (
    <MainLayout>
      <HubRouter />
      <GlobalModalManager />
    </MainLayout>
  )
}
