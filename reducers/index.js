var {PEERS_MAX_NUM} = require('../actions/')
const initialState = {
  peers: {
    max: 0
  }
}
module.exports = function reducer (state = initialState, action) {
  switch (action.type) {
    case PEERS_MAX_NUM:
      state.peers.max = action.payload
      break
    default:
      return state
  }
  return state
}

module.exports.initialState = initialState
