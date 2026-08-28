import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

interface PalworldOptionsTabProps {
  serverId: number
}

interface SettingSliderProps {
  label: string
  value: number
  onChange: (val: string) => void
  min: number
  max: number
  step: number
  note?: string
}

const SettingSlider: React.FC<SettingSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  note
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-4 -mx-4 rounded-lg transition-colors group">
    <div className="flex flex-col max-w-[50%]">
      <span className="font-label-md text-on-surface">{label}</span>
      {note && <span className="text-xs text-on-surface-variant/70 mt-1">{note}</span>}
    </div>
    <div className="flex items-center gap-4 flex-1 max-w-[300px]">
      <span className="font-mono text-sm text-blue-400 w-12 text-right">{value}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-blue-500 shadow-inner group-hover:bg-surface-container-highest/80 transition-colors"
      />
    </div>
  </div>
)
SettingSlider.displayName = 'SettingSlider'

interface SettingSelectProps {
  label: string
  value: string
  onChange: (val: string) => void
  options: { label: string; value: string }[]
  note?: string
}

const SettingSelect: React.FC<SettingSelectProps> = ({ label, value, onChange, options, note }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-4 -mx-4 rounded-lg transition-colors group">
    <div className="flex flex-col max-w-[50%]">
      <span className="font-label-md text-on-surface">{label}</span>
      {note && <span className="text-xs text-on-surface-variant/70 mt-1">{note}</span>}
    </div>
    <div className="flex items-center gap-4 flex-1 max-w-[300px] justify-end">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-container border border-outline-variant/30 text-on-surface text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
)
SettingSelect.displayName = 'SettingSelect'

