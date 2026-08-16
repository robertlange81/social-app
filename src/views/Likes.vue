<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4 pa-0">
                    <v-tabs v-model="tab" color="#32BCC3" grow>
                        <v-tab>Erhalten ({{likesReceived.length}})</v-tab>
                        <v-tab>Gesendet ({{likesSent.length}})</v-tab>
                    </v-tabs>
                </div>

                <div v-if="tab === 0">
                    <div class="content-board text-center" v-if="!loadingUI && !likesReceived.length">
                        Noch niemand hat dich geliked.
                    </div>
                    <v-list v-else two-line class="transparent">
                        <AppUserListItem v-for="user in likesReceived" :key="user.id" :user="user" :subtitle="`${user.age} Jahre, ${user.city || ''}`">
                            <template v-slot:actions>
                                <v-btn icon color="#32BCC3" @click="likeBack(user)">
                                    <v-icon>{{svg.heart}}</v-icon>
                                </v-btn>
                            </template>
                        </AppUserListItem>
                    </v-list>
                </div>

                <div v-else>
                    <div class="content-board text-center" v-if="!loadingUI && !likesSent.length">
                        Du hast noch niemandem gefallen - geh zu "Entdecken"!
                    </div>
                    <v-list v-else two-line class="transparent">
                        <AppUserListItem v-for="user in likesSent" :key="user.id" :user="user" :subtitle="`${user.age} Jahre, ${user.city || ''} · noch kein Match`"></AppUserListItem>
                    </v-list>
                </div>

                <v-dialog v-model="showMatchDialog" max-width="360" persistent>
                    <v-card class="text-center pa-6" v-if="lastMatchResult">
                        <div class="headline font-weight-bold text-secundario mb-2">Es ist ein Match! 🎉</div>
                        <div class="mb-4">Du und @{{lastMatchResult.otherUser.handle}} habt euch beide gemocht.</div>
                        <v-btn color="#32BCC3" dark elevation="0" class="mr-2" @click="goToChat">Chat öffnen</v-btn>
                        <v-btn color="#E0E0E0" elevation="0" @click="closeMatchDialog">Schließen</v-btn>
                    </v-card>
                </v-dialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppUserListItem from '@/components/Shared/AppUserListItem.vue'
import { mdiHeart } from '@mdi/js'
import { mapGetters } from 'vuex'

export default {
  components: { AppUserListItem },
  data: () => ({
    tab: 0,
    svg: { heart: mdiHeart }
  }),
  computed: {
    ...mapGetters(['likesSent', 'likesReceived', 'loadingUI', 'lastMatchResult']),
    showMatchDialog: {
      get () { return !!this.lastMatchResult },
      set (value) { if (!value) this.$store.dispatch('CLEAR_MATCH_RESULT') }
    }
  },
  created () {
    this.$store.dispatch('FETCH_LIKES')
  },
  methods: {
    likeBack (user) {
      this.$store.dispatch('SWIPE', { toUserId: user.id, direction: 'like' })
        .then(() => this.$store.dispatch('FETCH_LIKES'))
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
