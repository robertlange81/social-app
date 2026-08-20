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
                        <v-chip x-small :color="partyColor(conversation.otherUser.party)" :text-color="partyTextColor(conversation.otherUser.party)" class="ml-2">
                            {{conversation.otherUser.party}}
                        </v-chip>
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

                    <div class="pa-2 d-flex align-center background">
                        <v-btn small text color="#168890" @click="dateDialog = true"><v-icon left small>{{svg.calendar}}</v-icon>Date vorschlagen</v-btn>
                        <v-spacer></v-spacer><span v-if="activeDatePlan" class="caption">{{dateStatus(activeDatePlan)}}: {{activeDatePlan.activity}}</span>
                        <v-btn icon small @click="searchOpen=!searchOpen"><v-icon small>{{svg.search}}</v-icon></v-btn>
                    </div>
                    <div v-if="searchOpen" class="pa-2"><v-text-field v-model="searchQuery" dense outlined hide-details label="Im Chat suchen" @keyup.enter="searchMessages"></v-text-field><div v-for="result in searchResults" :key="result.id" class="caption pa-1">{{result.body}}</div></div>
                    <v-card v-if="activeDatePlan" tile outlined class="mx-3 mt-2 pa-2">
                        <strong>{{activeDatePlan.activity}}</strong> · {{formatDate(activeDatePlan.startsAt)}}<br><span>{{activeDatePlan.place}}</span>
                        <div v-if="activeDatePlan.status === 'proposed' && activeDatePlan.proposedBy !== authUser.id" class="mt-2">
                            <v-btn x-small color="success" @click="respondDate(activeDatePlan, 'accepted')">Annehmen</v-btn>
                            <v-btn x-small text @click="respondDate(activeDatePlan, 'declined')">Ablehnen</v-btn>
                        </div>
                        <template v-if="activeDatePlan.status === 'accepted'"><v-btn x-small text color="#168890" @click="downloadCalendar(activeDatePlan)">Kalenderdatei</v-btn><v-menu offset-y><template v-slot:activator="{ on }"><v-btn x-small text color="#168890" v-on="on">Sicherheits-Check-in</v-btn></template><v-list dense><v-list-item @click="checkIn(activeDatePlan,'on_my_way')">Ich bin auf dem Weg</v-list-item><v-list-item @click="checkIn(activeDatePlan,'arrived')">Ich bin am Treffpunkt</v-list-item><v-list-item @click="checkIn(activeDatePlan,'safe_home')">Ich bin sicher zuhause</v-list-item></v-list></v-menu></template>
                    </v-card>

                    <div v-if="otherTyping" class="caption px-4 pt-2 grey--text">{{conversation.otherUser.handle}} tippt gerade …</div>
                    <AppChatWindow :messages="currentConversationMessages" :auth-user-id="authUser.id" @reply="replyTo = $event" @react="react" @edit="editMessage" @delete="deleteMessage" @approve="approveAttachment"></AppChatWindow>

                    <v-card-actions class="pa-3">
                        <input ref="imageInput" type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" @change="sendImage">
                        <v-btn icon :loading="uploading" aria-label="Bild senden" @click="$refs.imageInput.click()"><v-icon>{{svg.image}}</v-icon></v-btn>
                        <v-btn icon :color="recording ? 'red' : ''" :aria-label="recording ? 'Aufnahme stoppen' : 'Sprachnachricht aufnehmen'" @click="toggleRecording"><v-icon>{{recording ? svg.stop : svg.mic}}</v-icon></v-btn>
                        <span v-if="recording" class="caption red--text mr-2">{{formatDuration(recordingSeconds)}}</span>
                        <div v-if="replyTo" class="caption pa-2 mr-2" style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Antwort auf: {{replyTo.body}} <button type="button" @click="replyTo=null">×</button></div>
                        <v-text-field
                            v-model="newMessage"
                            placeholder="Nachricht schreiben..."
                            hide-details
                            @keyup.enter="send"
                            @input="sendTyping"
                            color="cyan"
                        ></v-text-field>
                        <v-btn color="#32BCC3" dark elevation="0" @click="send" :disabled="!newMessage.trim()">
                            Senden
                        </v-btn>
                    </v-card-actions>
                    <v-progress-linear v-if="uploading" :value="uploadProgress" color="#32BCC3" height="4"></v-progress-linear>
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

                <v-dialog v-model="dateDialog" max-width="480"><v-card class="pa-4">
                    <div class="title mb-3">Date vorschlagen</div>
                    <v-select v-model="dateForm.activity" :items="dateActivities" label="Aktivität"></v-select>
                    <v-text-field v-model="dateForm.startsAt" type="datetime-local" label="Datum und Uhrzeit"></v-text-field>
                    <v-text-field v-model="dateForm.place" label="Treffpunkt" counter="200"></v-text-field>
                    <v-textarea v-model="dateForm.note" label="Notiz (optional)" counter="500"></v-textarea>
                    <div class="text-right"><v-btn text @click="dateDialog=false">Abbrechen</v-btn><v-btn color="#32BCC3" dark :disabled="!dateForm.activity || !dateForm.startsAt || !dateForm.place.trim()" @click="proposeDate">Vorschlagen</v-btn></div>
                </v-card></v-dialog>

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
                <v-dialog :value="!!pendingAudioUrl" persistent max-width="440"><v-card class="pa-5"><div class="title mb-3">Sprachnachricht prüfen</div><p class="caption">Dauer: {{formatDuration(recordingSeconds)}}</p><audio v-if="pendingAudioUrl" :src="pendingAudioUrl" controls style="width:100%"></audio><v-card-actions><v-spacer></v-spacer><v-btn text @click="discardAudio">Verwerfen</v-btn><v-btn color="#32BCC3" dark :loading="uploading" @click="sendPendingAudio">Senden</v-btn></v-card-actions></v-card></v-dialog>
                <v-snackbar v-model="feedback.visible" :color="feedback.color">{{feedback.text}}<v-btn text @click="feedback.visible=false">Schließen</v-btn></v-snackbar>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppChatWindow from '@/components/Chat/AppChatWindow.vue'
