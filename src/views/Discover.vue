<template>
    <v-container class="gray" fluid style="min-height: 100vh;">
        <v-row justify="center" class="pt-6">
            <v-col cols="12" sm="8" md="6" lg="4">
                <AppSwipeDeck :profiles="discoverProfiles" @swipe="handleSwipe"></AppSwipeDeck>
            </v-col>
        </v-row>

        <!------------------ MATCH DIALOG ------------------>
        <v-dialog v-model="showMatchDialog" max-width="360" persistent>
            <v-card class="text-center pa-6" v-if="lastMatchResult">
                <div class="headline font-weight-bold text-secundario mb-2">Es ist ein Match! 🎉</div>
                <div class="mb-4">Du und @{{lastMatchResult.otherUser.handle}} habt euch beide gemocht.</div>
                <v-btn color="#32BCC3" dark elevation="0" class="mr-2" @click="goToChat">Chat öffnen</v-btn>
                <v-btn color="#E0E0E0" elevation="0" @click="closeMatchDialog">Weiter swipen</v-btn>
            </v-card>
        </v-dialog>
        <!------------------ END MATCH DIALOG ------------------>
    </v-container>
</template>

<script>
import AppSwipeDeck from '@/components/Discover/AppSwipeDeck.vue'
import { mapGetters } from 'vuex'

export default {
  components: { AppSwipeDeck },
  created () {
    this.$store.dispatch('FETCH_DISCOVER')
  },
  computed: {
    ...mapGetters(['discoverProfiles', 'lastMatchResult']),
    showMatchDialog: {
      get () { return !!this.lastMatchResult },
      set (value) { if (!value) this.$store.dispatch('CLEAR_MATCH_RESULT') }
    }
  },
  methods: {
    handleSwipe ({ userId, direction }) {
      this.$store.dispatch('SWIPE', { toUserId: userId, direction })
    },
    closeMatchDialog () {
      this.$store.dispatch('CLEAR_MATCH_RESULT')
    },
    goToChat () {
      const matchId = this.lastMatchResult.matchId
      this.$store.dispatch('CLEAR_MATCH_RESULT')
      this.$router.push({ name: 'chat', params: { id: matchId } })
    }
  }
}
</script>
