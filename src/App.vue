<template>
  <v-app id="app">
    <Navbar></Navbar>
    <v-content>
      <router-view></router-view>
    </v-content>
    <AppFooter></AppFooter>
    <MobileNav></MobileNav>
    <AppOnboarding :value="showOnboarding" @finish="finishOnboarding"></AppOnboarding>
  </v-app>
</template>

<script>
// COMPONENTS
import Navbar from './components/Layout/AppNavbar'
import MobileNav from './components/Layout/AppMobileNav'
import AppFooter from './components/Layout/AppFooter'
import AppOnboarding from './components/Onboarding/AppOnboarding'
import Api from '@/service/Api'

export default {
  name: 'App',
  components: {
    Navbar,
    MobileNav,
    AppFooter,
    AppOnboarding
  },
  data: () => ({ showOnboarding: false }),
  watch: { '$store.getters.isAuthenticated': { immediate: true, handler (authenticated) { if (authenticated) this.loadPreferences(); else this.showOnboarding = false } } },
  methods: {
    loadPreferences () { Api().get('me/privacy-settings').then(({ data }) => { this.$vuetify.theme.dark = data.preferences.darkMode; localStorage.setItem('herzklang-dark-mode', String(data.preferences.darkMode)); this.showOnboarding = !data.preferences.onboardingCompleted }).catch(() => {}) },
    finishOnboarding () { Api().put('me/preferences', { onboardingCompleted: true }).finally(() => { this.showOnboarding = false }) }
  }
}
</script>

<style lang="scss">
@import './src/assets/main.scss';
#app {
  background: transparent !important;
}
</style>
