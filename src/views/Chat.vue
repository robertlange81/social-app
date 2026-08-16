<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <v-card elevation="0">
                    <!------------------ HEADER ------------------>
                    <v-card-title v-if="otherUser" class="primario white--text">
                        <v-avatar size="36" class="mr-2">
                            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
                            <v-icon v-else color="white">{{svg.account}}</v-icon>
                        </v-avatar>
                        @{{otherUser.handle}}
                        <v-chip x-small :color="partyColor(otherUser.party)" :text-color="partyTextColor(otherUser.party)" class="ml-2">
                            {{otherUser.party}}
                        </v-chip>
                        <v-spacer></v-spacer>
                        <v-btn icon @click="unmatchDialog = true">
                            <v-icon color="white">{{svg.unmatch}}</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-title v-else class="primario white--text">Chat</v-card-title>
                    <!------------------ END HEADER ------------------>

                    <AppChatWindow :messages="currentMatchMessages" :auth-user-id="authUser.id"></AppChatWindow>

                    <v-card-actions class="pa-3">
                        <v-text-field
                            v-model="newMessage"
                            placeholder="Nachricht schreiben..."
                            hide-details
                            @keyup.enter="send"
                            color="cyan"
                        ></v-text-field>
                        <v-btn color="#32BCC3" dark elevation="0" @click="send" :disabled="!newMessage.trim()">
                            Senden
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-dialog v-model="unmatchDialog" max-width="360">
                    <v-card class="pa-4">
                        <div class="title mb-3">Match wirklich auflösen?</div>
                        <div class="mb-4">Der gesamte Chatverlauf mit @{{otherUser ? otherUser.handle : ''}} wird gelöscht.</div>
                        <div class="text-right">
                            <v-btn text @click="unmatchDialog = false">Abbrechen</v-btn>
                            <v-btn color="error" text @click="confirmUnmatch">Auflösen</v-btn>
                        </div>
                    </v-card>
                </v-dialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppChatWindow from '@/components/Chat/AppChatWindow.vue'
import { PARTY_COLORS, partyTextColor } from '@/constants/parties'
import { mdiAccount, mdiHeartBroken } from '@mdi/js'
import { mapGetters } from 'vuex'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')
const POLL_INTERVAL_MS = 3000

export default {
  components: { AppChatWindow },
  data: () => ({
    newMessage: '',
    pollHandle: null,
    unmatchDialog: false,
    svg: { account: mdiAccount, unmatch: mdiHeartBroken }
  }),
  computed: {
    ...mapGetters(['authUser', 'matches', 'currentMatchMessages']),
    matchId () {
      return this.$route.params.id
    },
    otherUser () {
      const match = this.matches.find(m => m.id === this.matchId)
      return match ? match.otherUser : null
    },
    photoSrc () {
      if (!this.otherUser || !this.otherUser.photoUrl) return ''
      return this.otherUser.photoUrl.startsWith('http') ? this.otherUser.photoUrl : `${API_ORIGIN}${this.otherUser.photoUrl}`
    }
  },
  methods: {
    partyColor (party) {
      return PARTY_COLORS[party] || '#607D8B'
    },
    partyTextColor,
    send () {
      const body = this.newMessage.trim()
      if (!body) return
      this.newMessage = ''
      this.$store.dispatch('SEND_MATCH_MESSAGE', { matchId: this.matchId, body })
    },
    confirmUnmatch () {
      this.unmatchDialog = false
      this.$store.dispatch('UNMATCH', this.matchId).then(() => {
        this.$router.push({ name: 'matches' })
      })
    }
  },
  created () {
    if (!this.matches.length) this.$store.dispatch('FETCH_MATCHES')
    this.$store.dispatch('FETCH_MATCH_MESSAGES', this.matchId)
    this.pollHandle = setInterval(() => {
      this.$store.dispatch('FETCH_MATCH_MESSAGES', this.matchId)
    }, POLL_INTERVAL_MS)
  },
  beforeDestroy () {
    clearInterval(this.pollHandle)
  }
}
</script>
