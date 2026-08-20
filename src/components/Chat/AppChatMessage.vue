<template>
    <div class="d-flex mb-2" :class="isOwn ? 'justify-end' : 'justify-start'">
        <div
            class="pa-3"
            :class="isOwn ? 'primario white--text' : 'background'"
            style="border-radius: 16px; max-width: 75%;"
        >
            <div v-if="message.replyTo" class="reply-preview caption pa-2 mb-2">{{message.replyTo.body}}</div>
            <div :class="{ 'font-italic grey--text': message.deleted }">{{message.body}} <span v-if="message.edited && !message.deleted" class="caption">(bearbeitet)</span></div>
            <div v-if="message.attachment" class="mt-2">
                <v-btn v-if="!message.attachment.approved" small color="#32BCC3" dark @click="$emit('approve', message.attachment)">Bild bewusst anzeigen</v-btn>
                <v-img v-else-if="message.attachment.type === 'image'" :src="attachmentUrl" max-width="320" max-height="320" contain class="rounded"></v-img>
                <audio v-else-if="message.attachment.type === 'audio'" :src="attachmentUrl" controls preload="metadata" style="max-width:280px; width:100%;"></audio>
            </div>
            <div class="caption mt-1" :class="isOwn ? 'white--text' : 'grey--text'" style="opacity:0.8;">
                {{message.createdAt | day}}
            </div>
            <div class="mt-1 reactions">
                <button v-for="reaction in message.reactions" :key="reaction.emoji" type="button" class="reaction-chip" :class="{ active: reaction.reactedByMe }" @click="$emit('react', reaction.emoji)">{{reaction.emoji}} {{reaction.count}}</button>
                <v-menu offset-y>
                    <template v-slot:activator="{ on }"><v-btn x-small text v-on="on" :color="isOwn ? 'white' : 'grey'">☺</v-btn></template>
                    <v-card class="pa-1"><v-btn v-for="emoji in emojis" :key="emoji" icon small @click="$emit('react', emoji)">{{emoji}}</v-btn></v-card>
                </v-menu>
                <v-btn x-small text :color="isOwn ? 'white' : 'grey'" @click="$emit('reply')">Antworten</v-btn>
                <v-menu v-if="isOwn && !message.deleted" offset-y><template v-slot:activator="{ on }"><v-btn x-small text :color="isOwn ? 'white' : 'grey'" v-on="on">•••</v-btn></template><v-list dense><v-list-item @click="$emit('edit')">Bearbeiten</v-list-item><v-list-item @click="$emit('delete')">Löschen</v-list-item></v-list></v-menu>
            </div>
        </div>
    </div>
</template>

<script>
const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')
export default {
  data: () => ({ emojis: ['❤️', '👍', '😂', '😮', '😢'] }),
  computed: { attachmentUrl () { const url = this.message.attachment && this.message.attachment.url; return url && (url.startsWith('http') ? url : `${API_ORIGIN}${url}`) } },
  props: {
    message: {
      type: Object,
      required: true
    },
    isOwn: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.reply-preview { border-left: 3px solid currentColor; opacity: .75; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reactions { display: flex; align-items: center; flex-wrap: wrap; gap: 3px; }
.reaction-chip { border: 1px solid rgba(0,0,0,.15); border-radius: 12px; padding: 1px 7px; background: rgba(255,255,255,.8); }
.reaction-chip.active { border-color: #e91e63; }
</style>
