<template>
    <v-container class="gray page-container" style="min-height: 100vh;">
        <div class="content-board mb-4 d-flex justify-space-between align-center flex-wrap">
            <div class="headline font-weight-bold text-secundario">Meine Tiere</div>
            <v-btn color="#32BCC3" dark elevation="0" @click="openCreateDialog">+ Tier hinzufügen</v-btn>
        </div>

        <div v-if="!myPets.length" class="content-board text-center pa-8">
            Du hast noch kein Tier angelegt. Leg jetzt dein erstes Tier an, um zu swipen.
        </div>

        <div class="card-grid" v-else>
            <v-card v-for="pet in myPets" :key="pet.id" class="pa-3">
                <div class="center mb-2" style="position:relative;">
                    <v-avatar size="140">
                        <v-img v-if="photoSrc(pet)" :src="photoSrc(pet)"></v-img>
                        <span v-else style="font-size:70px;">{{speciesIcon(pet.species)}}</span>
                    </v-avatar>
                    <input type="file" :ref="`fileInput-${pet.id}`" hidden accept="image/*" @change="e => handlePhotoChange(e, pet)">
                    <v-btn fab x-small color="#32BCC3" dark style="position:absolute; bottom:0; right:calc(50% - 70px);" :loading="uploadingPetId === pet.id" @click="triggerFileInput(pet)">
                        <v-icon small>{{svg.camera}}</v-icon>
                    </v-btn>
                </div>
                <div class="text-center title font-weight-bold">{{pet.name}}</div>
                <div class="text-center caption grey--text mb-2">
                    {{speciesIcon(pet.species)}} {{pet.breed || speciesLabelFor(pet.species)}} · {{pet.age}} Jahre · {{genderLabel(pet.gender)}}
                </div>
                <div class="text-center mb-3">
                    <v-chip x-small :color="purposeColor(pet.purpose)" text-color="white">{{purposeText(pet.purpose)}}</v-chip>
                </div>
                <div class="center">
                    <router-link :to="`/pet/${pet.id}`" class="mr-2"><v-btn small text>Ansehen</v-btn></router-link>
                    <v-btn small text @click="openEditDialog(pet)">Bearbeiten</v-btn>
                    <v-btn small text color="error" @click="confirmDelete(pet)">Löschen</v-btn>
                </div>
            </v-card>
        </div>

        <!------------------ TIER-FORMULAR DIALOG ------------------>
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                <v-card-title class="primario white--text">{{editingPet ? 'Tier bearbeiten' : 'Tier hinzufügen'}}</v-card-title>
                <v-form ref="form" @submit.prevent="submitForm">
                    <v-card-text>
                        <v-text-field v-model="form.name" label="Name" :rules="[v => !!v || 'Name ist erforderlich.']" required color="cyan"></v-text-field>
                        <v-select v-model="form.species" :items="speciesOptions" item-text="text" item-value="value" label="Tierart" :rules="[v => !!v || 'Bitte Tierart wählen.']" required color="cyan"></v-select>
                        <v-select v-model="form.breed" :items="breedOptions" label="Rasse" color="cyan" clearable></v-select>
                        <v-select v-model="form.gender" :items="genderOptions" item-text="text" item-value="value" label="Geschlecht" :rules="[v => !!v || 'Bitte Geschlecht wählen.']" required color="cyan"></v-select>
                        <v-text-field v-model="form.birthdate" type="date" label="Geburtsdatum" :rules="[v => !!v || 'Geburtsdatum ist erforderlich.']" required color="cyan"></v-text-field>
                        <v-select v-model="form.purpose" :items="purposeOptions" item-text="text" item-value="value" label="Sucht" :rules="[v => !!v || 'Bitte Zweck wählen.']" required color="cyan"></v-select>
                        <v-text-field v-model="form.city" label="Standort (optional, sonst dein Wohnort)" color="cyan"></v-text-field>
                        <v-textarea v-model="form.bio" label="Kurzbeschreibung" no-resize rows="3" color="cyan"></v-textarea>
                        <v-alert v-if="errors" dense type="error" class="mb-0">{{errors}}</v-alert>
                    </v-card-text>
                    <v-card-actions>
                        <div class="flex-grow-1"></div>
                        <v-btn text @click="dialog = false" :disabled="loadingForm">Abbrechen</v-btn>
                        <v-btn text color="cyan darken-1" type="submit" :loading="loadingForm">Speichern</v-btn>
                    </v-card-actions>
                </v-form>
            </v-card>
        </v-dialog>
        <!------------------ END TIER-FORMULAR DIALOG ------------------>

        <v-dialog v-model="deleteDialog" max-width="360">
            <v-card class="pa-4" v-if="petToDelete">
                <div class="title mb-3">{{petToDelete.name}} wirklich löschen?</div>
                <div class="mb-4">Alle Matches und Likes zu diesem Tier werden gelöscht. Unterhaltungen mit Haltern bleiben erhalten.</div>
                <div class="text-right">
                    <v-btn text @click="deleteDialog = false">Abbrechen</v-btn>
                    <v-btn color="error" text @click="doDelete">Löschen</v-btn>
                </div>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import { SPECIES, SPECIES_ICON, GENDERS, PURPOSES, PURPOSE_COLORS, purposeLabel, speciesLabel, BREEDS } from '@/constants/pets'
