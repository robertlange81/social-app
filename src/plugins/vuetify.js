import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import mdiSvgIcons from 'vuetify/lib/services/icons/presets/mdi-svg'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg',
    values: mdiSvgIcons
  }
})
