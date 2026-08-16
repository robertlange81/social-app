<template>
    <v-form @submit.prevent="handleSubmit" ref="form">
        <v-card-text>
        <v-container>
            <v-row>
            <v-col cols="12" sm="6">
                <v-text-field label="Name / Nutzername" v-model="userDetails.handle" :rules="handleRules" required :loading="loadingForm" color="cyan"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field label="E-Mail" v-model="userDetails.email" :rules="emailRules" required :loading="loadingForm" color="cyan"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field label="Geburtsdatum" type="date" v-model="userDetails.birthdate" :rules="birthdateRules" required :loading="loadingForm" color="cyan"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field label="Wohnort" v-model="userDetails.city" :loading="loadingForm" color="cyan"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
                <v-select v-model="userDetails.gender" :items="genders" item-text="text" item-value="value" label="Ich bin" :loading="loadingForm" color="cyan"></v-select>
            </v-col>
            <v-col cols="12" sm="6">
                <v-select v-model="userDetails.seekingGender" :items="seekingGenders" item-text="text" item-value="value" label="Ich suche" :loading="loadingForm" color="cyan"></v-select>
            </v-col>
            <v-col cols="12">
                <v-select
                    v-model="userDetails.party"
                    :items="parties"
                    :rules="[v => !!v || 'Bitte wähle eine Partei aus.']"
                    label="Welche Partei würdest du wählen?"
                    required
                    :loading="loadingForm"
                    color="cyan"
                ></v-select>
            </v-col>
            <v-col cols="12">
                <v-textarea label="Kurze Beschreibung über dich" v-model="userDetails.bio" :loading="loadingForm" color="cyan" no-resize></v-textarea>
            </v-col>

            <v-col cols="12">
                <v-divider class="mb-3"></v-divider>
                <div class="subtitle-2 mb-2">Passwort ändern (optional)</div>
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field label="Neues Passwort" type="password" v-model="userDetails.password" :rules="passwordRules" hint="Leer lassen, um das Passwort nicht zu ändern" persistent-hint :loading="loadingForm" color="cyan"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field label="Neues Passwort bestätigen" type="password" v-model="confirmPassword" :rules="confirmPasswordRules" :loading="loadingForm" color="cyan"></v-text-field>
            </v-col>

            <v-col cols="12" v-if="errors">
                <v-alert dense type="error" class="mb-0">{{errors}}</v-alert>
            </v-col>
            </v-row>
        </v-container>
        </v-card-text>
        <v-card-actions>
        <div class="flex-grow-1"></div>
            <v-btn color="cyan darken-1" :disabled="loadingForm" text @click.stop="$emit('click')">Schließen</v-btn>
            <v-btn color="cyan darken-1" :loading="loadingForm" text type="submit">Speichern</v-btn>
        </v-card-actions>
    </v-form>
</template>

<script>
import { mapGetters } from 'vuex'
import { PARTIES, GENDERS, SEEKING_GENDERS } from '@/constants/parties'

export default {
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    userDetails: {
      handle: '',
      email: '',
      birthdate: '',
      bio: '',
      city: '',
      gender: null,
      seekingGender: null,
      party: null,
      password: ''
    },
    confirmPassword: '',
    parties: PARTIES,
    genders: GENDERS,
    seekingGenders: SEEKING_GENDERS,
    handleRules: [v => (!!v && v.trim().length >= 2) || 'Name ist erforderlich (mind. 2 Zeichen).'],
    emailRules: [
      v => !!v || 'E-Mail ist erforderlich',
      v => /.+@.+\..+/.test(v) || 'E-Mail muss gültig sein'
    ],
    birthdateRules: [v => !!v || 'Geburtsdatum ist erforderlich']
  }),
  methods: {
    handleSubmit () {
      if (!this.$refs.form.validate()) return
      const payload = Object.assign({}, this.userDetails)
      if (!payload.password) delete payload.password
      const handleChanged = payload.handle !== this.data.handle
      this.$store.dispatch('EDIT_USER_DETAILS', payload)
        .then(() => {
          this.userDetails.password = ''
          this.confirmPassword = ''
          this.$emit('click')
          if (handleChanged) {
            this.$router.replace(`/profile/${payload.handle}`)
          }
        })
        .catch(() => {})
    }
  },
  mounted () {
    this.userDetails.handle = this.data.handle || ''
    this.userDetails.email = this.data.email || ''
    this.userDetails.birthdate = this.data.birthdate || ''
    this.userDetails.bio = this.data.bio || ''
    this.userDetails.city = this.data.city || ''
    this.userDetails.gender = this.data.gender || null
    this.userDetails.seekingGender = this.data.seekingGender || null
    this.userDetails.party = this.data.party || null
  },
  computed: {
    ...mapGetters(['loadingForm', 'errors']),
    passwordRules () {
      return [v => !v || v.length >= 6 || 'Mindestens 6 Zeichen']
    },
    confirmPasswordRules () {
      return [v => !this.userDetails.password || v === this.userDetails.password || 'Passwörter stimmen nicht überein']
    }
  }
}
</script>
