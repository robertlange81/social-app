<template>
    <div ref="scrollBox" class="chat-window pa-3">
        <div v-if="!messages.length" class="text-center grey--text pa-6">
            Noch keine Nachrichten. Sag Hallo!
        </div>
        <AppChatMessage
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :is-own="message.senderId === authUserId"
        ></AppChatMessage>
    </div>
</template>

<script>
import AppChatMessage from './AppChatMessage.vue'

export default {
  components: { AppChatMessage },
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    authUserId: {
      type: String,
      required: true
    }
  },
  watch: {
    messages () {
      this.scrollToBottom()
    }
  },
  mounted () {
    this.scrollToBottom()
  },
  methods: {
    scrollToBottom () {
      this.$nextTick(() => {
        const el = this.$refs.scrollBox
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  }
}
</script>

<style scoped>
.chat-window {
    height: 55vh;
    overflow-y: auto;
}
</style>
