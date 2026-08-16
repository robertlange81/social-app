<template>
    <form @submit.prevent="loginHandlerSubmit" ref="form">
        <v-text-field
            v-model="loginUser.email"
            :rules="emailRules"
            label="E-Mail"
            required
            :loading="loadingForm"
            color="#32BCC3"
        ></v-text-field>
        <v-text-field
            v-model="loginUser.password"
            :append-icon="showPassword ? svg.visibility : svg.visibilityOff"
            :type="showPassword ? 'text' : 'password'"
            label="Passwort"
            :loading="loadingForm"
            @click:append="showPassword = !showPassword"
            color="#32BCC3"
        ></v-text-field>

        <!-------------------------  FORM ERRORS  ------------------->
        <div v-if="errors" class="subtitle1 text-center red--text">
            <p>{{errors}}</p>
        </div>
        <div class="subtitle1 text-center">
            <span>Noch kein Konto? <router-link class="cyan--text" to="/signup">Jetzt registrieren</router-link></span>
        </div>
        <!-------------------------  END FORM ERRORS ------------------->

        <div class="mt-5">
            <v-btn type="submit" :loading="loadingForm" color="#32BCC3" elevation="0" dark>
                Anmelden
            </v-btn>
        </div>
    </form>
</template>

<script>
// SVG ICONS
import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js'

// VUEX
import { mapGetters } from 'vuex'

export default {
  data: () => ({
    showPassword: false,
    loginUser: {
      email: '',
      password: ''
    },
    emailRules: [
      v => !!v || 'E-Mail ist erforderlich',
      v => /.+@.+\..+/.test(v) || 'E-Mail muss gültig sein'
    ],
    svg: {
      visibility: mdiEyeOutline,
      visibilityOff: mdiEyeOffOutline
    }
  }),
  methods: {
    loginHandlerSubmit () {
      this.$store.dispatch('SIGN_IN', {
        email: this.loginUser.email,
        password: this.loginUser.password
      })
        .then(() => {
          this.$router.push({ name: 'home' })
        })
        .catch(() => {})
    }
  },
  computed: {
    ...mapGetters(['errors', 'loadingForm'])
  },
  beforeDestroy () {
    this.$store.dispatch('CLEAR_ERROR')
  }
}
</script>
