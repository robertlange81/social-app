<template>
    <div v-if="data">
        <!------------------ PARTEI BANNER: GANZ OBEN AUF DEM PROFIL ------------------>
        <div
            class="party-banner text-center py-3 white--text font-weight-bold"
            :style="{ background: partyColor(data.party), color: partyTextColor(data.party) }"
        >
            <v-icon left small :color="partyTextColor(data.party)">{{svg.party}}</v-icon>
            Wählt: {{data.party}}
        </div>
        <!------------------ END PARTEI BANNER ------------------>

        <v-row class="pa-3">
            <v-col offset="1" cols="10" class="center relative">
                <v-avatar size="200">
                    <v-img v-if="data.photoUrl" class="card-img" :src="photoSrc"></v-img>
                    <v-icon v-else size="120" color="white" class="background-secundario" style="width:100%;height:100%;">{{svg.account}}</v-icon>
                </v-avatar>

                <!------------------ EDIT IMAGE BUTTON ------------------>
                <div v-if="isOwnProfile">
                    <input type="file" ref="imageInput" hidden accept="image/*" @change="handleImageChange">
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                            <v-btn class="mx-2" fab small color="#32BCC3" absolute right bottom :loading="loadingUser" @click="editImage" v-on="on" dark>
                                <v-icon dark>{{svg.camera}}</v-icon>
                            </v-btn>
                        </template>
                        <span>Profilbild ändern (wird automatisch in Comic-Style umgewandelt)</span>
                    </v-tooltip>
                </div>
                <!------------------ EDIT IMAGE BUTTON ------------------>
                <div v-if="isOwnProfile && errors" class="mt-2">
                    <v-alert dense type="error" dismissible class="mb-0" @input="clearError">{{errors}}</v-alert>
                </div>
            </v-col>
            <v-col offset="1" cols="10" class="background">
                    <v-row>
                        <v-col>
                            <!------------------ PROFILE DATA ------------------>
                            <div class="text-center mb-1 title text-secundario font-weight-bold">
                                <span>@</span>{{data.handle}}
                            </div>
                            <div class="text-center mb-3 subtitle-1">
                                {{data.age}} Jahre
                            </div>
                            <div v-if="data.bio" class="text-center mb-3 pr-5 pl-5 font-weight-regular">
                                {{data.bio}}
                            </div>
                            <div v-if="data.city" class="text-center mb-3">
                                <v-icon>{{svg.location}}</v-icon>
                                <span>&nbsp;{{data.city}}</span>
                            </div>
                            <div v-if="data.seekingGender" class="text-center mb-3">
                                <v-icon>{{svg.heart}}</v-icon>
                                <span>&nbsp;sucht {{seekingLabel}}</span>
                            </div>
                            <!------------------ END PROFILE DATA ------------------>
                            <div class="mt-5 center" v-if="isOwnProfile">
                                <AppEditProfile :data="data"></AppEditProfile>
                            </div>
                            <div class="mt-5 center" v-else-if="isAuthenticated" style="gap: 8px; flex-wrap: wrap;">
                                <v-btn
                                    :color="data.isBookmarked ? '#32BCC3' : '#E0E0E0'"
                                    :dark="data.isBookmarked"
                                    elevation="0"
                                    @click="toggleBookmark"
                                >
                                    <v-icon left small>{{data.isBookmarked ? svg.bookmarkFilled : svg.bookmarkOutline}}</v-icon>
                                    {{data.isBookmarked ? 'Gemerkt' : 'Merken'}}
                                </v-btn>
                                <v-btn color="#32BCC3" dark elevation="0" :loading="messaging" @click="messageUser">
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

        <v-dialog v-model="blockDialog" max-width="360">
            <v-card class="pa-4">
                <div class="title mb-3">@{{data.handle}} blockieren?</div>
                <div class="mb-4">Ihr könnt euch danach nicht mehr sehen oder schreiben.</div>
                <div class="text-right">
                    <v-btn text @click="blockDialog = false">Abbrechen</v-btn>
                    <v-btn color="error" text @click="confirmBlock">Blockieren</v-btn>
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
// COMPONENTS
import AppEditProfile from '@/components/Profile/AppEditProfile.vue'

// CONSTANTS
import { PARTY_COLORS, partyTextColor, SEEKING_GENDERS } from '@/constants/parties'

// SVG ICONS
import { mdiMapMarker, mdiCalendar, mdiCameraRetakeOutline, mdiAccount, mdiBankOutline, mdiHeart, mdiBookmark, mdiBookmarkOutline, mdiMessageTextOutline, mdiCancel } from '@mdi/js'

// VUEX
import { mapGetters } from 'vuex'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  components: {
    AppEditProfile
  },
  props: {
    data: {
      type: Object
    }
  },
  data: () => ({
    messaging: false,
    blockDialog: false,
    svg: {
      location: mdiMapMarker,
      calendar: mdiCalendar,
      camera: mdiCameraRetakeOutline,
      account: mdiAccount,
      party: mdiBankOutline,
      heart: mdiHeart,
      bookmarkFilled: mdiBookmark,
      bookmarkOutline: mdiBookmarkOutline,
      message: mdiMessageTextOutline,
      block: mdiCancel
    }
  }),
  methods: {
    partyColor (party) {
      return PARTY_COLORS[party] || '#607D8B'
    },
    partyTextColor,
    toggleBookmark () {
      this.$store.dispatch('TOGGLE_BOOKMARK', { userId: this.data.id, bookmarked: !!this.data.isBookmarked })
    },
    messageUser () {
      this.messaging = true
      this.$store.dispatch('START_CONVERSATION', this.data.id)
        .then((conversation) => {
          this.$router.push({ name: 'chat', params: { id: conversation.id } })
        })
        .catch(() => { this.messaging = false })
    },
    confirmBlock () {
      this.blockDialog = false
      this.$store.dispatch('BLOCK_USER', this.data.id).then(() => {
        this.$router.push({ name: 'search' })
      }).catch(() => {})
    },
    handleImageChange (event) {
      const image = event.target.files[0]
      event.target.value = ''
      if (!image) return
      this.$store.dispatch('CLEAR_ERROR')
      const formData = new FormData()
      formData.append('image', image, image.name)
      this.$store.dispatch('UPLOAD_IMAGE', formData).catch(() => {})
    },
    editImage () {
      this.$refs.imageInput.click()
    },
    clearError () {
      this.$store.dispatch('CLEAR_ERROR')
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'authUser', 'errors', 'loadingUser']),
    isOwnProfile () {
      return this.isAuthenticated && this.authUser && this.data && this.authUser.id === this.data.id
    },
    photoSrc () {
      if (!this.data.photoUrl) return ''
      return this.data.photoUrl.startsWith('http') ? this.data.photoUrl : `${API_ORIGIN}${this.data.photoUrl}`
    },
    seekingLabel () {
      const found = SEEKING_GENDERS.find(g => g.value === this.data.seekingGender)
      return found ? found.text.toLowerCase() : this.data.seekingGender
    }
  }
}
</script>

<style scoped>
.party-banner {
    letter-spacing: 0.5px;
}
</style>
