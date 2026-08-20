<template><v-container fluid class="page-container py-4" style="min-height:100vh;"><div class="content-board mb-4"><div class="d-flex align-center flex-wrap"><div><div class="headline font-weight-bold text-secundario">Menschen in deiner Nähe</div><div class="caption">Standorte sind absichtlich auf ungefähr 1 km vergröbert.</div></div><v-spacer></v-spacer><v-btn color="#32BCC3" dark :loading="locating" @click="useLocation"><v-icon left>{{icons.location}}</v-icon>Meinen ungefähren Standort verwenden</v-btn></div><v-switch v-if="myLocation" v-model="shareOnMap" label="Mich freiwillig auf der Karte anzeigen" @change="saveSharing"></v-switch></div>
  <v-alert v-if="error" type="error" dismissible>{{error}}</v-alert><v-row><v-col cols="12" md="8"><div class="map-wrap"><AppProfileMap :profiles="visibleProfiles" :my-location="myLocation" @select="previewProfile"></AppProfileMap><v-card v-if="selectedProfile" class="map-preview pa-3"><v-btn icon small class="float-right" aria-label="Vorschau schließen" @click="selectedProfile=null">×</v-btn><div class="title">@{{selectedProfile.handle}}</div><div>{{selectedProfile.city}} · {{selectedProfile.age}} Jahre<span v-if="selectedProfile.distanceKm !== null"> · {{selectedProfile.distanceKm}} km</span></div><p class="caption mt-2 mb-2">{{selectedProfile.bio || 'Noch kein Profiltext.'}}</p><v-btn small color="#32BCC3" dark @click="selectProfile(selectedProfile)">Profil ansehen</v-btn></v-card></div></v-col><v-col cols="12" md="4"><v-select v-model="radius" :items="radii" label="Umkreis" suffix="km"></v-select><div class="caption mb-3">{{visibleProfiles.length}} freigegebene Profile</div><v-skeleton-loader v-if="loading" type="list-item-two-line@4"></v-skeleton-loader><v-card v-for="profile in visibleProfiles.slice(0,20)" :key="profile.id" class="mb-2" @click="previewProfile(profile)"><v-card-title class="subtitle-1">@{{profile.handle}}<v-spacer></v-spacer><span v-if="profile.distanceKm !== null" class="caption">{{profile.distanceKm}} km</span></v-card-title><v-card-subtitle>{{profile.city}} · {{profile.age}} Jahre</v-card-subtitle></v-card></v-col></v-row>
</v-container></template>
<script>
import Api from '@/service/Api'
import AppProfileMap from '@/components/Map/AppProfileMap.vue'
import { mdiCrosshairsGps } from '@mdi/js'
export default { components: { AppProfileMap },
  data: () => ({ profiles: [], myLocation: null, selectedProfile: null, shareOnMap: true, radius: 100, radii: [10, 25, 50, 100, 250, 500], loading: true, locating: false, error: '', icons: { location: mdiCrosshairsGps } }),
  computed: {
    visibleProfiles () { return this.profiles.filter(profile => profile.distanceKm === null || profile.distanceKm <= this.radius).sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999)) }
  },
  created () { this.load() },
  methods: {
    load () { this.loading = true; Promise.all([Api().get('search/map'), Api().get('me/location')]).then(([map, mine]) => { this.profiles = map.data.profiles; this.myLocation = mine.data.location; this.shareOnMap = !this.myLocation || this.myLocation.shareOnMap }).catch(() => { this.error = 'Kartendaten konnten nicht geladen werden.' }).finally(() => { this.loading = false }) },
    useLocation () { this.error = ''; this.locating = true; navigator.geolocation.getCurrentPosition(position => { Api().put('me/location', { latitude: position.coords.latitude, longitude: position.coords.longitude, shareOnMap: this.shareOnMap }).then(() => this.load()).finally(() => { this.locating = false }) }, () => { this.error = 'Standortfreigabe wurde abgelehnt oder ist nicht verfügbar.'; this.locating = false }, { enableHighAccuracy: false, timeout: 10000 }) },
    saveSharing () { if (!this.myLocation) return; Api().put('me/location', { latitude: this.myLocation.latitude, longitude: this.myLocation.longitude, shareOnMap: this.shareOnMap }).then(this.load) },
    previewProfile (profile) { this.selectedProfile = profile },
    selectProfile (profile) { this.$router.push(`/profile/${profile.handle}`) }
  } }
</script>
<style scoped>.map-wrap{position:relative}.map-preview{position:absolute;left:16px;bottom:16px;width:min(360px,calc(100% - 32px));z-index:2}</style>
