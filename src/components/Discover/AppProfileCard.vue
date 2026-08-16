<template>
    <v-card class="profile-card" elevation="4">
        <!------------------ PARTEI: GANZ OBEN AUF DER KARTE ------------------>
        <div
            class="text-center py-1 caption font-weight-bold"
            :style="{ background: partyColor(profile.party), color: partyTextColor(profile.party) }"
        >
            {{profile.party}}
        </div>
        <!------------------ END PARTEI ------------------>

        <div style="position:relative;">
            <v-img v-if="photoSrc" :src="photoSrc" height="340" gradient="to top, rgba(0,0,0,.75), rgba(0,0,0,0)">
                <div class="white--text pa-3" style="position:absolute; bottom:0; left:0; right:0;">
                    <div class="title font-weight-bold">{{profile.handle}}, {{profile.age}}</div>
                    <div v-if="profile.city" class="subtitle-2">{{profile.city}}</div>
                </div>
            </v-img>
            <div v-else class="center background-secundario" style="height:340px; position:relative;">
                <v-icon size="120" color="white">{{svg.account}}</v-icon>
                <div class="white--text pa-3" style="position:absolute; bottom:0; left:0; right:0;">
                    <div class="title font-weight-bold">{{profile.handle}}, {{profile.age}}</div>
                    <div v-if="profile.city" class="subtitle-2">{{profile.city}}</div>
                </div>
            </div>
            <v-btn
                v-if="showBookmark"
                fab x-small
                :color="profile.isBookmarked ? '#32BCC3' : 'rgba(0,0,0,0.45)'"
                style="position:absolute; top:8px; right:8px;"
                dark
                @click.stop.prevent="$emit('toggle-bookmark', profile)"
            >
                <v-icon small>{{profile.isBookmarked ? svg.bookmarkFilled : svg.bookmarkOutline}}</v-icon>
            </v-btn>
        </div>

        <v-card-text v-if="profile.bio" class="body-2" style="height:80px; overflow:hidden;">
            {{profile.bio}}
        </v-card-text>
    </v-card>
</template>

<script>
import { PARTY_COLORS, partyTextColor } from '@/constants/parties'
import { mdiAccount, mdiBookmark, mdiBookmarkOutline } from '@mdi/js'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    profile: {
      type: Object,
      required: true
    },
    showBookmark: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    svg: { account: mdiAccount, bookmarkFilled: mdiBookmark, bookmarkOutline: mdiBookmarkOutline }
  }),
  methods: {
    partyColor (party) {
      return PARTY_COLORS[party] || '#607D8B'
    },
    partyTextColor
  },
  computed: {
    photoSrc () {
      if (!this.profile.photoUrl) return ''
      return this.profile.photoUrl.startsWith('http') ? this.profile.photoUrl : `${API_ORIGIN}${this.profile.photoUrl}`
    }
  }
}
</script>

<style scoped>
.profile-card {
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
}
</style>
