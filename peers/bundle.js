var {Map, Record, fromJS, Set} = require('immutable')
var {PRIORITY_MED}  = require('../')

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

const initialState = fromJS({})

module.exports = {
  name: 'peers',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case PEER_ADDED:
        var peer = action.payload
        return state.update(peer, function (peer) {
          return peer || PeerRecord()
        })
      default:
        return state
    }
  },
  doPeerConnect,
  doPeerDisconnect,
  doPeerDidDisconnect,
  doAddPeer,
  doSetPeerPriority,
  doSetPeerLongtermConnection,
  doInboundPeerConnected
}

const PEER_ADDED = 'PEER_ADDED'
const PEER_CONNECTED_TO_US = 'PEER_CONNECTION_CONNECTED_TO_US'
const PEER_PRIORITY_SET = 'PEER_PRIORITY_SET' // Does this have immediate affect? Easier if not.
const PEER_CONNECTION_LONGTERM_SET = 'PEER_CONNECTION_LONGTERM_SET'
// thunk here to dispatch this.
const PEER_CONNECTION_STARTED = 'PEER_CONNECTION_STARTED'
const PEER_CONNECTION_CONNECTED = 'PEER_CONNECTION_CONNECTED'
const PEER_CONNECTION_ERROR = 'PEER_CONNECTION_ERROR'
const PEER_CONNECTION_STARTED_CLOSING = 'PEER_CONNECTION_STARTED_CLOSING'
const PEER_CONNECTION_CLOSED = 'PEER_CONNECTION_CLOSED'
function doAddPeer (peer) {
  return {
    type: PEER_ADDED,
    payload: peer
  }
}

function doSetPeerPriority (peerAddress) {
  return {
    type: PEER_PRIORITY_SET,
    payload: peerAddress
  }
}

function doSetPeerLongtermConnection (peerAddress, isLongterm) {
  return {
    type: PEER_CONNECTION_LONGTERM_SET,
    payload: {
      address: peerAddress,
      isLongterm
    }
  }
}

// on connected we'll return a thunk that immediately dispatched connected with timeoutId as payload. Started closing will be dispatched eventually
function doPeerConnect (peer) {
  return function ({dispatch, connect}) {
    dispatch({ type: PEER_CONNECTION_STARTED, payload: peer })
    connect(function (err) {
      if (err) {
        dispatch({type: PEER_CONNECTION_ERROR, payload: err})
        dispatch(doPeerDidDisconnect(peer))
      } else { dispatch({type: PEER_CONNECTION_CONNECTED, payload: peer}) }
    })
  }
}

// we want to disconnect
function doPeerDisconnect (peer) {
  return function ({dispatch, disconnect}) {
    dispatch({type: PEER_CONNECTION_STARTED_CLOSING, payload: peer})
    disconnect(function (err) {
      if (err) return console.log(err) // we tried to disconnect from an already disconnected peer. Log and forget.
      dispatch({type: PEER_CONNECTION_CLOSED, payload: peer})
    })
  }
}

// disconnected remotely
function doPeerDidDisconnect (peer) {
  return {type: PEER_CONNECTION_CLOSED, payload: peer}
}

function doInboundPeerConnected (peer) {
  return {
    type: PEER_CONNECTED_TO_US,
    payload: peer
  }
}
