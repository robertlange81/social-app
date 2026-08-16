import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './vuex'
import vuetify from './plugins/vuetify'

import day from './filters/day'

import jwtDecode from 'jwt-decode'

Vue.use(day)

const token = localStorage.getItem('authToken')

if (token) {
  try {
    const decodedToken = jwtDecode(token)
    if (decodedToken.exp * 1000 > Date.now()) {
      store.dispatch('AUTH_USER', token)
    } else {
      store.dispatch('LOGOUT_USER')
    }
  } catch (e) {
    store.dispatch('LOGOUT_USER')
  }
}

Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
