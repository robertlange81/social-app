<template>
    <v-container fluid class="gray page-container" style="min-height: 100vh;">
        <div class="content-board mb-5">
            <div class="headline font-weight-bold text-secundario">Suche</div>
            <div class="caption grey--text mb-4">Durchstöbere alle Tiere - unabhängig vom Swipe-Status.</div>
            <v-form @submit.prevent="runSearch">
                <v-row dense>
                    <v-col cols="12" sm="6" md="3">
                        <v-text-field v-model="filters.q" label="Name, Rasse oder Stichwort" color="cyan" clearable hide-details></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="3">
                        <v-text-field v-model="filters.city" label="Stadt" color="cyan" clearable hide-details></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3" md="2">
                        <v-select v-model="filters.species" :items="speciesOptions" item-text="text" item-value="value" label="Tierart" color="cyan" clearable hide-details></v-select>
                    </v-col>
                    <v-col cols="6" sm="3" md="2">
                        <v-select v-model="filters.purpose" :items="purposeOptions" item-text="text" item-value="value" label="Sucht" color="cyan" clearable hide-details></v-select>
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
            {{searchTotal}} Tiere gefunden - Seite {{page}} von {{totalPages}}
        </div>
        <div class="content-board text-center" v-else-if="!loadingUI && searched">
            Keine Tiere gefunden. Versuch es mit weniger Filtern.
        </div>

        <div class="card-grid">
            <router-link v-for="pet in searchResults" :key="pet.id" :to="`/pet/${pet.id}`" style="text-decoration: none;">
                <AppPetCard :pet="pet" show-bookmark @toggle-bookmark="onToggleBookmark"></AppPetCard>
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
import AppPetCard from '@/components/Discover/AppPetCard.vue'
import { SPECIES, PURPOSES } from '@/constants/pets'
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { mapGetters } from 'vuex'

const PAGE_SIZE = 24

export default {
  components: { AppPetCard },
  data: () => ({
    filters: { q: '', city: '', species: null, purpose: null, minAge: null, maxAge: null },
    page: 1,
    searched: false,
    speciesOptions: SPECIES,
    purposeOptions: PURPOSES,
    svg: { prev: mdiChevronLeft, next: mdiChevronRight }
  }),
  computed: {
    ...mapGetters(['searchResults', 'searchTotal', 'loadingUI', 'activePet']),
    totalPages () {
      return Math.max(Math.ceil(this.searchTotal / PAGE_SIZE), 1)
    }
  },
  created () {
    this.filters = this.defaultFilters()
    this.runSearch()
  },
  methods: {
    // Vorbelegung mit dem aktiven eigenen Tier: gleiche Tierart, gleicher Zweck.
    defaultFilters () {
      const species = (this.activePet && this.activePet.species) || null
      const purpose = (this.activePet && this.activePet.purpose !== 'both') ? this.activePet.purpose : null
      return { q: '', city: '', species, purpose, minAge: null, maxAge: null }
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
      this.$store.dispatch('SEARCH_PETS', params)
    },
    resetFilters () {
      this.filters = this.defaultFilters()
      this.runSearch()
    },
    onToggleBookmark (pet) {
      this.$store.dispatch('TOGGLE_BOOKMARK', { petId: pet.id, bookmarked: !!pet.isBookmarked })
    }
  }
}
</script>
