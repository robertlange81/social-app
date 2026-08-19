import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './vuex'
import vuetify from './plugins/vuetify'

import day from './filters/day'

Vue.use(day)

Vue.config.productionTip = false

store.dispatch('FETCH_AUTH_USER', { silent: true }).finally(() => {
  new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
  }).$mount('#app')
})
