<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <v-card elevation="0">
                    <!------------------ HEADER ------------------>
                    <v-card-title v-if="conversation" class="primario white--text">
                        <v-avatar size="36" class="mr-2">
                            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
                            <v-icon v-else color="white">{{svg.account}}</v-icon>
                        </v-avatar>
                        @{{conversation.otherUser.handle}}
                        <v-chip v-if="conversation.hasMatch" x-small color="#32BCC3" text-color="white" class="ml-2">Match</v-chip>
                        <v-spacer></v-spacer>
                        <v-menu offset-y>
                            <template v-slot:activator="{ on }">
                                <v-btn icon v-on="on"><v-icon color="white">{{svg.more}}</v-icon></v-btn>
                            </template>
                            <v-list>
                                <v-list-item @click="blockDialog = true">
                                    <v-list-item-title>Blockieren</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="reportDialog = true">
                                    <v-list-item-title>Melden</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="deleteDialog = true">
                                    <v-list-item-title>Unterhaltung löschen</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-card-title>
                    <v-card-title v-else class="primario white--text">Chat</v-card-title>
                    <!------------------ END HEADER ------------------>

                    <AppChatWindow :messages="currentConversationMessages" :auth-user-id="authUser.id"></AppChatWindow>

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

                <v-dialog v-model="deleteDialog" max-width="360">
                    <v-card class="pa-4">
                        <div class="title mb-3">Unterhaltung löschen?</div>
                        <div class="mb-4">Der gesamte Chatverlauf wird gelöscht. Ein bestehendes Match bleibt davon unberührt.</div>
                        <div class="text-right">
                            <v-btn text @click="deleteDialog = false">Abbrechen</v-btn>
                            <v-btn color="error" text @click="confirmDelete">Löschen</v-btn>
                        </div>
                    </v-card>
                </v-dialog>

                <v-dialog v-model="reportDialog" max-width="420">
                    <v-card class="pa-4">
                        <div class="title mb-3">Nutzer melden</div>
                        <v-select v-model="reportReason" :items="reportReasons" label="Grund"></v-select>
                        <v-textarea v-model="reportDetails" label="Details (optional)" counter="1000"></v-textarea>
                        <div class="text-right">
                            <v-btn text @click="reportDialog = false">Abbrechen</v-btn>
                            <v-btn color="error" text :disabled="!reportReason" @click="confirmReport">Melden</v-btn>
                        </div>
                    </v-card>
                </v-dialog>

                <v-dialog v-model="blockDialog" max-width="360">
                    <v-card class="pa-4" v-if="conversation">
                        <div class="title mb-3">@{{conversation.otherUser.handle}} blockieren?</div>
                        <div class="mb-4">Ihr könnt euch danach nicht mehr sehen oder schreiben.</div>
                        <div class="text-right">
                            <v-btn text @click="blockDialog = false">Abbrechen</v-btn>
                            <v-btn color="error" text @click="confirmBlock">Blockieren</v-btn>
                        </div>
                    </v-card>
                </v-dialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppChatWindow from '@/components/Chat/AppChatWindow.vue'
import { mdiAccount, mdiDotsVertical } from '@mdi/js'
import { mapGetters } from 'vuex'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')
const FALLBACK_POLL_INTERVAL_MS = 30000

export default {
  components: { AppChatWindow },
  data: () => ({
    newMessage: '',
    pollHandle: null,
    eventSource: null,
    deleteDialog: false,
    blockDialog: false,
    reportDialog: false,
    reportReason: null,
    reportDetails: '',
    reportReasons: [
      { text: 'Spam', value: 'spam' },
      { text: 'Belästigung', value: 'harassment' },
      { text: 'Fake-Profil', value: 'fake' },
      { text: 'Rechtswidriger Inhalt', value: 'illegal' },
      { text: 'Sonstiges', value: 'other' }
    ],
    svg: { account: mdiAccount, more: mdiDotsVertical }
  }),
  computed: {
    ...mapGetters(['authUser', 'currentConversation', 'currentConversationMessages']),
    conversationId () {
      return this.$route.params.id
    },
    conversation () {
      return this.currentConversation
    },
    photoSrc () {
      if (!this.conversation || !this.conversation.otherUser.photoUrl) return ''
      return this.conversation.otherUser.photoUrl.startsWith('http') ? this.conversation.otherUser.photoUrl : `${API_ORIGIN}${this.conversation.otherUser.photoUrl}`
    }
  },
  methods: {
    send () {
      const body = this.newMessage.trim()
      if (!body) return
      this.newMessage = ''
      this.$store.dispatch('SEND_CONVERSATION_MESSAGE', { conversationId: this.conversationId, body }).catch(() => {})
    },
    confirmDelete () {
      this.deleteDialog = false
      this.$store.dispatch('DELETE_CONVERSATION', this.conversationId).then(() => {
        this.$router.push({ name: 'chats' })
      })
    },
    confirmBlock () {
      this.blockDialog = false
      this.$store.dispatch('BLOCK_USER', this.conversation.otherUser.id).then(() => {
        this.$router.push({ name: 'chats' })
      }).catch(() => {})
    },
    confirmReport () {
      this.$store.dispatch('REPORT_USER', {
        userId: this.conversation.otherUser.id,
        reason: this.reportReason,
        details: this.reportDetails
      }).then(() => {
        this.reportDialog = false
        this.reportReason = null
        this.reportDetails = ''
      }).catch(() => {})
    }
  },
  created () {
    this.$store.dispatch('FETCH_CONVERSATION', this.conversationId)
    this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId)
    this.eventSource = new EventSource(`${API_ORIGIN}/api/conversations/${this.conversationId}/events`, { withCredentials: true })
    this.eventSource.addEventListener('message', () => {
      this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId)
    })
    this.pollHandle = setInterval(() => {
      this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId)
    }, FALLBACK_POLL_INTERVAL_MS)
  },
  beforeDestroy () {
    if (this.eventSource) this.eventSource.close()
    clearInterval(this.pollHandle)
  }
}
</script>
