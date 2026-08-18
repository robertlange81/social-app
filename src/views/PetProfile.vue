<template>
  <v-container fluid pa-3 style="min-height: 100vh;">
    <v-row justify="center">
      <v-col cols="12" sm="6" md="4">
          <v-card min-height="300" elevation="0">
            <AppPerfilContentLoader v-if="loadingUI"></AppPerfilContentLoader>
            <div v-else-if="pet">
                <!------------------ ZWECK BANNER: GANZ OBEN ------------------>
                <div
                    class="purpose-banner text-center py-3 white--text font-weight-bold"
                    :style="{ background: purposeColor(pet.purpose) }"
                >
                    {{speciesIcon}} Sucht: {{purposeText(pet.purpose)}}
                </div>
                <!------------------ END ZWECK BANNER ------------------>

                <v-row class="pa-3">
                    <v-col offset="1" cols="10" class="center">
                        <v-avatar size="200">
                            <v-img v-if="pet.photoUrl" :src="photoSrc"></v-img>
                            <span v-else style="font-size:110px;">{{speciesIcon}}</span>
                        </v-avatar>
                    </v-col>
                    <v-col offset="1" cols="10" class="background">
                        <v-row>
                            <v-col>
                                <div class="text-center mb-1 title text-secundario font-weight-bold">{{pet.name}}</div>
                                <div class="text-center mb-3 subtitle-1">
                                    {{pet.breed || speciesLabelFor(pet.species)}} · {{pet.age}} Jahre · {{genderLabel(pet.gender)}}
                                </div>
                                <div v-if="pet.bio" class="text-center mb-3 pr-5 pl-5 font-weight-regular">{{pet.bio}}</div>
                                <div v-if="pet.city" class="text-center mb-3">
                                    <v-icon>{{svg.location}}</v-icon>
                                    <span>&nbsp;{{pet.city}}</span>
                                </div>
                                <div v-if="pet.owner" class="text-center mb-3 caption grey--text">
                                    Halter: @{{pet.owner.handle}}
                                </div>

                                <div class="mt-5 center" v-if="pet.isOwn">
                                    <router-link to="/pets"><v-btn color="#32BCC3" dark elevation="0">Im Tier-Profil bearbeiten</v-btn></router-link>
                                </div>
                                <div class="mt-5 center" v-else style="gap: 8px; flex-wrap: wrap;">
                                    <v-btn
                                        :color="pet.isBookmarked ? '#32BCC3' : '#E0E0E0'"
                                        :dark="pet.isBookmarked"
                                        elevation="0"
                                        @click="toggleBookmark"
                                    >
                                        <v-icon left small>{{pet.isBookmarked ? svg.bookmarkFilled : svg.bookmarkOutline}}</v-icon>
                                        {{pet.isBookmarked ? 'Gemerkt' : 'Merken'}}
                                    </v-btn>
                                    <v-btn color="#32BCC3" dark elevation="0" :loading="messaging" @click="messageOwner">
                                        <v-icon left small>{{svg.message}}</v-icon>
                                        Nachricht senden
                                    </v-btn>
                                    <v-btn color="#E0E0E0" elevation="0" @click="blockDialog = true">
                                        <v-icon left small>{{svg.block}}</v-icon>
                                        Blockieren
                                    </v-btn>
                                </div>
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </div>
            <div v-else class="pa-5 text-center">Tier nicht gefunden.</div>
          </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="blockDialog" max-width="360">
        <v-card class="pa-4" v-if="pet && pet.owner">
            <div class="title mb-3">@{{pet.owner.handle}} blockieren?</div>
            <div class="mb-4">Ihr könnt euch danach nicht mehr sehen oder schreiben.</div>
            <div class="text-right">
                <v-btn text @click="blockDialog = false">Abbrechen</v-btn>
                <v-btn color="error" text @click="confirmBlock">Blockieren</v-btn>
            </div>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import AppPerfilContentLoader from '@/components/Loaders/AppPerfilLoader.vue'
import { PURPOSE_COLORS, purposeLabel, speciesLabel, SPECIES_ICON, GENDERS } from '@/constants/pets'
import { mdiMapMarker, mdiBookmark, mdiBookmarkOutline, mdiMessageTextOutline, mdiCancel } from '@mdi/js'
import { mapGetters } from 'vuex'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  components: { AppPerfilContentLoader },
  data: () => ({
    messaging: false,
    blockDialog: false,
    svg: {
      location: mdiMapMarker,
      bookmarkFilled: mdiBookmark,
      bookmarkOutline: mdiBookmarkOutline,
      message: mdiMessageTextOutline,
      block: mdiCancel
    }
  }),
  computed: {
    ...mapGetters(['loadingUI', 'viewedPet']),
    pet () {
      return this.viewedPet
    },
    speciesIcon () {
      return this.pet ? (SPECIES_ICON[this.pet.species] || '🐾') : '🐾'
    },
    photoSrc () {
      if (!this.pet || !this.pet.photoUrl) return ''
      return this.pet.photoUrl.startsWith('http') ? this.pet.photoUrl : `${API_ORIGIN}${this.pet.photoUrl}`
    }
  },
  created () {
    window.scrollTo(0, 0)
    this.$store.dispatch('FETCH_PET', this.$route.params.id)
  },
  watch: {
    '$route.params.id' (id) {
      this.$store.dispatch('FETCH_PET', id)
    }
  },
  methods: {
    purposeColor (purpose) {
      return PURPOSE_COLORS[purpose] || '#607D8B'
    },
    purposeText: purposeLabel,
    speciesLabelFor: speciesLabel,
    genderLabel (value) {
      const found = GENDERS.find(g => g.value === value)
      return found ? found.text : value
    },
    toggleBookmark () {
      this.$store.dispatch('TOGGLE_BOOKMARK', { petId: this.pet.id, bookmarked: !!this.pet.isBookmarked })
    },
    messageOwner () {
      this.messaging = true
      this.$store.dispatch('START_CONVERSATION', this.pet.owner.id)
        .then((conversation) => {
          this.$router.push({ name: 'chat', params: { id: conversation.id } })
        })
        .catch(() => { this.messaging = false })
    },
    confirmBlock () {
      this.blockDialog = false
      this.$store.dispatch('BLOCK_USER', this.pet.owner.id).then(() => {
        this.$router.push({ name: 'search' })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.purpose-banner {
    letter-spacing: 0.5px;
}
</style>
