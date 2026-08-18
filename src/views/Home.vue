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
                <router-link v-for="pet in newestPets" :key="pet.id" :to="`/pet/${pet.id}`" style="text-decoration: none;">
                    <AppPetCard :pet="pet" show-bookmark @toggle-bookmark="onToggleBookmark"></AppPetCard>
                </router-link>
            </div>
        </template>
    </v-container>
</template>

<script>
import AppPetCard from '@/components/Discover/AppPetCard.vue'
import { mapGetters } from 'vuex'

export default {
  components: { AppPetCard },
  computed: {
    ...mapGetters(['isAuthenticated', 'myPets', 'activePet', 'newestPets', 'loadingUI'])
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
    }
  }
}
</script>
