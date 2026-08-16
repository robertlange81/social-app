export default {
  // AUTH
  SET_AUTHORIZATION: (state, token) => {
    state.token = token
  },
  SET_AUTH_USER: (state, user) => {
    state.authUser = user
  },
  SET_USER_UNAUTHENTICATED: (state) => {
    state.authUser = null
    state.token = ''
  },

  // DISCOVER / SWIPE
  SET_DISCOVER_PROFILES: (state, profiles) => {
    state.discoverProfiles = profiles
  },
  REMOVE_DISCOVER_PROFILE: (state, userId) => {
    state.discoverProfiles = state.discoverProfiles.filter(p => p.id !== userId)
  },
  SET_NEWEST_PROFILES: (state, profiles) => {
    state.newestProfiles = profiles
  },
  SET_SEARCH_RESULTS: (state, { profiles, total }) => {
    state.searchResults = profiles
    state.searchTotal = total
  },
  SET_BOOKMARKS: (state, bookmarks) => {
    state.bookmarks = bookmarks
  },
  SET_PROFILE_BOOKMARKED: (state, { userId, value }) => {
    const updateIn = (arr) => {
      const p = arr.find(x => x.id === userId)
      if (p) p.isBookmarked = value
    }
    updateIn(state.searchResults)
    updateIn(state.discoverProfiles)
    updateIn(state.newestProfiles)
    updateIn(state.likesSent)
    updateIn(state.likesReceived)
    if (state.viewedProfile && state.viewedProfile.id === userId) {
      state.viewedProfile = Object.assign({}, state.viewedProfile, { isBookmarked: value })
    }
    if (!value) state.bookmarks = state.bookmarks.filter(b => b.id !== userId)
  },
  SET_VISITORS: (state, visitors) => {
    state.visitors = visitors
  },
  SET_LIKES_SENT: (state, likes) => {
    state.likesSent = likes
  },
  SET_LIKES_RECEIVED: (state, likes) => {
    state.likesReceived = likes
  },
  REMOVE_MATCH: (state, matchId) => {
    state.matches = state.matches.filter(m => m.id !== matchId)
  },
  SET_LAST_MATCH_RESULT: (state, result) => {
    state.lastMatchResult = result
  },

  // MATCHES / CHAT
  SET_MATCHES: (state, matches) => {
    state.matches = matches
  },
  SET_MATCH_MESSAGES: (state, messages) => {
    state.currentMatchMessages = messages
  },
  ADD_MATCH_MESSAGE: (state, message) => {
    state.currentMatchMessages.push(message)
  },

  // PROFILE VIEW
  SET_VIEWED_PROFILE: (state, profile) => {
    state.viewedProfile = profile
  },

  // LOADING / ERRORS
  SET_LOADING: (state, { name, value }) => { state.loading[name] = value },
  SET_ERROR: (state, error) => { state.error = error },
  SET_CLEAR_ERROR: (state) => { state.error = null }
}
