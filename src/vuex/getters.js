export default {
  isAuthenticated: state => !!state.token,
  authUser: state => state.authUser,
  errors: state => state.error,
  loadingUser: state => state.loading.user,
  loadingUI: state => state.loading.ui,
  loadingForm: state => state.loading.form,

  myPets: state => state.myPets,
  activePetId: state => state.activePetId,
  activePet: state => state.myPets.find(p => p.id === state.activePetId) || state.myPets[0] || null,

  discoverPets: state => state.discoverPets,
  newestPets: state => state.newestPets,
  lastMatchResult: state => state.lastMatchResult,

  searchResults: state => state.searchResults,
  searchTotal: state => state.searchTotal,

  bookmarks: state => state.bookmarks,
  visitors: state => state.visitors,
  likesSent: state => state.likesSent,
  likesReceived: state => state.likesReceived,

  matches: state => state.matches,
  conversations: state => state.conversations,
  currentConversation: state => state.currentConversation,
  currentConversationMessages: state => state.currentConversationMessages,
  blockedUsers: state => state.blockedUsers,
  viewedPet: state => state.viewedPet
}
