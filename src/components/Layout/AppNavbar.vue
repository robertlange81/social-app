<template>
    <v-app-bar app class="primario" elevation="0" dark>

        <!--------------------------- NAVBAR TITLE ---------------------------->
        <v-toolbar-title class="headline text-uppercase hover" @click="$router.push('/')">
            <span>🐾 PFOTENMATCH</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <!--------------------------- END NAVBAR TITLE ---------------------------->

        <template v-if="isAuthenticated">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn exact to="/pets" class="mr-2" elevation="0" color="#32BCC3" fab small v-on="on">
                        <v-icon>{{svg.pets}}</v-icon>
                    </v-btn>
                </template>
                <span>Meine Tiere</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn exact to="/search" class="mr-2" elevation="0" color="#32BCC3" fab small v-on="on">
                        <v-icon>{{svg.search}}</v-icon>
                    </v-btn>
                </template>
                <span>Suche</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn exact to="/discover" class="mr-2" elevation="0" color="#32BCC3" fab small v-on="on">
                        <v-icon>{{svg.discover}}</v-icon>
                    </v-btn>
                </template>
                <span>Entdecken</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn exact to="/chats" class="mr-2" elevation="0" color="#32BCC3" fab small v-on="on">
                        <v-icon>{{svg.chats}}</v-icon>
                    </v-btn>
                </template>
                <span>Nachrichten</span>
            </v-tooltip>

            <v-menu offset-y>
                <template v-slot:activator="{ on }">
                    <v-btn class="mr-2" elevation="0" color="#32BCC3" fab small v-on="on">
                        <v-icon>{{svg.more}}</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item to="/matches">
                        <v-list-item-icon><v-icon>{{svg.matches}}</v-icon></v-list-item-icon>
                        <v-list-item-title>Matches</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/likes">
                        <v-list-item-icon><v-icon>{{svg.heart}}</v-icon></v-list-item-icon>
                        <v-list-item-title>Likes</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/bookmarks">
                        <v-list-item-icon><v-icon>{{svg.bookmark}}</v-icon></v-list-item-icon>
                        <v-list-item-title>Gemerkt</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/visitors">
                        <v-list-item-icon><v-icon>{{svg.eye}}</v-icon></v-list-item-icon>
                        <v-list-item-title>Profilbesucher</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/blocked">
                        <v-list-item-icon><v-icon>{{svg.block}}</v-icon></v-list-item-icon>
                        <v-list-item-title>Blockierte Nutzer</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>

            <AppLogoutModal></AppLogoutModal>
        </template>

        <!--------------------------- LOGIN/SIGNUP BUTTONS ---------------------------->
        <div v-else class="center">
            <v-btn exact to="/login" elevation="0" color="#32BCC3" class="mr-2" dark>
                Login
            </v-btn>

            <v-btn exact to="/signup" elevation="0" color="#32BCC3" dark>
                Registrieren
            </v-btn>
        </div>
        <!--------------------------- END LOGIN/SIGNUP BUTTONS ---------------------------->

    </v-app-bar>
</template>

<script>
// COMPONENTS
import AppLogoutModal from '@/components/AppLogoutModal.vue'

// VUEX
import { mapGetters } from 'vuex'

// SVG ICONS
import { mdiCardsHeart, mdiForum, mdiMagnify, mdiDotsVertical, mdiHeart, mdiBookmark, mdiEyeOutline, mdiPaw, mdiMessageTextOutline, mdiCancel } from '@mdi/js'

export default {
  components: {
    AppLogoutModal
  },
  data: () => ({
    svg: {
      discover: mdiCardsHeart,
      matches: mdiForum,
      pets: mdiPaw,
      search: mdiMagnify,
      more: mdiDotsVertical,
      heart: mdiHeart,
      bookmark: mdiBookmark,
      eye: mdiEyeOutline,
      chats: mdiMessageTextOutline,
      block: mdiCancel
    }
  }),
  computed: {
    ...mapGetters(['isAuthenticated', 'authUser'])
  }
}
</script>
