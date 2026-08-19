<template>
    <v-list-item @click="$router.push({ name: 'chat', params: { id: conversation.id } })" class="mb-2 background rounded">
        <v-list-item-avatar size="56">
            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
            <v-icon v-else size="32">{{svg.account}}</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
                @{{conversation.otherUser.handle}}
                <v-chip v-if="conversation.hasMatch" x-small color="#32BCC3" text-color="white" class="ml-2">Match</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle v-if="conversation.lastMessage">{{conversation.lastMessage.body}}</v-list-item-subtitle>
            <v-list-item-subtitle v-else class="font-italic">Noch keine Nachrichten</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action-text v-if="conversation.lastMessage">
            {{conversation.lastMessage.createdAt | day}}
        </v-list-item-action-text>
    </v-list-item>
</template>

<script>
import { mdiAccount } from '@mdi/js'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    conversation: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    svg: { account: mdiAccount }
  }),
  computed: {
    photoSrc () {
      if (!this.conversation.otherUser.photoUrl) return ''
      return this.conversation.otherUser.photoUrl.startsWith('http') ? this.conversation.otherUser.photoUrl : `${API_ORIGIN}${this.conversation.otherUser.photoUrl}`
    }
  }
}
</script>
