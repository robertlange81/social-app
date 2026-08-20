<template><v-container class="page-container py-6" style="max-width:1000px; min-height:100vh;"><div class="content-board mb-4"><div class="headline font-weight-bold">Moderation</div><div>Meldungen prüfen und revisionssicher bearbeiten.</div></div>
  <v-alert v-if="error" type="error">{{error}}</v-alert><v-card v-for="report in reports" :key="report.id" class="mb-3"><v-card-title>@{{report.reported_handle}} gemeldet</v-card-title><v-card-subtitle>von @{{report.reporter_handle}} · {{report.reason}}</v-card-subtitle><v-card-text>{{report.details || 'Keine Details'}}</v-card-text><v-card-actions><v-select :value="report.status" :items="statuses" dense hide-details style="max-width:220px" @change="status => update(report,status)"></v-select><v-spacer></v-spacer><v-btn small text @click="verify(report)">Profil verifizieren</v-btn><v-btn small text color="error" @click="suspend(report)">24 h sperren</v-btn></v-card-actions></v-card>
</v-container></template>
<script>
import Api from '@/service/Api'
export default { data: () => ({ reports: [], error: '', statuses: ['open', 'reviewing', 'resolved', 'dismissed'] }),
  created () { this.load() },
  methods: {
    load () { Api().get('moderation/reports').then(({ data }) => { this.reports = data.reports }).catch(() => { this.error = 'Kein Administrator-Zugriff. ADMIN_EMAILS muss serverseitig konfiguriert sein.' }) },
    update (report, status) { Api().patch(`moderation/reports/${report.id}`, { status }).then(() => { report.status = status }) },
    verify (report) { Api().patch(`moderation/users/${report.reported_id}/security`, { verificationLevel: 'profile', suspendHours: 0 }) },
    suspend (report) { Api().patch(`moderation/users/${report.reported_id}/security`, { suspendHours: 24, reason: `Meldung ${report.id}` }) }
  } }
</script>
