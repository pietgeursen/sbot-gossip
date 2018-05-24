var {Map, Record, fromJS, Set} = require('immutable')
var {MAX_NUM_CONNECTIONS_SET, PEERS_ADDED, PRIORITY_MED} = require('../actions/')

var DISCONNECTED = 'DISCONNECTED'
var CONNECTING = 'CONNECTING'
var CONNECTED = 'DISCONNECTED'

var PeerRecord = Record({
  priority: PRIORITY_MED,
  connectionStatus: DISCONNECTED,
  isPermanant: false,
  timeoutIDs: [],
  errors: []
})

const initialState = fromJS({
  maxConnectedPeers: 2,
  peers: {}
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
// Dealing with closing rpc connections has 2 cases.
// 1: when it times out. I think this can be a thunk which calls close eventually and dispatches DISCONNECTED
// 2: when we want to close all connections immediately.
//
// Wait, who are we calling out to when we connect? Whoever that is, it should expose a disconnect(address) function too. Then all this complexity goes away.
// This can be in the lib folder. You pass is server.connect. It exposes connect and disconnect. Internally it keeps an object like:
// {
//    msAddress: closeFn
// }

module.exports = function reducer (state = initialState, action) {
  switch (action.type) {
    case MAX_NUM_CONNECTIONS_SET:
      return state.set('maxConnectedPeers', action.payload)
    case PEERS_ADDED:
      var currentPeers = state.get('peers').keySeq().toSet()
      var addedPeers = Set(action.payload)
      var newPeers = addedPeers.subtract(currentPeers)

      return state.update('peers', function (peers) {
        return newPeers.reduce(function (peers, v, k) {
          return peers.set(k, PeerRecord())
        }, peers)
      })

    default:
      return state
  }
}

module.exports.initialState = initialState
