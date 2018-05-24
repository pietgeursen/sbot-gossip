// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Scheduler
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const MAX_NUM_CONNECTIONS_SET = 'MAX_NUM_CONNECTIONS_SET'
function doSetMaxNumConnections (max) {
  return {
    type: MAX_NUM_CONNECTIONS_SET,
    payload: max
  }
}

// I think we want a thunk that dipatches DID_START straight away, intervalId as payload. Then ticks actions are dispatched from the interval
const SCHEDULER_DID_START = 'SCHEDULER_DID_START'

function doStartScheduler () {
  return function ({dispatch}) {
    var intervalID = setInterval(function () {
      dispatch(doSchedulerTick())
    }, 1000)
    dispatch({type: SCHEDULER_DID_START, payload: intervalID})
  }
}

// Kills all existing timers. Kills all existing connections.
// Sets all peers states to disconnected.
const SCHEDULER_DID_STOP = 'SCHEDULER_DID_STOP'

function doStopScheduler () {
  return function ({dispatch, selectSchedulerTimerID, selectPeerTimers, selectConnectedPeers}) {
    var id = selectSchedulerTimerID()
    clearInterval(id)
    var ids = selectPeerTimers()
    ids.forEach(function (id) {
      clearInterval(id)
    })

    var connectedPeers = selectConnectedPeers()
    connectedPeers.forEach(doPeerDisconnect)
    dispatch({type: SCHEDULER_DID_STOP})
  }
}

const SCHEDULER_DID_TICK = 'SCHEDULER_DID_TICK'
function doSchedulerTick () {
  return {
    type: SCHEDULER_DID_TICK
  }
}

const CONNECTION_LIFETIME_SET = 'CONNECTION_LIFETIME_SET'

function doSetConnectionLifetime (seconds) {
  return {
    type: CONNECTION_LIFETIME_SET,
    payload: seconds
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Peers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const PEERS_ADDED = 'PEERS_ADDED'

function doAddPeers (peers) {
  return {
    type: PEERS_ADDED,
    payload: peers
  }
}

const PEER_PRIORITY_SET = 'PEER_PRIORITY_SET' // Does this have immediate affect? Easier if not.
const PRIORITY_HIGH = 'PRIORITY_HIGH'
const PRIORITY_MED = 'PRIORITY_MED'
const PRIORITY_LOW = 'PRIORITY_LOW'
const PRIORITY_BANNED = 'PRIORITY_BANNED'

function doSetPeerPriority (peerAddress) {
  return {
    type: PEER_PRIORITY_SET,
    payload: peerAddress
  }
}

const PEER_CONNECTION_LONGTERM_SET = 'PEER_CONNECTION_LONGTERM_SET'

function doSetPeerLongtermConnection (peerAddress, isLongterm) {
  return {
    type: PEER_CONNECTION_LONGTERM_SET,
    payload: {
      address: peerAddress,
      isLongterm
    }
  }
}

// thunk here to dispatch this.
const PEER_CONNECTION_STARTED = 'PEER_CONNECTION_STARTED'
const PEER_CONNECTION_CONNECTED = 'PEER_CONNECTION_CONNECTED'
const PEER_CONNECTION_ERROR = 'PEER_CONNECTION_ERROR'
// on connected we'll return a thunk that immediately dispatched connected with timeoutId as payload. Started closing will be dispatched eventually
function doPeerConnect (peer) {
  return function ({dispatch, peerConnect}) {
    dispatch({type: PEER_CONNECTION_STARTED, payload: peer })
    peerConnect(function (err) {
      if (err) { dispatch({type: PEER_CONNECTION_ERROR, payload: err}) } else { dispatch({type: PEER_CONNECTION_CONNECTED, payload: peer}) }
    })
  }
}

const PEER_CONNECTION_STARTED_CLOSING = 'PEER_CONNECTION_STARTED_CLOSING'
const PEER_CONNECTION_CLOSED = 'PEER_CONNECTION_CLOSED'

// we want to disconnect
function doPeerDisconnect (peer) {
  return function ({dispatch, peerDisconnect}) {
    dispatch({type: PEER_CONNECTION_STARTED_CLOSING, payload: peer})
    peerDisconnect(function () {
      dispatch({type: PEER_CONNECTION_CLOSED, payload: peer})
    })
  }
}

// disconnected remotely
function doPeerDidDisconnect (peer) {
  return {type: PEER_CONNECTION_CLOSED, payload: peer}
}

const PEER_CONNECTED_TO_US = 'PEER_CONNECTION_CONNECTED_TO_US'

function doInboundPeerConnected (peer) {
  return {
    type: PEER_CONNECTED_TO_US,
    payload: peer
  }
}

module.exports = {
  MAX_NUM_CONNECTIONS_SET,
  doSetMaxNumConnections,
  PEERS_ADDED,
  doAddPeers
}
