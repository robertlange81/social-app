<template>
    <v-container class="gray" style="min-height: 100vh;">
        <v-row justify="center">
            <v-col cols="12" sm="8" md="6">
                <div class="content-board mb-4">
                    <div class="headline font-weight-bold text-secundario">Blockierte Nutzer</div>
                </div>
                <div v-if="!loadingUI && !blockedUsers.length" class="content-board text-center pa-6">
                    Du hast niemanden blockiert.
                </div>
                <v-list v-else two-line class="transparent">
                    <v-list-item v-for="user in blockedUsers" :key="user.id" class="mb-2 background rounded">
                        <v-list-item-content>
                            <v-list-item-title class="font-weight-bold">@{{user.handle}}</v-list-item-title>
                            <v-list-item-subtitle v-if="user.city">{{user.city}}</v-list-item-subtitle>
                        </v-list-item-content>
                        <v-list-item-action>
                            <v-btn text small @click="unblock(user)">Entblocken</v-btn>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  created () {
    this.$store.dispatch('FETCH_BLOCKED')
  },
  computed: {
    ...mapGetters(['blockedUsers', 'loadingUI'])
  },
  methods: {
    unblock (user) {
      this.$store.dispatch('UNBLOCK_USER', user.id)
    }
  }
}
</script>
