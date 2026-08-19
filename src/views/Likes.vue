<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div v-if="!myPets.length" class="content-board text-center pa-8">
                    <div class="title mb-3">Leg zuerst ein Tier an</div>
                    <v-btn to="/pets" color="#32BCC3" dark elevation="0">Tier anlegen</v-btn>
                </div>

                <template v-else>
                    <AppPetSwitcher></AppPetSwitcher>

                    <div class="content-board mb-4 pa-0">
                        <v-tabs v-model="tab" color="#32BCC3" grow>
                            <v-tab>Erhalten ({{likesReceived.length}})</v-tab>
                            <v-tab>Gesendet ({{likesSent.length}})</v-tab>
                        </v-tabs>
                    </div>

                    <div v-if="tab === 0">
                        <div class="content-board text-center" v-if="!loadingUI && !likesReceived.length">
                            Noch hat kein anderes Tier {{activePet ? activePet.name : 'dieses Tier'}} geliked.
                        </div>
                        <v-list v-else two-line class="transparent">
                            <AppPetListItem v-for="pet in likesReceived" :key="pet.id" :pet="pet" :subtitle="`${pet.breed || ''}, ${pet.age} Jahre, ${pet.city || ''}`">
                                <template v-slot:actions>
                                    <v-btn icon color="#32BCC3" @click="likeBack(pet)">
                                        <v-icon>{{svg.heart}}</v-icon>
                                    </v-btn>
                                </template>
                            </AppPetListItem>
                        </v-list>
                    </div>

                    <div v-else>
                        <div class="content-board text-center" v-if="!loadingUI && !likesSent.length">
                            {{activePet ? activePet.name : 'Dieses Tier'}} hat noch niemandem gefallen - geh zum Swipen!
                        </div>
                        <v-list v-else two-line class="transparent">
                            <AppPetListItem v-for="pet in likesSent" :key="pet.id" :pet="pet" :subtitle="`${pet.breed || ''}, ${pet.age} Jahre, ${pet.city || ''} · noch kein Match`"></AppPetListItem>
                        </v-list>
                    </div>
                </template>

                <v-dialog v-model="showMatchDialog" max-width="360" persistent>
                    <v-card class="text-center pa-6" v-if="lastMatchResult">
                        <div class="headline font-weight-bold text-secundario mb-2">Es ist ein Match! 🎉</div>
                        <div class="mb-4">{{activePet ? activePet.name : 'Dein Tier'}} und {{lastMatchResult.otherPet.name}} passen zusammen.</div>
                        <v-btn color="#32BCC3" dark elevation="0" class="mr-2" @click="goToChat">Chat öffnen</v-btn>
                        <v-btn color="#E0E0E0" elevation="0" @click="closeMatchDialog">Schließen</v-btn>
                    </v-card>
                </v-dialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppPetListItem from '@/components/Shared/AppPetListItem.vue'
import AppPetSwitcher from '@/components/Shared/AppPetSwitcher.vue'
import { mdiHeart } from '@mdi/js'
import { mapGetters } from 'vuex'

export default {
  components: { AppPetListItem, AppPetSwitcher },
  data: () => ({
    tab: 0,
    svg: { heart: mdiHeart }
  }),
  computed: {
    ...mapGetters(['myPets', 'activePet', 'likesSent', 'likesReceived', 'loadingUI', 'lastMatchResult']),
    showMatchDialog: {
      get () { return !!this.lastMatchResult },
      set (value) { if (!value) this.$store.dispatch('CLEAR_MATCH_RESULT') }
    }
  },
  created () {
    this.loadLikes()
  },
  watch: {
    activePet () {
      this.loadLikes()
    }
  },
  methods: {
    loadLikes () {
      if (this.activePet) this.$store.dispatch('FETCH_LIKES', this.activePet.id)
    },
    likeBack (pet) {
      if (!this.activePet) return
      this.$store.dispatch('SWIPE', { fromPetId: this.activePet.id, toPetId: pet.id, direction: 'like' })
        .then(() => this.loadLikes())
    },
    closeMatchDialog () {
      this.$store.dispatch('CLEAR_MATCH_RESULT')
    },
    goToChat () {
      const conversationId = this.lastMatchResult.conversationId
      this.$store.dispatch('CLEAR_MATCH_RESULT')
      this.$router.push({ name: 'chat', params: { id: conversationId } })
    }
  }
}
</script>
