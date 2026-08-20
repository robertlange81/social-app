<template>
    <div v-if="!isAuthenticated" class="gray" style="min-height: 100vh;">
        <v-container>
            <v-row justify="center" class="text-center pt-10">
                <v-col cols="12" sm="9" md="7">
                    <div class="content-board">
                        <div class="display-1 font-weight-bold text-secundario mb-4">
                            Tinder für Hunde (und Katzen).
                        </div>
                        <div class="subtitle-1 mb-6">
                            Zucht- oder Spielpartner für dein Tier finden - unkompliziert, mit Foto,
                            Swipe und Chat. Für Halter, nicht nur für Profi-Züchter.
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
        <div v-if="!myPets.length" class="content-board text-center pa-8">
            <div class="title mb-3">Leg zuerst ein Tier an</div>
            <div class="mb-4">Um zu swipen, brauchst du mindestens ein Tierprofil.</div>
            <v-btn to="/pets" color="#32BCC3" dark elevation="0">Tier anlegen</v-btn>
        </div>

        <template v-else>
            <div class="content-board d-flex justify-space-between align-center flex-wrap mb-4">
                <div class="headline font-weight-bold text-secundario">Neue Tiere für dich</div>
                <div>
                    <v-btn to="/search" color="#E0E0E0" elevation="0" class="mr-2">Suche</v-btn>
                    <v-btn to="/discover" color="#32BCC3" dark elevation="0">Zum Swipen</v-btn>
                </div>
            </div>

            <div v-if="!loadingUI && !newestPets.length" class="content-board text-center pa-8">
                Aktuell keine passenden neuen Tiere. Nutze die <router-link to="/search">Suche</router-link>,
                um alle Tiere zu durchstöbern.
            </div>

            <div v-else class="card-grid">
                <div v-for="pet in newestPets" :key="pet.id" class="quick-like-card">
                    <router-link :to="`/pet/${pet.id}`" style="text-decoration: none;">
                        <AppPetCard :pet="pet" show-bookmark @toggle-bookmark="onToggleBookmark"></AppPetCard>
                    </router-link>
                    <div class="d-flex pa-2 white">
                        <v-btn icon color="#757575" :aria-label="`${pet.name} überspringen`" @click="quickSwipe(pet, 'pass')">
                            <v-icon>{{svg.close}}</v-icon>
                        </v-btn>
                        <v-spacer></v-spacer>
                        <v-btn rounded color="#32BCC3" dark elevation="0" @click="quickSwipe(pet, 'like')">
                            <v-icon left>{{svg.heart}}</v-icon> Gefällt mir
                        </v-btn>
                    </div>
                </div>
            </div>
        </template>

        <v-dialog v-model="showMatchDialog" max-width="380" persistent>
            <v-card v-if="lastMatchResult" class="text-center pa-6">
                <div class="headline font-weight-bold text-secundario mb-2">Es ist ein Match! 🎉</div>
                <div class="mb-4">{{activePet ? activePet.name : 'Dein Tier'}} und {{lastMatchResult.otherPet.name}} passen zusammen.</div>
                <v-btn color="#32BCC3" dark elevation="0" class="mr-2" @click="goToChat">Chat öffnen</v-btn>
                <v-btn color="#E0E0E0" elevation="0" @click="closeMatchDialog">Weiter</v-btn>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import AppPetCard from '@/components/Discover/AppPetCard.vue'
import { mapGetters } from 'vuex'
import { mdiClose, mdiHeart } from '@mdi/js'

export default {
  components: { AppPetCard },
  data: () => ({ svg: { close: mdiClose, heart: mdiHeart } }),
  computed: {
    ...mapGetters(['isAuthenticated', 'myPets', 'activePet', 'newestPets', 'loadingUI', 'lastMatchResult']),
    showMatchDialog: {
      get () { return !!this.lastMatchResult },
      set (value) { if (!value) this.closeMatchDialog() }
    }
  },
  created () {
    if (this.isAuthenticated) this.loadNewest()
  },
  watch: {
    activePet () {
      this.loadNewest()
    }
  },
  methods: {
    loadNewest () {
      if (this.activePet) this.$store.dispatch('FETCH_NEWEST', this.activePet.id)
    },
    onToggleBookmark (pet) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { petId: pet.id, bookmarked: !!pet.isBookmarked })
    },
    quickSwipe (pet, direction) {
      if (!this.activePet) return
      this.$store.dispatch('SWIPE', { fromPetId: this.activePet.id, toPetId: pet.id, direction })
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
</style>
