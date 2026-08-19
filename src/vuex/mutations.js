export default {
  // AUTH
  SET_AUTH_USER: (state, user) => {
    state.authUser = user
  },
  SET_USER_UNAUTHENTICATED: (state) => {
    state.authUser = null
    state.myPets = []
    state.activePetId = null
  },

  // EIGENE TIERE
  SET_MY_PETS: (state, pets) => {
    state.myPets = pets
  },
  UPSERT_MY_PET: (state, pet) => {
    const index = state.myPets.findIndex(p => p.id === pet.id)
    if (index === -1) state.myPets.push(pet)
    else state.myPets.splice(index, 1, pet)
  },
  REMOVE_MY_PET: (state, petId) => {
    state.myPets = state.myPets.filter(p => p.id !== petId)
  },
  SET_ACTIVE_PET_ID: (state, petId) => {
    state.activePetId = petId
    if (petId) localStorage.setItem('activePetId', petId)
    else localStorage.removeItem('activePetId')
  },

  // DISCOVER / SWIPE
  SET_DISCOVER_PETS: (state, pets) => {
    state.discoverPets = pets
  },
  REMOVE_DISCOVER_PET: (state, petId) => {
    state.discoverPets = state.discoverPets.filter(p => p.id !== petId)
  },
  SET_NEWEST_PETS: (state, pets) => {
    state.newestPets = pets
  },
  SET_LAST_MATCH_RESULT: (state, result) => {
    state.lastMatchResult = result
  },

  // SUCHE
  SET_SEARCH_RESULTS: (state, { pets, total }) => {
    state.searchResults = pets
    state.searchTotal = total
  },

  // MERKEN
  SET_BOOKMARKS: (state, bookmarks) => {
    state.bookmarks = bookmarks
  },
  SET_PET_BOOKMARKED: (state, { petId, value }) => {
    const updateIn = (arr) => {
      const p = arr.find(x => x.id === petId)
      if (p) p.isBookmarked = value
    }
    updateIn(state.searchResults)
    updateIn(state.discoverPets)
    updateIn(state.newestPets)
    updateIn(state.likesSent)
    updateIn(state.likesReceived)
    if (state.viewedPet && state.viewedPet.id === petId) {
      state.viewedPet = Object.assign({}, state.viewedPet, { isBookmarked: value })
    }
    if (!value) state.bookmarks = state.bookmarks.filter(b => b.id !== petId)
  },

  // PROFILBESUCHER
  SET_VISITORS: (state, visitors) => {
    state.visitors = visitors
  },

  // LIKES
  SET_LIKES_SENT: (state, likes) => {
    state.likesSent = likes
  },
  SET_LIKES_RECEIVED: (state, likes) => {
    state.likesReceived = likes
  },

  // MATCHES
  SET_MATCHES: (state, matches) => {
    state.matches = matches
  },
  REMOVE_MATCH: (state, matchId) => {
    state.matches = state.matches.filter(m => m.id !== matchId)
  },

  // UNTERHALTUNGEN / CHAT (auch ohne Match möglich)
  SET_CONVERSATIONS: (state, conversations) => {
    state.conversations = conversations
  },
  SET_CURRENT_CONVERSATION: (state, conversation) => {
    state.currentConversation = conversation
  },
  REMOVE_CONVERSATION: (state, conversationId) => {
    state.conversations = state.conversations.filter(c => c.id !== conversationId)
  },
  SET_CONVERSATION_MESSAGES: (state, messages) => {
    state.currentConversationMessages = messages
  },
  ADD_CONVERSATION_MESSAGE: (state, message) => {
    state.currentConversationMessages.push(message)
  },

  // BLOCKIEREN
  SET_BLOCKED_USERS: (state, users) => {
    state.blockedUsers = users
  },
  REMOVE_BLOCKED_USER: (state, userId) => {
    state.blockedUsers = state.blockedUsers.filter(u => u.id !== userId)
  },

  // TIER-PROFIL ANSICHT
  SET_VIEWED_PET: (state, pet) => {
    state.viewedPet = pet
  },

  // LOADING / ERRORS
  SET_LOADING: (state, { name, value }) => { state.loading[name] = value },
  SET_ERROR: (state, error) => { state.error = error },
  SET_CLEAR_ERROR: (state) => { state.error = null }
}
