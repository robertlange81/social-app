<template><v-container class="page-container py-10" style="max-width:520px; min-height:100vh;"><v-card class="pa-5 text-center"><div class="headline mb-4">E-Mail bestätigen</div><v-progress-circular v-if="loading" indeterminate color="#32BCC3"></v-progress-circular><v-alert v-else :type="success ? 'success' : 'error'" text>{{message}}</v-alert></v-card></v-container></template>
<script>
import Api from '@/service/Api'
export default { data: () => ({ loading: true, success: false, message: '' }), created () { Api().post('auth/verify-email', { token: this.$route.query.token }).then(() => { this.success = true; this.message = 'E-Mail erfolgreich bestätigt.' }).catch(() => { this.message = 'Bestätigungslink ungültig oder abgelaufen.' }).finally(() => { this.loading = false }) } }
</script>
