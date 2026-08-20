<template><v-bottom-navigation v-if="isAuthenticated" app fixed class="d-sm-none" color="#168890" grow>
  <v-btn to="/"><span>Start</span><v-icon>{{icons.home}}</v-icon></v-btn>
  <v-btn to="/discover"><span>Entdecken</span><v-icon>{{icons.heart}}</v-icon></v-btn>
  <v-btn to="/feed"><span>Pinnwand</span><v-icon>{{icons.feed}}</v-icon></v-btn>
  <v-btn to="/chats"><span>Chats</span><v-icon>{{icons.chat}}</v-icon></v-btn>
  <v-btn to="/groups"><span>Gruppen</span><v-icon>{{icons.groups}}</v-icon></v-btn>
</v-bottom-navigation></template>
<script>
import { mapGetters } from 'vuex'
import { mdiHome, mdiCardsHeart, mdiViewStream, mdiMessageTextOutline, mdiAccountGroup } from '@mdi/js'
export default { data: () => ({ icons: { home: mdiHome, heart: mdiCardsHeart, feed: mdiViewStream, chat: mdiMessageTextOutline, groups: mdiAccountGroup } }), computed: { ...mapGetters(['isAuthenticated']) } }
</script>