export const PalworldOptionsTab: React.FC<PalworldOptionsTabProps> = React.memo(({ serverId }) => {
  const [cpuLimit, setCpuLimit] = useState(4)
  const [autoStart, setAutoStart] = useState(false)
  const [autoStop, setAutoStop] = useState(false)
  const [sysInfo, setSysInfo] = useState({ totalMem: 8, cpus: 4 })
  const [isSavingMeta, setIsSavingMeta] = useState(false)

  const [gameSettings, setGameSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    window.api.system.getSystemInfo().then((info: { totalMem: number; cpus: number }) => {
      setSysInfo({
        totalMem: Math.max(2, Math.floor(info.totalMem / (1024 * 1024 * 1024))),
        cpus: info.cpus || 4
      })
    })

    window.api.server.getServerMeta(serverId).then((meta: Record<string, unknown>) => {
      if (meta) {
        if (meta.cpu) setCpuLimit(parseInt(String(meta.cpu), 10))
        if (meta.autoStart !== undefined) setAutoStart(Boolean(meta.autoStart))
        if (meta.autoStop !== undefined) setAutoStop(Boolean(meta.autoStop))
      }
    })

    window.api.palworld.getConfig(serverId).then((config: Record<string, string>) => {
      if (config) setGameSettings(config)
    })
  }, [serverId])

  const saveMetaAndConfig = async () => {
    setIsSavingMeta(true)
    await window.api.server.updateServerMeta(serverId, {
      cpu: cpuLimit,
      autoStart,
      autoStop
    })
    await window.api.server.toggleAutoStart(serverId, autoStart)
    await window.api.palworld.setConfig(serverId, gameSettings)
    setIsSavingMeta(false)
  }

  const updateGameSetting = (key: string, value: string) => {
    setGameSettings((prev) => ({ ...prev, [key]: value }))
  }

  const getFloat = (key: string, def = 1.0) => parseFloat(gameSettings[key] || String(def)) || def
  const getInt = (key: string, def = 1) => parseInt(gameSettings[key] || String(def)) || def
  const getString = (key: string, def = '') => gameSettings[key] || def

  return (
    <div className="absolute inset-0 flex min-h-0">
      <OverlayScrollbarsComponent
        className="flex-1 min-h-0 min-w-0 w-full"
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        defer
      >
        <div className="p-6 bg-transparent font-body flex flex-col gap-6 min-h-full pb-32">
          {/* Header Controls */}
          <div className="flex justify-between items-end z-20 py-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                Options
              </h2>
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={saveMetaAndConfig}
                disabled={isSavingMeta}
                className="relative overflow-hidden group bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 shadow-[0_8px_32px_rgba(59,130,246,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] px-8 py-2.5 rounded-xl font-bold transition-all hover:border-blue-500/60 hover:shadow-[0_8px_32px_rgba(59,130,246,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-blue-400 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                <Save className="w-4 h-4 relative z-10" />
                <span className="relative z-10 uppercase tracking-widest">
                  {isSavingMeta ? 'Saving...' : 'Save Settings'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Resource Slider Section */}
            <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-8 shadow-glass flex flex-col items-center">
              <div className="text-center mb-6">
                <h3 className="font-headline-lg text-headline-lg text-on-surface">
                  {cpuLimit} shared CPU cores
                </h3>
                <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mt-2">
                  Palworld automatically manages RAM usage (Up to ~32GB recommended)
                </p>
              </div>

              <div className="w-full max-w-4xl relative group">
                <div className="text-center mb-4">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                    CPU Allocation Limit
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={sysInfo.cpus}
                  step="1"
                  value={cpuLimit}
                  onChange={(e) => setCpuLimit(parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-blue-500 shadow-inner group-hover:bg-surface-container-highest/80 transition-colors"
                />
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-4 px-1">
                  <span>1 Core</span>
                  <span>{sysInfo.cpus} Cores (System Max)</span>
                </div>
              </div>
            </div>

            {/* Auto-Start / Auto-Stop Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-container-low border border-surface-container-highest hover:border-blue-500/40 transition-colors flex justify-between items-center px-6 py-4 shadow-sm rounded-xl h-16">
                <span className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
                  Start when any player joins
                </span>
                <button
                  onClick={() => setAutoStart(!autoStart)}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${autoStart ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'bg-surface-container-highest'}`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${autoStart ? 'translate-x-8 bg-background' : 'translate-x-1 bg-on-surface-variant'}`}
                  ></div>
                </button>
              </div>

              <div className="bg-surface-container-low border border-surface-container-highest hover:border-blue-500/40 transition-colors flex justify-between items-center px-6 py-4 shadow-sm rounded-xl h-16">
                <span className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
                  Stop when empty for 15 mins
                </span>
                <button
                  onClick={() => setAutoStop(!autoStop)}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${autoStop ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'bg-surface-container-highest'}`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${autoStop ? 'translate-x-8 bg-background' : 'translate-x-1 bg-on-surface-variant'}`}
                  ></div>
                </button>
              </div>
            </div>

            {/* Game Settings */}
            {Object.keys(gameSettings).length > 0 && (
              <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-8 shadow-glass">
                <h3 className="font-headline-sm text-headline-sm text-blue-400 mb-6 uppercase tracking-widest">
                  Game Settings
                </h3>

                <div className="flex flex-col gap-1">
                  <SettingSlider
                    label="Day Time Speed"
                    value={getFloat('DayTimeSpeedRate')}
                    onChange={(v: string) =>
                      updateGameSetting('DayTimeSpeedRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Night Time Speed"
                    value={getFloat('NightTimeSpeedRate')}
                    onChange={(v: string) =>
                      updateGameSetting('NightTimeSpeedRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="EXP Rate"
                    value={getFloat('ExpRate')}
                    onChange={(v: string) => updateGameSetting('ExpRate', Number(v).toFixed(6))}
                    min={0}
                    max={20}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Pal Capture Rate"
                    value={getFloat('PalCaptureRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PalCaptureRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Pal Appearance Rate"
                    value={getFloat('PalSpawnNumRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PalSpawnNumRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={3}
                    step={0.1}
                    note="*Note: Affects game performance"
                  />
                  <SettingSlider
                    label="Damage from Pals Multiplier"
                    value={getFloat('PalDamageRateAttack')}
                    onChange={(v: string) =>
                      updateGameSetting('PalDamageRateAttack', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Damage to Pals Multiplier"
                    value={getFloat('PalDamageRateDefense')}
                    onChange={(v: string) =>
                      updateGameSetting('PalDamageRateDefense', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Pal Hunger Depletion Rate"
                    value={getFloat('PalStomachDecreaceRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PalStomachDecreaceRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Pal Stamina Reduction Rate"
                    value={getFloat('PalStaminaDecreaceRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PalStaminaDecreaceRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Pal Auto Health Regeneration Rate"
                    value={getFloat('PalAutoHPRegeneRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PalAutoHPRegeneRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Damage from Player Multiplier"
                    value={getFloat('PlayerDamageRateAttack')}
                    onChange={(v: string) =>
                      updateGameSetting('PlayerDamageRateAttack', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Damage to Player Multiplier"
                    value={getFloat('PlayerDamageRateDefense')}
                    onChange={(v: string) =>
                      updateGameSetting('PlayerDamageRateDefense', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Player Hunger Depletion Rate"
                    value={getFloat('PlayerStomachDecreaceRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PlayerStomachDecreaceRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Player Stamina Reduction Rate"
                    value={getFloat('PlayerStaminaDecreaceRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PlayerStaminaDecreaceRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                  <SettingSlider
                    label="Player Auto Health Regeneration Rate"
                    value={getFloat('PlayerAutoHPRegeneRate')}
                    onChange={(v: string) =>
                      updateGameSetting('PlayerAutoHPRegeneRate', Number(v).toFixed(6))
                    }
                    min={0.1}
                    max={5}
                    step={0.1}
                  />

                  <div className="my-4 border-t border-white/5"></div>

                  <SettingSlider
                    label="Maximum Number of Dropped Items in a World"
                    value={getInt('DropItemMaxNum', 3000)}
                    onChange={(v: string) => updateGameSetting('DropItemMaxNum', v)}
                    min={0}
                    max={5000}
                    step={100}
                    note="Increasing the limit may affect processing load."
                  />
                  <SettingSlider
                    label="Maximum Number of Guild Members"
                    value={getInt('GuildPlayerMaxNum', 20)}
                    onChange={(v: string) => updateGameSetting('GuildPlayerMaxNum', v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                  <SettingSlider
                    label="Maximum number of bases for each guild"
                    value={getInt('BaseCampMaxNumInGuild', 4)}
                    onChange={(v: string) => updateGameSetting('BaseCampMaxNumInGuild', v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <SettingSlider
                    label="Maximum number of work pals at the base"
                    value={getInt('BaseCampWorkerMaxNum', 15)}
                    onChange={(v: string) => updateGameSetting('BaseCampWorkerMaxNum', v)}
                    min={1}
                    max={20}
                    step={1}
                  />

                  <div className="my-4 border-t border-white/5"></div>

                  <SettingSelect
                    label="Death Penalty"
                    value={getString('DeathPenalty', 'All')}
                    onChange={(v: string) => updateGameSetting('DeathPenalty', v)}
                    options={[
                      { label: 'None', value: 'None' },
                      { label: 'Drop items only', value: 'Item' },
                      { label: 'Drop items and equipment', value: 'ItemAndEquipment' },
                      { label: 'Drop all items and pals', value: 'All' }
                    ]}
                  />
                  <SettingSelect
                    label="Enable Raid Events"
                    value={getString('bEnableInvaderEnemy', 'True')}
                    onChange={(v: string) => updateGameSetting('bEnableInvaderEnemy', v)}
                    options={[
                      { label: 'ON', value: 'True' },
                      { label: 'OFF', value: 'False' }
                    ]}
                  />
                  <SettingSelect
                    label="Enable Predator Pals"
                    value={getString('EnablePredatorBossPal', 'True')}
                    onChange={(v: string) => updateGameSetting('EnablePredatorBossPal', v)}
                    options={[
                      { label: 'ON', value: 'True' },
                      { label: 'OFF', value: 'False' }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  )
})
PalworldOptionsTab.displayName = 'PalworldOptionsTab'
