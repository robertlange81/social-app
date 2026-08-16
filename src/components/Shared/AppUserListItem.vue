<template>
    <v-list-item :to="`/profile/${user.handle}`" class="mb-2 background rounded">
        <v-list-item-avatar size="56">
            <v-img v-if="photoSrc" :src="photoSrc"></v-img>
            <v-icon v-else size="40" color="white" class="background-secundario" style="width:100%; height:100%;">{{svg.account}}</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
                @{{user.handle}}
                <v-chip x-small :color="partyColor(user.party)" :text-color="partyTextColor(user.party)" class="ml-2">
                    {{user.party}}
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
import { PARTY_COLORS, partyTextColor } from '@/constants/parties'
import { mdiAccount } from '@mdi/js'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

export default {
  props: {
    user: {
      type: Object,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    svg: { account: mdiAccount }
  }),
  methods: {
    partyColor (party) {
      return PARTY_COLORS[party] || '#607D8B'
    },
    partyTextColor
  },
  computed: {
    photoSrc () {
      if (!this.user.photoUrl) return ''
      return this.user.photoUrl.startsWith('http') ? this.user.photoUrl : `${API_ORIGIN}${this.user.photoUrl}`
    }
  }
}
</script>
