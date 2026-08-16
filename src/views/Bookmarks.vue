<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Gemerkte Profile</div>
                </div>

                <div class="content-board text-center" v-if="!loadingUI && !bookmarks.length">
                    Noch keine gemerkten Profile. Klicke auf das Lesezeichen-Symbol bei einem Profil, um es hier zu speichern.
                </div>

                <v-list v-else two-line class="transparent">
                    <AppUserListItem v-for="user in bookmarks" :key="user.id" :user="user" :subtitle="`${user.age} Jahre, ${user.city || ''}`">
                        <template v-slot:actions>
                            <v-btn icon @click="remove(user)">
                                <v-icon color="#32BCC3">{{svg.bookmarkFilled}}</v-icon>
                            </v-btn>
                        </template>
                    </AppUserListItem>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppUserListItem from '@/components/Shared/AppUserListItem.vue'
import { mdiBookmark } from '@mdi/js'
import { mapGetters } from 'vuex'

export default {
  components: { AppUserListItem },
  data: () => ({
    svg: { bookmarkFilled: mdiBookmark }
  }),
  computed: {
    ...mapGetters(['bookmarks', 'loadingUI'])
  },
  created () {
    this.$store.dispatch('FETCH_BOOKMARKS')
  },
  methods: {
    remove (user) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { userId: user.id, bookmarked: true })
    }
  }
}
</script>
