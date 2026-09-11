import React, { useEffect } from 'react'

interface Props {
  serverId: number
}

export const SevenDaysToDieCommunityModsTab: React.FC<Props> = ({ serverId }) => {
  useEffect(() => {
    // Register active server for downloads
    // @ts-ignore
    window.api.sevenDaysToDie.setActiveDownloadServer(serverId)

    return () => {
      // Unregister on unmount
      // @ts-ignore
      window.api.sevenDaysToDie.setActiveDownloadServer(null)
    }
  }, [serverId])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 overflow-hidden bg-black/60 p-8 text-center">
      <h2 className="sevendays-title text-3xl">COMMUNITY MODS</h2>
      <p className="max-w-xl text-[var(--7dtd-text-dim)]">
        Community mod sites open in your browser so their content cannot access OmniHost.
      </p>
      <a
        href="https://7daystodiemods.com/"
        target="_blank"
        rel="noreferrer"
        className="sevendays-btn px-8 py-3 text-lg"
      >
        OPEN 7 DAYS TO DIE MODS
      </a>
    </div>
  )
}
