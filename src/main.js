import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './vuex'
import vuetify from './plugins/vuetify'

import day from './filters/day'

Vue.use(day)

Vue.config.productionTip = false
vuetify.framework.theme.dark = localStorage.getItem('herzklang-dark-mode') === 'true'

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/service-worker.js')

store.dispatch('FETCH_AUTH_USER', { silent: true }).finally(() => {
  new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
  }).$mount('#app')
})
