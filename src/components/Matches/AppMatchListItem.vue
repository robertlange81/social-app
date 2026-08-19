<template>
    <v-list-item @click="$router.push({ name: 'chat', params: { id: match.conversationId } })" class="mb-2 background rounded">
        <v-list-item-avatar size="56">
            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
            <v-icon v-else size="40" color="white" class="background-secundario" style="width:100%; height:100%;">{{svg.account}}</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
                @{{match.otherUser.handle}}
                <v-chip x-small :color="partyColor(match.otherUser.party)" :text-color="partyTextColor(match.otherUser.party)" class="ml-2">
                    {{match.otherUser.party}}
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
                <div class="mb-4">Ihr gelt danach nicht mehr als Match. Der Chatverlauf bleibt erhalten.</div>
                <div class="text-right">
                    <v-btn text @click="unmatchDialog = false">Abbrechen</v-btn>
                    <v-btn color="error" text @click="doUnmatch">Auflösen</v-btn>
                </div>
            </v-card>
        </v-dialog>
    </v-list-item>
</template>

<script>
import { PARTY_COLORS, partyTextColor } from '@/constants/parties'
import { mdiAccount, mdiHeartBroken } from '@mdi/js'

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
    svg: { account: mdiAccount, unmatch: mdiHeartBroken }
  }),
  methods: {
    partyColor (party) {
      return PARTY_COLORS[party] || '#607D8B'
    },
    partyTextColor,
    doUnmatch () {
      this.unmatchDialog = false
      this.$store.dispatch('UNMATCH', this.match.id)
    }
  },
  computed: {
    photoSrc () {
      if (!this.match.otherUser.photoUrl) return ''
      return this.match.otherUser.photoUrl.startsWith('http') ? this.match.otherUser.photoUrl : `${API_ORIGIN}${this.match.otherUser.photoUrl}`
    }
  }
}
</script>
