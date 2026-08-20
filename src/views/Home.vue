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
            <div v-for="profile in newestProfiles" :key="profile.id" class="quick-like-card">
                <router-link :to="`/profile/${profile.handle}`" style="text-decoration: none;">
                    <AppProfileCard :profile="profile" show-bookmark @toggle-bookmark="onToggleBookmark"></AppProfileCard>
                </router-link>
                <div class="d-flex pa-2 white">
                    <v-btn icon color="#757575" :aria-label="`${profile.handle} überspringen`" @click="quickSwipe(profile, 'pass')">
                        <v-icon>{{svg.close}}</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn rounded color="#32BCC3" dark elevation="0" @click="quickSwipe(profile, 'like')">
                        <v-icon left>{{svg.heart}}</v-icon> Gefällt mir
                    </v-btn>
                </div>
            </div>
        </div>

        <v-dialog v-model="showMatchDialog" max-width="380" persistent>
            <v-card v-if="lastMatchResult" class="text-center pa-6">
                <div class="headline font-weight-bold text-secundario mb-2">Es ist ein Match! 🎉</div>
                <div class="mb-4">Du und @{{lastMatchResult.otherUser.handle}} mögt euch beide.</div>
                <v-btn color="#32BCC3" dark elevation="0" class="mr-2" @click="goToChat">Chat öffnen</v-btn>
                <v-btn color="#E0E0E0" elevation="0" @click="closeMatchDialog">Weiter</v-btn>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import AppProfileCard from '@/components/Discover/AppProfileCard.vue'
import { mapGetters } from 'vuex'
import { mdiClose, mdiHeart } from '@mdi/js'

export default {
  components: { AppProfileCard },
  data: () => ({ svg: { close: mdiClose, heart: mdiHeart } }),
  computed: {
    ...mapGetters(['isAuthenticated', 'authUser', 'newestProfiles', 'loadingUI', 'lastMatchResult']),
    showMatchDialog: {
      get () { return !!this.lastMatchResult },
      set (value) { if (!value) this.closeMatchDialog() }
    }
  },
  created () {
    if (this.isAuthenticated) {
      this.$store.dispatch('FETCH_NEWEST')
    }
  },
  methods: {
    onToggleBookmark (profile) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { userId: profile.id, bookmarked: !!profile.isBookmarked })
    },
    quickSwipe (profile, direction) {
      this.$store.dispatch('SWIPE', { toUserId: profile.id, direction })
    },
    closeMatchDialog () {
      this.$store.dispatch('CLEAR_MATCH_RESULT')
    },
    goToChat () {
      const conversationId = this.lastMatchResult.conversationId
      this.closeMatchDialog()
      this.$router.push({ name: 'chat', params: { id: conversationId } })
    }
  }
}
</script>

<style scoped>
.quick-like-card {
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .16);
}
.quick-like-card .profile-card { box-shadow: none !important; }
</style>
