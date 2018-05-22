var {Set, Map} = require('immutable')

var {PEERS_MAX_NUM_CONNECTIONS_SET, PEERS_ADDED} = require('../actions/')
const initialState = Map({
  maxConnectedPeers: 2,
  peers: Set([])
})

module.exports = function reducer (state = initialState, action) {
  switch (action.type) {
    case PEERS_MAX_NUM_CONNECTIONS_SET:
      return state.set('maxConnectedPeers', action.payload)
    case PEERS_ADDED:
      return state.updateIn(['peers'], peers => peers.union(action.payload))
    default:
      return state
  }
}

module.exports.initialState = initialState
