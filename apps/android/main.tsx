import { boot } from '../../src/boot'
import { requestBack } from '../../src/platform'

boot('android')

const bridge = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor
if (bridge?.getPlatform?.() === 'android') {
  void import('@capacitor/app').then(({ App }) => {
    void App.addListener('backButton', () => {
      if (!requestBack()) void App.exitApp()
    })
  })
}
