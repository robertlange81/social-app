<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Deine Profilbesucher</div>
                </div>

                <div class="content-board text-center" v-if="!loadingUI && !visitors.length">
                    Noch niemand hat dein Profil angesehen.
                </div>

                <v-list v-else two-line class="transparent">
                    <AppUserListItem
                        v-for="user in visitors"
                        :key="user.id"
                        :user="user"
                        :subtitle="`Zuletzt gesehen ${formatDay(user.lastViewedAt)}${user.viewCount > 1 ? ' · ' + user.viewCount + 'x' : ''}`"
                    ></AppUserListItem>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppUserListItem from '@/components/Shared/AppUserListItem.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { mapGetters } from 'vuex'

dayjs.extend(relativeTime)

export default {
  components: { AppUserListItem },
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
