import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.luchik.android',
  appName: 'Лучик',
  webDir: 'dist',
  backgroundColor: '#FFF6E4',
  server: {
    androidScheme: 'https',
  },
}

export default config
