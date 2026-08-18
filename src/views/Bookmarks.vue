<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Gemerkte Tiere</div>
                </div>

                <div class="content-board text-center" v-if="!loadingUI && !bookmarks.length">
                    Noch keine gemerkten Tiere. Klicke auf das Lesezeichen-Symbol bei einem Tier, um es hier zu speichern.
                </div>

                <v-list v-else two-line class="transparent">
                    <AppPetListItem v-for="pet in bookmarks" :key="pet.id" :pet="pet" :subtitle="`${pet.breed || ''}, ${pet.age} Jahre, ${pet.city || ''}`">
                        <template v-slot:actions>
                            <v-btn icon @click="remove(pet)">
                                <v-icon color="#32BCC3">{{svg.bookmarkFilled}}</v-icon>
                            </v-btn>
                        </template>
                    </AppPetListItem>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AppPetListItem from '@/components/Shared/AppPetListItem.vue'
import { mdiBookmark } from '@mdi/js'
import { mapGetters } from 'vuex'

export default {
  components: { AppPetListItem },
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
    remove (pet) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { petId: pet.id, bookmarked: true })
    }
  }
}
</script>
