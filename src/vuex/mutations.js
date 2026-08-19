export default {
  // AUTH
  SET_AUTH_USER: (state, user) => {
    state.authUser = user
  },
  SET_USER_UNAUTHENTICATED: (state) => {
    state.authUser = null
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

  // MATCHES
  SET_MATCHES: (state, matches) => {
    state.matches = matches
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

  // PROFILE VIEW
  SET_VIEWED_PROFILE: (state, profile) => {
    state.viewedProfile = profile
  },

  // LOADING / ERRORS
  SET_LOADING: (state, { name, value }) => { state.loading[name] = value },
  SET_ERROR: (state, error) => { state.error = error },
  SET_CLEAR_ERROR: (state) => { state.error = null }
}
