<template>
    <v-list-item @click="$router.push({ name: 'chat', params: { id: match.id } })" class="mb-2 background rounded">
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
            <v-list-item-subtitle v-else class="font-italic">Noch keine Nachrichten - schreib als Erste:r!</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action-text v-if="match.lastMessage">
            {{match.lastMessage.createdAt | day}}
        </v-list-item-action-text>
    </v-list-item>
</template>

<script>
import { PARTY_COLORS, partyTextColor } from '@/constants/parties'
import { mdiAccount } from '@mdi/js'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    match: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    svg: { account: mdiAccount }
  }),
  methods: {
    partyColor (party) {
      return PARTY_COLORS[party] || '#607D8B'
    },
    partyTextColor
  },
  computed: {
    photoSrc () {
      if (!this.match.otherUser.photoUrl) return ''
      return this.match.otherUser.photoUrl.startsWith('http') ? this.match.otherUser.photoUrl : `${API_ORIGIN}${this.match.otherUser.photoUrl}`
    }
  }
}
</script>
