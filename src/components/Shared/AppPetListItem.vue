<template>
    <v-list-item :to="`/pet/${pet.id}`" class="mb-2 background rounded">
        <v-list-item-avatar size="56">
            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
            <span v-else style="font-size:32px;">{{speciesIcon}}</span>
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
                {{pet.name}}
                <v-chip x-small :color="purposeColor(pet.purpose)" text-color="white" class="ml-2">
                    {{purposeText(pet.purpose)}}
                </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle v-if="subtitle">{{subtitle}}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action class="d-flex flex-row align-center" @click.prevent.stop>
            <slot name="actions"></slot>
        </v-list-item-action>
    </v-list-item>
</template>

<script>
import { PURPOSE_COLORS, purposeLabel, SPECIES_ICON } from '@/constants/pets'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    pet: {
      type: Object,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    }
  },
  methods: {
    purposeColor (purpose) {
      return PURPOSE_COLORS[purpose] || '#607D8B'
    },
    purposeText: purposeLabel
  },
  computed: {
    speciesIcon () {
      return SPECIES_ICON[this.pet.species] || '🐾'
    },
    photoSrc () {
      if (!this.pet.photoUrl) return ''
      return this.pet.photoUrl.startsWith('http') ? this.pet.photoUrl : `${API_ORIGIN}${this.pet.photoUrl}`
    }
  }
}
</script>
