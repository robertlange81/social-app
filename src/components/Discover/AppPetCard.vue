<template>
    <v-card class="pet-card" elevation="4">
        <!------------------ ZWECK: GANZ OBEN AUF DER KARTE ------------------>
        <div
            class="text-center py-1 caption font-weight-bold white--text"
            :style="{ background: purposeColor(pet.purpose) }"
        >
            {{speciesIcon}} {{purposeText(pet.purpose)}}
        </div>
        <!------------------ END ZWECK ------------------>

        <div style="position:relative;">
            <v-img v-if="photoSrc" :src="photoSrc" height="340" gradient="to top, rgba(0,0,0,.75), rgba(0,0,0,0)">
                <div class="white--text pa-3" style="position:absolute; bottom:0; left:0; right:0;">
                    <div class="title font-weight-bold">{{pet.name}}, {{pet.age}}</div>
                    <div v-if="pet.breed" class="subtitle-2">{{pet.breed}}</div>
                    <div v-if="pet.city" class="caption">{{pet.city}}</div>
                </div>
            </v-img>
            <div v-else class="center background-secundario" style="height:340px; position:relative;">
                <span style="font-size:100px;">{{speciesIcon}}</span>
                <div class="white--text pa-3" style="position:absolute; bottom:0; left:0; right:0;">
                    <div class="title font-weight-bold">{{pet.name}}, {{pet.age}}</div>
                    <div v-if="pet.breed" class="subtitle-2">{{pet.breed}}</div>
                    <div v-if="pet.city" class="caption">{{pet.city}}</div>
                </div>
            </div>
            <v-btn
                v-if="showBookmark"
                fab x-small
                :color="pet.isBookmarked ? '#32BCC3' : 'rgba(0,0,0,0.45)'"
                style="position:absolute; top:8px; right:8px;"
                dark
                @click.stop.prevent="$emit('toggle-bookmark', pet)"
            >
                <v-icon small>{{pet.isBookmarked ? svg.bookmarkFilled : svg.bookmarkOutline}}</v-icon>
            </v-btn>
        </div>

        <v-card-text v-if="pet.bio" class="body-2" style="height:80px; overflow:hidden;">
            {{pet.bio}}
        </v-card-text>
    </v-card>
</template>

<script>
import { PURPOSE_COLORS, purposeLabel, SPECIES_ICON } from '@/constants/pets'
import { mdiBookmark, mdiBookmarkOutline } from '@mdi/js'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    pet: {
      type: Object,
      required: true
    },
    showBookmark: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    svg: { bookmarkFilled: mdiBookmark, bookmarkOutline: mdiBookmarkOutline }
  }),
  methods: {
    purposeColor (purpose) {
      return PURPOSE_COLORS[purpose] || '#607D8B'
    },
    purposeText: purposeLabel
  },
  computed: {
    speciesIcon () {
      return SPECIES_ICON[this.pet.species] || '🐾'
    },
    photoSrc () {
      if (!this.pet.photoUrl) return ''
      return this.pet.photoUrl.startsWith('http') ? this.pet.photoUrl : `${API_ORIGIN}${this.pet.photoUrl}`
    }
  }
}
</script>

<style scoped>
.pet-card {
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
}
</style>
