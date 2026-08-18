<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Profilbesucher</div>
                    <div class="caption grey--text">Wer sich die Profile deiner Tiere angesehen hat.</div>
                </div>

                <div class="content-board text-center" v-if="!loadingUI && !visitors.length">
                    Noch niemand hat eines deiner Tiere angesehen.
                </div>

                <v-list v-else two-line class="transparent">
                    <AppPetListItem
                        v-for="visit in visitors"
                        :key="`${visit.id}-${visit.visitorHandle}`"
                        :pet="visit"
                        :subtitle="`Besucher @${visit.visitorHandle} - zuletzt ${formatDay(visit.lastViewedAt)}${visit.viewCount > 1 ? ' · ' + visit.viewCount + 'x' : ''}`"
                    ></AppPetListItem>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppPetListItem from '@/components/Shared/AppPetListItem.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { mapGetters } from 'vuex'

dayjs.extend(relativeTime)

export default {
  components: { AppPetListItem },
  computed: {
    ...mapGetters(['visitors', 'loadingUI'])
  },
  created () {
    this.$store.dispatch('FETCH_VISITORS')
  },
  methods: {
    formatDay (date) {
      return dayjs(date).fromNow()
    }
  }
}
</script>
