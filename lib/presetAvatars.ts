export const PRESET_AVATARS = [
  { key: 'skull',  label: '☠ ЧЕРЕП',   bg: '#150505', fg: '#FF006E', text: '☠'   },
  { key: 'glitch', label: '/// ГЛИТЧ',  bg: '#001212', fg: '#00FFF0', text: '///' },
  { key: 'npc',    label: '▣ НПС',      bg: '#111111', fg: '#888888', text: 'NPC' },
  { key: '404',    label: '✕ 404',      bg: '#120005', fg: '#FF2060', text: '404' },
  { key: 'virus',  label: '◈ ВИРУС',    bg: '#001205', fg: '#00FF88', text: 'VRS' },
  { key: 'hacked', label: '⚡ ВЗЛОМАН', bg: '#150a00', fg: '#FFD700', text: '⚡'  },
] as const

export type PresetKey = typeof PRESET_AVATARS[number]['key']

export function getPreset(key: string) {
  return PRESET_AVATARS.find(p => p.key === key) ?? PRESET_AVATARS[5]
}
