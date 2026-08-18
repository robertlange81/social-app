<template>
    <v-form @submit.prevent="handleSubmit" ref="form">
        <v-text-field
            v-model="formNewUser.handle"
            :rules="handleRules"
            label="Dein Name"
            required
            :loading="loadingForm"
            color="cyan"
        ></v-text-field>
        <v-text-field
            v-model="formNewUser.email"
            :rules="emailRules"
            label="E-Mail"
            required
            :loading="loadingForm"
            color="cyan"
        ></v-text-field>
        <v-text-field
            v-model="formNewUser.password"
            :append-icon="showPassword ? svg.visibility : svg.visibilityOff"
            :type="showPassword ? 'text' : 'password'"
            :rules="passwordRules"
            label="Passwort"
            hint="Mindestens 6 Zeichen"
            counter
            :loading="loadingForm"
            @click:append="showPassword = !showPassword"
            color="cyan"
        ></v-text-field>
        <v-text-field
            v-model="formNewUser.confirmPassword"
            :append-icon="showPassword ? svg.visibility : svg.visibilityOff"
            :type="showPassword ? 'text' : 'password'"
            :rules="confirmPasswordRules"
            label="Passwort bestätigen"
            :loading="loadingForm"
            @click:append="showPassword = !showPassword"
            color="cyan"
        ></v-text-field>
        <v-text-field
            v-model="formNewUser.city"
            label="Dein Wohnort"
            :loading="loadingForm"
            color="cyan"
        ></v-text-field>

        <!-------------------------  FORM ERRORS ------------------->
        <div v-if="errors" class="subtitle1 text-center red--text">
            <p>{{errors}}</p>
        </div>
        <div class="subtitle1 text-center">
            <span>Du hast schon ein Konto? <router-link class="cyan--text" to="/login">Hier anmelden</router-link></span>
        </div>
        <!-------------------------  END FORM ERRORS ------------------->

        <div class="mt-5">
            <v-btn type="submit" :loading="loadingForm" color="#32BCC3" elevation="0" dark>
                Registrieren
            </v-btn>
        </div>
        <div class="caption grey--text mt-3">
            Nach der Registrierung legst du im nächsten Schritt dein erstes Tier an.
        </div>
    </v-form>
</template>

<script>
// ICONS
import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js'

// VUEX
import { mapGetters } from 'vuex'

export default {
  data: () => ({
    showPassword: false,
    formNewUser: {
      email: '',
      password: '',
      confirmPassword: '',
      handle: '',
      city: ''
    },
    emailRules: [
      v => !!v || 'E-Mail ist erforderlich',
      v => /.+@.+\..+/.test(v) || 'E-Mail muss gültig sein'
    ],
    handleRules: [
      v => !!v || 'Name ist erforderlich'
    ],
    passwordRules: [
      v => !!v || 'Passwort ist erforderlich',
      v => (v && v.length >= 6) || 'Mindestens 6 Zeichen'
    ],
    svg: {
      visibility: mdiEyeOutline,
      visibilityOff: mdiEyeOffOutline
    }
  }),
  computed: {
    ...mapGetters(['errors', 'loadingForm']),
    confirmPasswordRules () {
      return [
        v => !!v || 'Bitte Passwort bestätigen',
        v => v === this.formNewUser.password || 'Passwörter stimmen nicht überein'
      ]
    }
  },
  methods: {
    handleSubmit () {
      if (!this.$refs.form.validate()) return
      const payload = Object.assign({}, this.formNewUser)
      delete payload.confirmPassword
      this.$store.dispatch('SIGN_UP', payload)
        .then(() => {
          this.$router.push({ name: 'my-pets' })
        })
        .catch(() => {})
    }
  },
  beforeDestroy () {
    this.$store.dispatch('CLEAR_ERROR')
  }
}
</script>
