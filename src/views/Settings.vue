<template>
    <v-container class="gray page-container" style="min-height:100vh;">
        <v-card class="pa-6 mx-auto" max-width="700">
            <div class="headline font-weight-bold mb-5">Datenschutz & Konto</div>
            <v-alert v-if="success" type="success" dense dismissible @input="success=''">{{success}}</v-alert>
            <v-btn color="primary" outlined class="mb-6" @click="downloadExport">Meine Daten exportieren</v-btn>
            <v-divider class="mb-6"></v-divider>
            <div class="title mb-2">Darstellung & Benachrichtigungen</div>
            <v-switch v-model="preferences.darkMode" label="Dunkles Design" @change="savePreferences"></v-switch>
            <v-switch v-model="preferences.notifyMatches" label="Neue Matches" @change="savePreferences"></v-switch>
            <v-switch v-model="preferences.notifyMessages" label="Neue Nachrichten" @change="savePreferences"></v-switch>
            <v-switch v-model="preferences.notifySocial" label="Likes, Gruppen und soziale Aktivitäten" @change="savePreferences"></v-switch>
            <v-divider class="my-6"></v-divider>
            <div class="title mb-2">Einwilligungen</div>
            <p class="caption">Ein Widerruf gilt für die Zukunft. Er berührt nicht die Rechtmäßigkeit der bisherigen Verarbeitung.</p>
            <v-switch v-model="politicalConsent" color="#32BCC3" label="Politische Angabe und Resonanz für Profil und Matching verwenden" @change="changeConsent('political_profile', politicalConsent)"></v-switch>
            <v-switch v-model="mapConsent" color="#32BCC3" label="Meine grobe Position auf der Karte anzeigen" @change="changeConsent('map_visibility', mapConsent)"></v-switch>
            <p><router-link to="/datenschutz">Datenschutzerklärung</router-link> · <router-link to="/nutzungsbedingungen">Nutzungsbedingungen</router-link></p>
            <v-divider class="my-6"></v-divider>
            <div class="title mb-2">Ungefährer Standort</div>
            <p>Die Karte speichert höchstens eine auf ungefähr 1 km vergröberte Position. Du kannst sie jederzeit vollständig entfernen.</p>
            <v-btn v-if="hasLocation" outlined color="#168890" class="mb-6" @click="deleteLocation">Gespeicherten Standort löschen</v-btn>
            <v-btn v-else to="/map" outlined color="#168890" class="mb-6">Standort & Karte öffnen</v-btn>
            <v-divider class="mb-6"></v-divider>
            <div class="title error--text mb-2">Konto endgültig löschen</div>
            <p>Profil, Likes, Matches und Unterhaltungen werden unwiderruflich entfernt.</p>
            <v-text-field v-model="password" type="password" label="Passwort zur Bestätigung"></v-text-field>
            <v-btn color="error" :disabled="!password" :loading="deleting" @click="deleteAccount">Konto löschen</v-btn>
            <v-alert v-if="error" type="error" dense class="mt-4">{{error}}</v-alert>
        </v-card>
    </v-container>
</template>

<script>
import Api from '@/service/Api'

export default {
  data: () => ({ password: '', deleting: false, error: '', success: '', hasLocation: false, politicalConsent: true, mapConsent: false, preferences: { darkMode: false, notifyMatches: true, notifyMessages: true, notifySocial: true } }),
  created () { Promise.all([Api().get('me/location'), Api().get('me/privacy-settings')]).then(([location, privacy]) => { this.hasLocation = !!location.data.location; this.mapConsent = !!(location.data.location && location.data.location.shareOnMap); this.preferences = { ...this.preferences, ...privacy.data.preferences }; const political = privacy.data.consents.find(item => item.consent_type === 'political_profile'); this.politicalConsent = !political || !!political.granted_at; this.$vuetify.theme.dark = this.preferences.darkMode }) },
  methods: {
    savePreferences () { this.$vuetify.theme.dark = this.preferences.darkMode; localStorage.setItem('herzklang-dark-mode', String(this.preferences.darkMode)); Api().put('me/preferences', this.preferences).catch(() => { this.error = 'Einstellungen konnten nicht gespeichert werden.' }) },
    changeConsent (type, granted) { if (!granted && type === 'political_profile' && !window.confirm('Politische Angabe und Resonanz-Antworten wirklich entfernen?')) { this.politicalConsent = true; return } Api().put(`me/consents/${type}`, { granted, policyVersion: '2026-08-20' }).then(({ data }) => { if (data.user) this.$store.commit('SET_AUTH_USER', data.user); this.success = granted ? 'Einwilligung gespeichert.' : 'Einwilligung widerrufen.' }).catch(() => { this.error = 'Einwilligung konnte nicht geändert werden.' }) },
    downloadExport () {
      Api().get('me/export', { responseType: 'blob' }).then(response => {
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = 'herzklang-export.json'
        link.click()
        URL.revokeObjectURL(url)
      }).catch(() => { this.error = 'Export konnte nicht erstellt werden.' })
    },
    deleteLocation () { Api().delete('me/location').then(() => { this.hasLocation = false }) },
    deleteAccount () {
      this.deleting = true
      this.error = ''
      Api().delete('me', { data: { password: this.password } }).then(() => {
        this.$store.commit('SET_USER_UNAUTHENTICATED')
        this.$router.push('/')
      }).catch(error => {
        this.error = error.response && error.response.data ? error.response.data.error : 'Konto konnte nicht gelöscht werden.'
      }).finally(() => { this.deleting = false })
    }
  }
}
</script>
