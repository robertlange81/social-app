<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Nachrichten</div>
                    <div class="caption grey--text">Alle Unterhaltungen - mit und ohne Match.</div>
                </div>
                <div v-if="!loadingUI && !conversations.length" class="content-board text-center pa-6">
                    Noch keine Unterhaltungen. Schreib jemandem über sein Profil eine Nachricht!
                </div>
                <v-list v-else two-line class="transparent">
                    <AppConversationListItem v-for="conv in conversations" :key="conv.id" :conversation="conv"></AppConversationListItem>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppConversationListItem from '@/components/Shared/AppConversationListItem.vue'
import { mapGetters } from 'vuex'

export default {
  components: { AppConversationListItem },
  created () {
    this.$store.dispatch('FETCH_CONVERSATIONS')
  },
  computed: {
    ...mapGetters(['conversations', 'loadingUI'])
  }
}
</script>
