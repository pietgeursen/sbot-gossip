var {Set, Map} = require('immutable')

var {PEERS_MAX_NUM_CONNECTIONS_SET, PEERS_ADDED} = require('../actions/')
const initialState = Map({
  maxConnectedPeers: 2,
  peers: Set([])
})

// Shit we need to track for a peer:
// - isConnected / connecting / errored
// - priority
// - isPermanant
// - didConnectToUs
//
// State sketch:
//  {
//    scheduler: {
//      maxConnectedPeers: 3,
//      connectionLifeTime: 20,
//      isInitialSync: false,
//      isRunning: false,
//      timeoutID: 12,
//    },
//    peers: {
//      'multiserveraddress_123' : {
//        priority: PRIORITY_HIGH | PRIORITY_MED | PRIORITY_LOW | PRIORITY_BANNED,
//        connectionStatus: DISCONNECTED | CONNECTING | CONNECTED | CONNECTED_TO_US,
//        isPermenant: false,
//        timeoutIDs: [12, 1234],
//        errors: [],
//      }
//    }
//  }
//
//  A story:
//  5 peers are added
//  Max peers set to 3
//  One peer has priority set to HIGH, rest MEDIUM
//  Scheduler connection lifetime set to 20s
//  Scheduler started
//    - when the scheduler ticks,
//      -Peer with HIGH and two others are selected and connection initiated.
//  One peer errors. Errors are set on peer.
//    - when the scheduler ticks
//      - a new peer connection starts
//  Other 2 peers connect successfully. On connect they set timeouts to trigger a disconnect and they also immediately dispatch actions to store their timeoutIDs
//

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
