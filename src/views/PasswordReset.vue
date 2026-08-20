<template><v-container class="page-container py-10" style="max-width:520px; min-height:100vh;"><v-card class="pa-5"><div class="headline mb-4">Passwort zurücksetzen</div>
  <template v-if="!token"><v-text-field v-model="email" label="E-Mail"></v-text-field><v-btn color="#32BCC3" dark @click="requestReset">Anweisung anfordern</v-btn></template>
  <template v-else><v-text-field v-model="password" type="password" label="Neues Passwort" counter="128"></v-text-field><v-btn color="#32BCC3" dark @click="reset">Passwort speichern</v-btn></template>
  <v-alert v-if="message" type="info" text class="mt-4">{{message}}<div v-if="devToken" class="mt-2"><router-link :to="{ name:'password-reset', query:{ token:devToken } }">Lokalen Entwicklungslink öffnen</router-link></div></v-alert>
</v-card></v-container></template>
<script>
import Api from '@/service/Api'
export default { data: () => ({ email: '', password: '', message: '', devToken: '' }),
  computed: { token () { return this.$route.query.token } },
  methods: {
    requestReset () { Api().post('auth/request-password-reset', { email: this.email }).then(({ data }) => { this.message = data.message; this.devToken = data.devToken || '' }) },
    reset () { Api().post('auth/reset-password', { token: this.token, password: this.password }).then(() => { this.message = 'Passwort geändert. Du kannst dich jetzt anmelden.' }) }
  } }
</script>
