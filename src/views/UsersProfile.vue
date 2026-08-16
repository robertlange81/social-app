<template>
  <v-container fluid pa-3 style="min-height: 100vh;">
    <v-row justify="center">
      <v-col cols="12" sm="6" md="4">
          <v-card min-height="300" elevation="0">
            <AppPerfilContentLoader v-if="loadingUI && !isOwnProfile"></AppPerfilContentLoader>
            <AppProfile :data="profileData" v-else-if="profileData"></AppProfile>
            <div v-else class="pa-5 text-center">Profil nicht gefunden.</div>
          </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// COMPONENTS
import AppPerfilContentLoader from '@/components/Loaders/AppPerfilLoader.vue'
import AppProfile from '@/components/Profile/AppProfile.vue'

// VUEX
import { mapGetters } from 'vuex'

export default {
  components: {
    AppPerfilContentLoader,
    AppProfile
  },
  created () {
    window.scrollTo(0, 0)
    this.$store.dispatch('FETCH_USER_PROFILE', this.$route.params.handle)
  },
  watch: {
    '$route.params.handle' (handle) {
      this.$store.dispatch('FETCH_USER_PROFILE', handle)
    }
  },
  computed: {
    ...mapGetters(['loadingUI', 'viewedProfile', 'authUser', 'isAuthenticated']),
    isOwnProfile () {
      return this.isAuthenticated && !!this.authUser && this.authUser.handle === this.$route.params.handle
    },
    profileData () {
      return this.isOwnProfile ? this.authUser : this.viewedProfile
    }
  }
}
</script>
