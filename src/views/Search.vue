<template>
    <v-container fluid class="gray page-container" style="min-height: 100vh;">
        <div class="content-board mb-5">
            <div class="headline font-weight-bold text-secundario">Suche</div>
            <div class="caption grey--text mb-4">Vorbelegt mit deinen Angaben aus Registrierung/Profil - du kannst die Filter jederzeit anpassen.</div>
            <v-form @submit.prevent="runSearch">
                <v-row dense>
                    <v-col cols="12" sm="6" md="3">
                        <v-text-field v-model="filters.q" label="Name oder Stichwort" color="cyan" clearable hide-details></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-text-field v-model="filters.city" label="Stadt" color="cyan" clearable hide-details></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3" md="2">
                        <v-select v-model="filters.gender" :items="genderOptions" item-text="text" item-value="value" label="Geschlecht" color="cyan" clearable hide-details></v-select>
                    </v-col>
                    <v-col cols="6" sm="3" md="2">
                        <v-select v-model="filters.party" :items="parties" label="Partei" color="cyan" clearable hide-details></v-select>
                    </v-col>
                    <v-col cols="6" sm="3" md="1">
                        <v-text-field v-model.number="filters.minAge" type="number" label="Alter von" color="cyan" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3" md="1">
                        <v-text-field v-model.number="filters.maxAge" type="number" label="Alter bis" color="cyan" hide-details></v-text-field>
                    </v-col>
                </v-row>
                <div class="mt-4">
                    <v-btn type="submit" color="#32BCC3" dark elevation="0" :loading="loadingUI">Suchen</v-btn>
                    <v-btn text class="ml-2" @click="resetFilters">Filter zurücksetzen</v-btn>
                </div>
            </v-form>
        </div>

        <div class="content-board mb-3" v-if="searchTotal">
            {{searchTotal}} Profile gefunden - Seite {{page}} von {{totalPages}}
        </div>
        <div class="content-board text-center" v-else-if="!loadingUI && searched">
            Keine Profile gefunden. Versuch es mit weniger Filtern.
        </div>

        <div class="card-grid">
            <router-link v-for="profile in searchResults" :key="profile.id" :to="`/profile/${profile.handle}`" style="text-decoration: none;">
                <AppProfileCard :profile="profile" show-bookmark @toggle-bookmark="onToggleBookmark"></AppProfileCard>
            </router-link>
        </div>

        <div class="content-board center mt-4" v-if="totalPages > 1">
            <v-btn icon :disabled="page <= 1" @click="changePage(page - 1)"><v-icon>{{svg.prev}}</v-icon></v-btn>
            <span class="mx-3">Seite {{page}} / {{totalPages}}</span>
            <v-btn icon :disabled="page >= totalPages" @click="changePage(page + 1)"><v-icon>{{svg.next}}</v-icon></v-btn>
        </div>
    </v-container>
</template>

<script>
import AppProfileCard from '@/components/Discover/AppProfileCard.vue'
import { PARTIES, GENDERS } from '@/constants/parties'
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { mapGetters } from 'vuex'

const PAGE_SIZE = 24

export default {
  components: { AppProfileCard },
  data: () => ({
    filters: { q: '', city: '', gender: null, party: null, minAge: null, maxAge: null },
    page: 1,
    searched: false,
    parties: PARTIES,
    genderOptions: GENDERS,
    svg: { prev: mdiChevronLeft, next: mdiChevronRight }
  }),
  computed: {
    ...mapGetters(['searchResults', 'searchTotal', 'loadingUI', 'authUser']),
    totalPages () {
      return Math.max(Math.ceil(this.searchTotal / PAGE_SIZE), 1)
    }
  },
  created () {
    this.filters = this.defaultFilters()
    this.runSearch()
  },
  methods: {
    // Vorbelegung mit den Angaben aus Registrierung/Profil: "gesucht wird"
    // -> Geschlecht-Filter, eigener Wohnort -> Stadt-Filter.
    defaultFilters () {
      const gender = (this.authUser && this.authUser.seekingGender !== 'all') ? this.authUser.seekingGender : null
      const city = (this.authUser && this.authUser.city) || ''
      return { q: '', city, gender, party: null, minAge: null, maxAge: null }
    },
    runSearch () {
      this.page = 1
      this.fetchPage()
    },
    changePage (page) {
      this.page = page
      this.fetchPage()
    },
    fetchPage () {
      this.searched = true
      const params = Object.assign({}, this.filters, { page: this.page, pageSize: PAGE_SIZE })
      Object.keys(params).forEach(k => { if (params[k] === null || params[k] === '') delete params[k] })
      this.$store.dispatch('SEARCH_PROFILES', params)
    },
    resetFilters () {
      this.filters = this.defaultFilters()
      this.runSearch()
    },
    onToggleBookmark (profile) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { userId: profile.id, bookmarked: !!profile.isBookmarked })
    }
  }
}
</script>
