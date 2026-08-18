<template>
    <v-container class="gray" fluid style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6" lg="5">
                <div v-if="!myPets.length" class="content-board text-center pa-8">
                    <div class="title mb-3">Leg zuerst ein Tier an</div>
                    <v-btn to="/pets" color="#32BCC3" dark elevation="0">Tier anlegen</v-btn>
                </div>
                <template v-else>
                    <AppPetSwitcher></AppPetSwitcher>
                    <AppSwipeDeck :pets="discoverPets" @swipe="handleSwipe"></AppSwipeDeck>
                </template>
            </v-col>
        </v-row>

        <!------------------ MATCH DIALOG ------------------>
        <v-dialog v-model="showMatchDialog" max-width="360" persistent>
            <v-card class="text-center pa-6" v-if="lastMatchResult">
                <div class="headline font-weight-bold text-secundario mb-2">Es ist ein Match! 🎉</div>
                <div class="mb-4">{{activePet ? activePet.name : 'Dein Tier'}} und {{lastMatchResult.otherPet.name}} passen zusammen.</div>
                <v-btn color="#32BCC3" dark elevation="0" class="mr-2" @click="goToChat">Chat öffnen</v-btn>
                <v-btn color="#E0E0E0" elevation="0" @click="closeMatchDialog">Weiter swipen</v-btn>
            </v-card>
        </v-dialog>
        <!------------------ END MATCH DIALOG ------------------>
    </v-container>
</template>

<script>
import AppSwipeDeck from '@/components/Discover/AppSwipeDeck.vue'
import AppPetSwitcher from '@/components/Shared/AppPetSwitcher.vue'
import { mapGetters } from 'vuex'

export default {
  components: { AppSwipeDeck, AppPetSwitcher },
  computed: {
    ...mapGetters(['myPets', 'activePet', 'discoverPets', 'lastMatchResult']),
    showMatchDialog: {
      get () { return !!this.lastMatchResult },
      set (value) { if (!value) this.$store.dispatch('CLEAR_MATCH_RESULT') }
    }
  },
  created () {
    this.loadDeck()
  },
  watch: {
    activePet () {
      this.loadDeck()
    }
  },
  methods: {
    loadDeck () {
      if (this.activePet) this.$store.dispatch('FETCH_DISCOVER', { petId: this.activePet.id })
    },
    handleSwipe ({ petId, direction }) {
      if (!this.activePet) return
      this.$store.dispatch('SWIPE', { fromPetId: this.activePet.id, toPetId: petId, direction })
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
