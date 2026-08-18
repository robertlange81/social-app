<template>
    <v-list-item @click="$router.push({ name: 'chat', params: { id: match.conversationId } })" class="mb-2 background rounded">
        <v-list-item-avatar size="56">
            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
            <span v-else style="font-size:32px;">{{speciesIcon}}</span>
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
                {{match.myPet.name}} 💞 {{match.otherPet.name}}
                <v-chip x-small :color="purposeColor(match.otherPet.purpose)" text-color="white" class="ml-2">
                    {{purposeText(match.otherPet.purpose)}}
                </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle v-if="match.lastMessage">{{match.lastMessage.body}}</v-list-item-subtitle>
            <v-list-item-subtitle v-else class="font-italic">Noch keine Nachrichten - schreib als Erster!</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action @click.stop>
            <v-btn icon @click="unmatchDialog = true">
                <v-icon small>{{svg.unmatch}}</v-icon>
            </v-btn>
        </v-list-item-action>

        <v-dialog v-model="unmatchDialog" max-width="360" @click.native.stop>
            <v-card class="pa-4">
                <div class="title mb-3">Match wirklich auflösen?</div>
                <div class="mb-4">{{match.myPet.name}} und {{match.otherPet.name}} gelten danach nicht mehr als Match. Der Chatverlauf bleibt erhalten.</div>
                <div class="text-right">
                    <v-btn text @click="unmatchDialog = false">Abbrechen</v-btn>
                    <v-btn color="error" text @click="doUnmatch">Auflösen</v-btn>
                </div>
            </v-card>
        </v-dialog>
    </v-list-item>
</template>

<script>
import { PURPOSE_COLORS, purposeLabel, SPECIES_ICON } from '@/constants/pets'
import { mdiHeartBroken } from '@mdi/js'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    match: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    unmatchDialog: false,
    svg: { unmatch: mdiHeartBroken }
  }),
  methods: {
    purposeColor (purpose) {
      return PURPOSE_COLORS[purpose] || '#607D8B'
    },
    purposeText: purposeLabel,
    doUnmatch () {
      this.unmatchDialog = false
      this.$store.dispatch('UNMATCH', this.match.id)
    }
  },
  computed: {
    speciesIcon () {
      return SPECIES_ICON[this.match.otherPet.species] || '🐾'
    },
    photoSrc () {
      if (!this.match.otherPet.photoUrl) return ''
      return this.match.otherPet.photoUrl.startsWith('http') ? this.match.otherPet.photoUrl : `${API_ORIGIN}${this.match.otherPet.photoUrl}`
    }
  }
}
</script>
