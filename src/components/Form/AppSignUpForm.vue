<template>
    <v-form @submit.prevent="handleSubmit" ref="form">
        <v-text-field
            v-model="formNewUser.handle"
            :rules="handleRules"
            label="Name / Nutzername"
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
            v-model="formNewUser.birthdate"
            :rules="birthdateRules"
            type="date"
            label="Geburtsdatum"
            required
            :loading="loadingForm"
            color="cyan"
        ></v-text-field>
        <v-select
            v-model="formNewUser.gender"
            :items="genders"
            item-text="text"
            item-value="value"
            :rules="requiredRules"
            label="Ich bin"
            required
            :loading="loadingForm"
            color="cyan"
        ></v-select>
        <v-select
            v-model="formNewUser.seekingGender"
            :items="seekingGenders"
            item-text="text"
            item-value="value"
            :rules="requiredRules"
            label="Ich suche"
            required
            :loading="loadingForm"
            color="cyan"
        ></v-select>
        <v-text-field
            v-model="formNewUser.city"
            label="Wohnort"
            :loading="loadingForm"
            color="cyan"
        ></v-text-field>
        <v-textarea
            v-model="formNewUser.bio"
            label="Kurze Beschreibung über dich (optional)"
            no-resize
            rows="3"
            :loading="loadingForm"
            color="cyan"
        ></v-textarea>

        <!-------------------------  PARTEI PFLICHTFELD ------------------->
        <v-select
            v-model="formNewUser.party"
            :items="parties"
            :rules="requiredRules"
            label="Welche Partei würdest du wählen? (Pflichtangabe)"
            hint="Wird ganz oben auf deinem Profil angezeigt"
            persistent-hint
            required
            :loading="loadingForm"
            color="cyan"
            class="mb-4"
        ></v-select>
        <!-------------------------  END PARTEI PFLICHTFELD ------------------->

        <v-checkbox
            v-model="formNewUser.consentPolitical"
            :rules="requiredRules"
            color="cyan"
            class="mt-0"
        >
            <template v-slot:label>
                <span class="body-2">
                    Ich stimme zu, dass meine Partei-Angabe (eine besondere Kategorie personenbezogener Daten gemäß Art. 9 DSGVO) gespeichert und anderen Nutzern auf meinem Profil angezeigt wird.
                </span>
            </template>
        </v-checkbox>
        <v-checkbox
            v-model="formNewUser.consentTos"
            :rules="requiredRules"
            color="cyan"
            class="mt-0"
        >
            <template v-slot:label>
                <span class="body-2">
                    Ich akzeptiere die Nutzungsbedingungen und bestätige, dass ich mindestens 18 Jahre alt bin.
                </span>
            </template>
        </v-checkbox>

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
    </v-form>
</template>

<script>
// ICONS
import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js'

// VUEX
import { mapGetters } from 'vuex'

// CONSTANTS
import { PARTIES, GENDERS, SEEKING_GENDERS } from '@/constants/parties'

export default {
  data: () => ({
    showPassword: false,
    formNewUser: {
      email: '',
      password: '',
      confirmPassword: '',
      handle: '',
      birthdate: '2000-01-01',
      gender: null,
      seekingGender: null,
      city: '',
      bio: '',
      party: null,
      consentPolitical: false,
      consentTos: false
    },
    parties: PARTIES,
    genders: GENDERS,
    seekingGenders: SEEKING_GENDERS,
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
    birthdateRules: [
      v => !!v || 'Geburtsdatum ist erforderlich'
    ],
    requiredRules: [
      v => !!v || 'Diese Angabe ist erforderlich'
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
          this.$router.push({ name: 'home' })
        })
        .catch(() => {})
    }
  },
  beforeDestroy () {
    this.$store.dispatch('CLEAR_ERROR')
  }
}
</script>
