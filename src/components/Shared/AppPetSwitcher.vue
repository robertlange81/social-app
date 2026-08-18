<template>
    <div class="content-board mb-4 d-flex align-center flex-wrap" v-if="myPets.length">
        <span class="mr-3 font-weight-bold">Wer sucht:</span>
        <v-chip-group v-model="selectedIndex" mandatory active-class="primario white--text">
            <v-chip v-for="pet in myPets" :key="pet.id" filter>
                {{speciesIcon(pet.species)}} {{pet.name}}
            </v-chip>
        </v-chip-group>
        <v-spacer></v-spacer>
        <v-btn to="/pets" text small>+ Weiteres Tier</v-btn>
    </div>
</template>

<script>
import { SPECIES_ICON } from '@/constants/pets'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['myPets', 'activePetId']),
    selectedIndex: {
      get () {
        const index = this.myPets.findIndex(p => p.id === this.activePetId)
        return index === -1 ? 0 : index
      },
      set (index) {
        const pet = this.myPets[index]
        if (pet) this.$store.dispatch('SET_ACTIVE_PET', pet.id)
      }
    }
  },
  methods: {
    speciesIcon (species) {
      return SPECIES_ICON[species] || '🐾'
    }
  }
}
</script>