import { mdiCameraRetakeOutline } from '@mdi/js'
import { mapGetters } from 'vuex'

const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:4000/api/').replace(/\/api\/?$/, '')

const EMPTY_FORM = () => ({ name: '', species: 'dog', breed: null, gender: null, birthdate: '', purpose: null, city: '', bio: '' })

export default {
  data: () => ({
    dialog: false,
    deleteDialog: false,
    editingPet: null,
    petToDelete: null,
    uploadingPetId: null,
    form: EMPTY_FORM(),
    speciesOptions: SPECIES,
    genderOptions: GENDERS,
    purposeOptions: PURPOSES,
    svg: { camera: mdiCameraRetakeOutline }
  }),
  computed: {
    ...mapGetters(['myPets', 'errors', 'loadingForm']),
    breedOptions () {
      return BREEDS[this.form.species] || []
    }
  },
  created () {
    this.$store.dispatch('FETCH_MY_PETS')
  },
  methods: {
    speciesIcon (species) {
      return SPECIES_ICON[species] || '🐾'
    },
    speciesLabelFor: speciesLabel,
    purposeColor (purpose) {
      return PURPOSE_COLORS[purpose] || '#607D8B'
    },
    purposeText: purposeLabel,
    genderLabel (value) {
      const found = GENDERS.find(g => g.value === value)
      return found ? found.text : value
    },
    photoSrc (pet) {
      if (!pet.photoUrl) return ''
      return pet.photoUrl.startsWith('http') ? pet.photoUrl : `${API_ORIGIN}${pet.photoUrl}`
    },
    openCreateDialog () {
      this.editingPet = null
      this.form = EMPTY_FORM()
      this.$store.dispatch('CLEAR_ERROR')
      this.dialog = true
    },
    openEditDialog (pet) {
      this.editingPet = pet
      this.form = { name: pet.name, species: pet.species, breed: pet.breed, gender: pet.gender, birthdate: pet.birthdate, purpose: pet.purpose, city: pet.city || '', bio: pet.bio || '' }
      this.$store.dispatch('CLEAR_ERROR')
      this.dialog = true
    },
    submitForm () {
      if (!this.$refs.form.validate()) return
      const action = this.editingPet
        ? this.$store.dispatch('UPDATE_PET', { petId: this.editingPet.id, petData: this.form })
        : this.$store.dispatch('CREATE_PET', this.form)
      action.then(() => { this.dialog = false }).catch(() => {})
    },
    confirmDelete (pet) {
      this.petToDelete = pet
      this.deleteDialog = true
    },
    doDelete () {
      this.$store.dispatch('DELETE_PET', this.petToDelete.id).then(() => {
        this.deleteDialog = false
        this.petToDelete = null
      })
    },
    triggerFileInput (pet) {
      const refs = this.$refs[`fileInput-${pet.id}`]
      const input = Array.isArray(refs) ? refs[0] : refs
      if (input) input.click()
    },
    handlePhotoChange (event, pet) {
      const file = event.target.files[0]
      event.target.value = ''
      if (!file) return
      this.uploadingPetId = pet.id
      const formData = new FormData()
      formData.append('image', file, file.name)
      this.$store.dispatch('UPLOAD_PET_PHOTO', { petId: pet.id, formData })
        .then(() => { this.uploadingPetId = null })
        .catch(() => { this.uploadingPetId = null })
    }
  }
}
</script>
