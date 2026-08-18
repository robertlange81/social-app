<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Deine Matches</div>
                </div>
                <div v-if="!loadingUI && !matches.length" class="content-board text-center pa-6">
                    Noch keine Matches. Geh zu "Entdecken" und finde einen Partner für dein Tier!
                </div>
                <v-list v-else two-line class="transparent">
                    <AppMatchListItem v-for="match in matches" :key="match.id" :match="match"></AppMatchListItem>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppMatchListItem from '@/components/Matches/AppMatchListItem.vue'
import { mapGetters } from 'vuex'

export default {
  components: { AppMatchListItem },
  created () {
    this.$store.dispatch('FETCH_MATCHES')
  },
  computed: {
    ...mapGetters(['matches', 'loadingUI'])
  }
}
</script>
