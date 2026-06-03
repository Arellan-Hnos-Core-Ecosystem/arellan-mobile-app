import type { Config } from 'tailwindcss'
import arellanPreset from '@arellan-hnos-core-ecosystem/ui/tailwind'

const config: Config = {
  presets: [arellanPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../arellan-design-system/packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