import { PARTY_COLORS, partyTextColor } from '@/constants/parties'
import { mdiAccount, mdiDotsVertical, mdiCalendarHeart, mdiMagnify, mdiImageOutline, mdiMicrophone, mdiStopCircleOutline } from '@mdi/js'
import { mapGetters } from 'vuex'
import Api from '@/service/Api'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')
const FALLBACK_POLL_INTERVAL_MS = 30000

export default {
  components: { AppChatWindow },
  data: () => ({
    newMessage: '',
    replyTo: null,
    dateDialog: false,
    datePlans: [],
    dateActivities: ['Kaffee', 'Spaziergang', 'Restaurant', 'Museum', 'Konzert', 'Eigene Idee'],
    dateForm: { activity: '', startsAt: '', place: '', note: '' },
    otherTyping: false,
    typingDisplayTimer: null,
    typingTimer: null,
    searchOpen: false,
    searchQuery: '',
    searchResults: [],
    uploading: false,
    uploadProgress: 0,
    recording: false,
    mediaRecorder: null,
    recordedChunks: [],
    recordingSeconds: 0,
    recordingTimer: null,
    pendingAudio: null,
    pendingAudioUrl: '',
    feedback: { visible: false, text: '', color: 'error' },
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
    svg: { account: mdiAccount, more: mdiDotsVertical, calendar: mdiCalendarHeart, search: mdiMagnify, image: mdiImageOutline, mic: mdiMicrophone, stop: mdiStopCircleOutline }
  }),
  computed: {
    ...mapGetters(['authUser', 'currentConversation', 'currentConversationMessages']),
    conversationId () {
      return this.$route.params.id
    },
    conversation () {
      return this.currentConversation
    },
    activeDatePlan () {
      return this.datePlans.find(plan => plan.status === 'proposed' || plan.status === 'accepted') || this.datePlans[0]
    },
    photoSrc () {
      if (!this.conversation || !this.conversation.otherUser.photoUrl) return ''
      return this.conversation.otherUser.photoUrl.startsWith('http') ? this.conversation.otherUser.photoUrl : `${API_ORIGIN}${this.conversation.otherUser.photoUrl}`
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
      const replyToId = this.replyTo && this.replyTo.id
      this.replyTo = null
      this.$store.dispatch('SEND_CONVERSATION_MESSAGE', { conversationId: this.conversationId, body, replyToId }).catch(() => {})
    },
    react ({ message, emoji }) {
      Api().post(`conversations/${this.conversationId}/messages/${message.id}/reactions`, { emoji }).then(() => this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId))
    },
    editMessage (message) {
      const body = window.prompt('Nachricht bearbeiten:', message.body)
      if (body && body.trim() && body.trim() !== message.body) Api().patch(`conversations/${this.conversationId}/messages/${message.id}`, { body }).then(() => this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId))
    },
    deleteMessage (message) {
      if (window.confirm('Diese Nachricht für alle löschen?')) Api().delete(`conversations/${this.conversationId}/messages/${message.id}`).then(() => this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId))
    },
    searchMessages () {
      if (this.searchQuery.trim().length < 2) return
      Api().get(`conversations/${this.conversationId}/messages/search`, { params: { q: this.searchQuery } }).then(({ data }) => { this.searchResults = data.messages })
    },
    sendTyping () {
      Api().post(`conversations/${this.conversationId}/typing`, { typing: true }).catch(() => {})
      clearTimeout(this.typingTimer)
      this.typingTimer = setTimeout(() => Api().post(`conversations/${this.conversationId}/typing`, { typing: false }).catch(() => {}), 1200)
    },
    uploadMedia (file, requireConsent) {
      const form = new FormData(); form.append('media', file, file.name || 'recording.webm'); form.append('requireConsent', String(requireConsent))
      this.uploading = true
      this.uploadProgress = 0
      return Api().post(`conversations/${this.conversationId}/media`, form, { onUploadProgress: event => { if (event.total) this.uploadProgress = Math.round(event.loaded * 100 / event.total) } }).then(({ data }) => { this.$store.commit('ADD_CONVERSATION_MESSAGE', data.message) }).catch(error => { this.feedback = { visible: true, color: 'error', text: (error.response && error.response.data && error.response.data.error) || 'Medium konnte nicht gesendet werden.' }; throw error }).finally(() => { this.uploading = false })
    },
    sendImage (event) {
      const file = event.target.files[0]; event.target.value = ''
      if (file) this.uploadMedia(file, true)
    },
    async toggleRecording () {
      if (this.recording) { this.mediaRecorder.stop(); return }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); this.recordedChunks = []
        const preferred = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
        this.mediaRecorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined)
        this.mediaRecorder.ondataavailable = event => { if (event.data.size) this.recordedChunks.push(event.data) }
        this.mediaRecorder.onstop = () => { stream.getTracks().forEach(track => track.stop()); clearInterval(this.recordingTimer); this.recording = false; const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' }); this.pendingAudio = new File([blob], 'sprachnachricht.webm', { type: blob.type }); this.pendingAudioUrl = URL.createObjectURL(blob) }
        this.mediaRecorder.start(); this.recording = true; this.recordingSeconds = 0; this.recordingTimer = setInterval(() => { this.recordingSeconds++ }, 1000)
      } catch (_) { this.feedback = { visible: true, color: 'error', text: 'Mikrofonzugriff ist nicht verfügbar oder wurde abgelehnt.' } }
    },
    formatDuration (seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` },
    discardAudio () { if (this.pendingAudioUrl) URL.revokeObjectURL(this.pendingAudioUrl); this.pendingAudio = null; this.pendingAudioUrl = ''; this.recordingSeconds = 0 },
    sendPendingAudio () { const file = this.pendingAudio; this.uploadMedia(file, false).then(() => this.discardAudio()).catch(() => {}) },
    approveAttachment ({ attachment }) {
      Api().post(`conversations/${this.conversationId}/attachments/${attachment.id}/consent`).then(() => this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId))
    },
    loadDatePlans () {
      return Api().get(`conversations/${this.conversationId}/date-plans`).then(({ data }) => { this.datePlans = data.plans })
    },
    proposeDate () {
      Api().post(`conversations/${this.conversationId}/date-plans`, this.dateForm).then(() => {
        this.dateDialog = false
        this.dateForm = { activity: '', startsAt: '', place: '', note: '' }
        this.loadDatePlans()
      })
    },
    respondDate (plan, status) {
      Api().patch(`conversations/${this.conversationId}/date-plans/${plan.id}`, { status }).then(this.loadDatePlans)
    },
    downloadCalendar (plan) {
      Api().get(`conversations/${this.conversationId}/date-plans/${plan.id}/calendar.ics`, { responseType: 'blob' }).then(({ data }) => {
        const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.download = 'herzklang-date.ics'; link.click(); URL.revokeObjectURL(url)
      })
    },
    checkIn (plan, status) { Api().post(`conversations/${this.conversationId}/date-plans/${plan.id}/checkin`, { status }) },
    dateStatus (plan) { return ({ proposed: 'Vorgeschlagen', accepted: 'Verabredet', declined: 'Abgelehnt', cancelled: 'Zurückgezogen' })[plan.status] },
    formatDate (value) { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) },
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
    this.loadDatePlans()
    this.eventSource = new EventSource(`${API_ORIGIN}/api/conversations/${this.conversationId}/events`, { withCredentials: true })
    this.eventSource.addEventListener('message', () => {
      this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId)
    })
    this.eventSource.addEventListener('message-update', () => this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId))
    this.eventSource.addEventListener('typing', (event) => {
      const data = JSON.parse(event.data)
      if (data.userId !== this.authUser.id) { this.otherTyping = data.typing; clearTimeout(this.typingDisplayTimer); if (data.typing) this.typingDisplayTimer = setTimeout(() => { this.otherTyping = false }, 1800) }
    })
    this.pollHandle = setInterval(() => {
      this.$store.dispatch('FETCH_CONVERSATION_MESSAGES', this.conversationId)
    }, FALLBACK_POLL_INTERVAL_MS)
  },
  beforeDestroy () {
    if (this.eventSource) this.eventSource.close()
    clearInterval(this.pollHandle)
    clearTimeout(this.typingTimer)
    clearTimeout(this.typingDisplayTimer)
    clearInterval(this.recordingTimer)
    if (this.pendingAudioUrl) URL.revokeObjectURL(this.pendingAudioUrl)
    if (this.mediaRecorder && this.recording) this.mediaRecorder.stop()
  }
}
</script>
