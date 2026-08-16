<template>
    <div v-if="!isAuthenticated" class="gray" style="min-height: 100vh;">
        <v-container>
            <v-row justify="center" class="text-center pt-10">
                <v-col cols="12" sm="9" md="7">
                    <div class="content-board">
                        <div class="display-1 font-weight-bold text-secundario mb-4">
                            Finde jemanden, der wirklich zu dir passt.
                        </div>
                        <div class="subtitle-1 mb-6">
                            Bei uns siehst du direkt auf dem Profil, wofür jemand steht - inklusive der
                            Partei, die er oder sie wählt. Volle Transparenz von der ersten Sekunde an.
                        </div>
                        <v-btn to="/signup" color="#32BCC3" x-large elevation="0" dark class="mr-3">
                            Jetzt kostenlos registrieren
                        </v-btn>
                        <v-btn to="/login" color="#E0E0E0" x-large elevation="0">
                            Anmelden
                        </v-btn>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>

    <v-container v-else fluid class="page-container pa-4" style="min-height: 100vh;">
        <div class="content-board d-flex justify-space-between align-center flex-wrap mb-4">
            <div class="headline font-weight-bold text-secundario">Neue Mitglieder für dich</div>
            <div>
                <v-btn to="/search" color="#E0E0E0" elevation="0" class="mr-2">Suche</v-btn>
                <v-btn to="/discover" color="#32BCC3" dark elevation="0">Zum Entdecken-Modus</v-btn>
            </div>
        </div>

        <div v-if="!loadingUI && !newestProfiles.length" class="content-board text-center pa-8">
            Aktuell keine passenden neuen Profile. Passe ggf. deine Sucheinstellungen im
            <router-link :to="authUser ? `/profile/${authUser.handle}` : '/'">Profil</router-link> an
            oder nutze die <router-link to="/search">Suche</router-link>.
        </div>

        <div v-else class="card-grid">
            <router-link v-for="profile in newestProfiles" :key="profile.id" :to="`/profile/${profile.handle}`" style="text-decoration: none;">
                <AppProfileCard :profile="profile" show-bookmark @toggle-bookmark="onToggleBookmark"></AppProfileCard>
            </router-link>
        </div>
    </v-container>
</template>

<script>
import AppProfileCard from '@/components/Discover/AppProfileCard.vue'
import { mapGetters } from 'vuex'

export default {
  components: { AppProfileCard },
  computed: {
    ...mapGetters(['isAuthenticated', 'authUser', 'newestProfiles', 'loadingUI'])
  },
  created () {
    if (this.isAuthenticated) {
      this.$store.dispatch('FETCH_NEWEST')
    }
  },
  methods: {
    onToggleBookmark (profile) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { userId: profile.id, bookmarked: !!profile.isBookmarked })
    }
  }
}
</script>
