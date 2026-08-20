<template>
  <v-menu v-model="open" offset-y left max-width="380" @input="value => value && markRead()">
    <template v-slot:activator="{ on }"><v-badge :content="unread" :value="unread" color="pink" overlap><v-btn icon v-on="on" aria-label="Benachrichtigungen"><v-icon color="white">{{icon}}</v-icon></v-btn></v-badge></template>
    <v-card width="360"><v-card-title class="subtitle-1">Benachrichtigungen</v-card-title><v-divider></v-divider>
      <v-list v-if="items.length" two-line max-height="480" style="overflow:auto"><v-list-item v-for="item in items" :key="item.id" @click="go(item)"><v-list-item-content><v-list-item-title>{{item.title}}</v-list-item-title><v-list-item-subtitle>{{item.body || formatDate(item.createdAt)}}</v-list-item-subtitle></v-list-item-content><v-icon v-if="!item.readAt" small color="pink">{{dot}}</v-icon></v-list-item></v-list>
      <v-card-text v-else class="text-center grey--text">Noch nichts Neues.</v-card-text>
    </v-card>
  </v-menu>
</template>
<script>
import Api from '@/service/Api'
import { mdiBellOutline, mdiCircle } from '@mdi/js'
const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')
export default {
  data: () => ({ open: false, items: [], unread: 0, source: null, icon: mdiBellOutline, dot: mdiCircle }),
  created () { this.load(); this.source = new EventSource(`${API_ORIGIN}/api/notifications/events`, { withCredentials: true }); this.source.addEventListener('notification', this.load) },
  beforeDestroy () { if (this.source) this.source.close() },
  methods: {
    load () { Api().get('notifications').then(({ data }) => { this.items = data.notifications; this.unread = data.unreadCount }) },
    markRead () { if (!this.unread) return; Api().post('notifications/read', {}).then(() => { this.unread = 0; this.items.forEach(item => { item.readAt = item.readAt || new Date().toISOString() }) }) },
    go (item) { this.open = false; if (item.link && this.$route.fullPath !== item.link) this.$router.push(item.link) },
    formatDate (value) { return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
  }
}
</script>
