<template>
    <v-container class="gray page-container" style="min-height:100vh;">
        <v-card class="pa-6 mx-auto" max-width="600">
            <div class="headline font-weight-bold mb-5">Datenschutz & Konto</div>
            <v-btn color="primary" outlined class="mb-6" @click="downloadExport">Meine Daten exportieren</v-btn>
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
  data: () => ({ password: '', deleting: false, error: '' }),
  methods: {
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
