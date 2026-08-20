<template>
  <v-container class="page-container py-6" style="max-width:850px; min-height:100vh;">
    <div class="content-board mb-4">
      <div class="headline font-weight-bold text-secundario">Resonanz-Check</div>
      <p class="mb-0 mt-2">Beantworte ehrlich – Gemeinsamkeiten werden nur im direkten Vergleich sichtbar.</p>
    </div>
    <v-card v-for="(question, index) in questions" :key="question.id" class="mb-3" elevation="1">
      <v-card-title class="subtitle-1">{{index + 1}}. {{question.text}}</v-card-title>
      <v-card-text><v-radio-group v-model="answers[question.id]" row hide-details>
        <v-radio v-for="option in question.options" :key="option" :label="option" :value="option"></v-radio>
      </v-radio-group><div class="d-flex align-center mt-3"><span class="caption mr-3">Wichtigkeit</span><v-btn-toggle v-model="preference(question.id).importance" mandatory dense><v-btn :value="1" small>Normal</v-btn><v-btn :value="2" small>Wichtig</v-btn><v-btn :value="3" small>Sehr wichtig</v-btn></v-btn-toggle><v-spacer></v-spacer><v-checkbox v-model="preference(question.id).isPrivate" label="Antwort privat" hide-details></v-checkbox></div></v-card-text>
    </v-card>
    <div class="text-right mb-5"><v-btn color="#32BCC3" dark :loading="saving" @click="save">Antworten speichern</v-btn></div>
    <v-card v-if="comparison" class="pa-4 mb-4" elevation="2">
      <div class="title">Eure Resonanz: {{comparison.score === null ? 'noch offen' : `${comparison.score} %`}}</div>
      <div class="caption mb-3">{{comparison.compared}} gemeinsam beantwortete Fragen</div>
      <div v-for="item in comparison.comparisons" :key="item.questionId" class="py-2">
        <strong>{{item.matches ? '✓' : '↔'}} {{item.question}}</strong><br>
        <span class="caption" v-if="!item.isPrivate">Du: {{item.mine}} · Gegenüber: {{item.theirs}}</span><span v-else class="caption">Antworten privat · fließen gewichtet in den Wert ein</span>
      </div>
    </v-card>
    <v-snackbar v-model="snackbar">{{message}}</v-snackbar>
  </v-container>
</template>
<script>
import Api from '@/service/Api'
export default {
  data: () => ({ questions: [], answers: {}, preferences: {}, comparison: null, saving: false, snackbar: false, message: '' }),
  created () {
    Promise.all([Api().get('resonance/questions'), Api().get('resonance/me')]).then(([questions, mine]) => {
      this.questions = questions.data.questions; this.answers = mine.data.answers; this.preferences = mine.data.preferences || {}
      if (this.$route.query.with) return this.compare(this.$route.query.with)
    })
  },
  methods: {
    save () {
      this.saving = true
      Api().put('resonance/me', { answers: this.answers, preferences: this.preferences }).then(() => {
        this.message = 'Dein Resonanzprofil wurde gespeichert.'; this.snackbar = true
        if (this.$route.query.with) this.compare(this.$route.query.with)
      }).finally(() => { this.saving = false })
    },
    compare (userId) { return Api().get(`resonance/compare/${userId}`).then(({ data }) => { this.comparison = data }) },
    preference (questionId) { if (!this.preferences[questionId]) this.$set(this.preferences, questionId, { importance: 1, isPrivate: false }); return this.preferences[questionId] }
  }
}
</script>
