import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Download, CheckCircle, XCircle } from 'lucide-react'
import { useModalStore } from '../../store/useModalStore'

export const ModSyncModal: React.FC = () => {
  const { modSyncModalConfig, closeModSyncModal } = useModalStore()
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Initializing sync...')
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!modSyncModalConfig.isOpen || !modSyncModalConfig.url) return

    // url format: omnihost://join/<hostIp>/<port>/<gameId>/<serverId>
    const urlStr = modSyncModalConfig.url.replace('omnihost://join/', '')
    const parts = urlStr.split('/')
    if (parts.length < 4) {
      setError('Invalid join link format.')
      return
    }

    const [hostIp, portStr, gameId, serverIdStr] = parts
    const port = parseInt(portStr, 10)
    const serverId = parseInt(serverIdStr, 10)

    // For now, we assume 7 Days to Die as per our default example.
    const appId = 251570
    const gameFolderName = '7 Days To Die'

    // @ts-ignore
    window.api.server.onModSyncProgress((newProgress: number, text: string) => {
      setProgress(newProgress)
      setStatusText(text)
    })

    // @ts-ignore
    window.api.system
      .startModSync(hostIp, port, gameId, serverId, appId, gameFolderName)
      .then((res: { success: boolean; message?: string }) => {
        if (res.success) {
          setIsComplete(true)
          setTimeout(() => {
            closeModSyncModal()
            // Actually launching the game is done by the client or can be triggered here.
            // But we already assume client side handles it or we just close.
          }, 2000)
        } else {
          setError(res.message || 'An error occurred during sync.')
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Unknown error.')
      })
  }, [modSyncModalConfig])

  if (!modSyncModalConfig.isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md p-6 overflow-hidden border shadow-2xl bg-zinc-900 border-zinc-800 rounded-2xl"
        >
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            {!error && !isComplete && (
              <div className="p-4 rounded-full bg-blue-500/10 text-blue-400">
                <Download size={48} className="animate-pulse" />
              </div>
            )}

            {isComplete && (
              <div className="p-4 text-green-400 rounded-full bg-green-500/10">
                <CheckCircle size={48} />
              </div>
            )}

            {error && (
              <div className="p-4 text-red-400 rounded-full bg-red-500/10">
                <XCircle size={48} />
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-zinc-100">
                {isComplete ? 'Sync Complete!' : error ? 'Sync Failed' : 'Syncing Mods...'}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{error || statusText}</p>
            </div>

            {!error && !isComplete && (
              <div className="w-full">
                <div className="w-full h-2 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-zinc-500">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}

            {error && (
              <button
                onClick={closeModSyncModal}
                className="w-full py-2.5 text-sm font-medium transition-colors bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
