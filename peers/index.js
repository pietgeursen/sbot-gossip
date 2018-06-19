'use strict'
var {Record, Map, fromJS} = require('immutable')
var {createSelector} = require('redux-bundler')
var {PRIORITY_MED} = require('../')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

var feedIdRegex = new RegExp(FeedIdRegex)

// TODO: put somewhere else
var DISCONNECTED = 'DISCONNECTED'
var CONNECTING = 'CONNECTING'
var CONNECTED = 'DISCONNECTED'

var RouteRecord = Record({
  isConnected: false,
  isLocal: false // we can't tell a local connection by looking at its multiserver address. It will always be 'net'
})

// peerRecords are keyed in `peers` by their pubKey.
var PeerRecord = Record({
  routes: Map({}), // map of routeRecords, keyed by multiserver address
  // eg:
  // {
  // <multiserver-address>: <routeRecord>
  // }

  // Below here all needs to non-volatile
  priority: PRIORITY_MED,
  lastConnection: null,
  isLongterm: false,
  connectionCount: 0,
  errors: []
})

const initialState = fromJS({})

module.exports = {
  name: 'peers',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case PEER_ROUTE_ADDED: {
        const { address } = action.payload
        var {key} = parseAddress(address)
        key = key.match(feedIdRegex)[1]

        return state.update(key, function (peer) {
          // If we don't have a peerRecord we need to make one
          if (!peer) {
            peer = PeerRecord()
          }

          // If the route to the peer doesn't exist then make a new route
          if (!peer.getIn(['routes', address])) {
            peer = peer.setIn(['routes', address], RouteRecord())
          }

          return peer
        })
      }
      case PEER_CONNECTION_LONGTERM_SET: {
        const {address: peer, isLongterm} = action.payload
        return state.setIn([peer, 'isLongterm'], isLongterm)
      }
      default:
        return state
    }
  },
  doPeerConnect,
  doPeerDisconnect,
  doPeersDisconnect,
  doPeerDidDisconnect,
  doAddRouteToPeer,
  doSetPeerPriority,
  doSetPeerLongtermConnection,
  doInboundPeerConnected,

  // TODO: should the peer selector give you the address as well? Selectors and action creators should have arg names updated to reflect if they're the peer address or the actual peer.
  selectPeers,
  selectConnectedPeers: createSelector('selectPeers', function (peers) {
    return peers.filter(function (peer) {
      return peer.get('connectionStatus') === CONNECTED && peer.get('lastConnection')
    })
  }),
  selectPeersThatShouldDisconnect: createSelector('selectConnectedPeers', 'selectAppTime', 'selectConnectionLifetime', function (peers, appTime, connectionLifetime) {
    return peers.filter(function (peer) {
      const timePassed = appTime - peer.get('lastConnection')
      return timePassed > connectionLifetime
    })
  }),
  reactPeersThatShouldDisconnect: createSelector('selectPeersThatShouldDisconnect', function (peers) {
    // needs to return an action. but we're dealing with an action that should change mulitple peers.
    // return {
    //  actionCreator: 'doPeersDisconnect',
    //  args: [peers]
    // }
  })

}

function selectPeers (state) {
  return state.peers
}

const PEER_ROUTE_ADDED = 'PEER_ROUTE_ADDED'
const PEER_CONNECTED_TO_US = 'PEER_CONNECTION_CONNECTED_TO_US'
const PEER_PRIORITY_SET = 'PEER_PRIORITY_SET' // Does this have immediate affect? Easier if not.
const PEER_CONNECTION_LONGTERM_SET = 'PEER_CONNECTION_LONGTERM_SET'
// thunk here to dispatch this.
const PEER_CONNECTION_STARTED = 'PEER_CONNECTION_STARTED'
const PEER_CONNECTION_CONNECTED = 'PEER_CONNECTION_CONNECTED'
const PEER_CONNECTION_ERROR = 'PEER_CONNECTION_ERROR'
const PEER_CONNECTION_STARTED_CLOSING = 'PEER_CONNECTION_STARTED_CLOSING'
const PEER_CONNECTION_CLOSED = 'PEER_CONNECTION_CLOSED'

function doAddRouteToPeer (route) {
  return {
    type: PEER_ROUTE_ADDED,
    payload: route
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
// OR we use the nice reactor pattern. We dispatch connection time timed out and then write a selector so we only dispatch disconnect if we are still connected
function doPeerConnect (peer) {
  return function ({dispatch, connect}) {
    dispatch({ type: PEER_CONNECTION_STARTED, payload: peer })
    connect(peer, function (err) {
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
    disconnect(peer, function (err) {
      if (err) console.log(err) // we tried to disconnect from an already disconnected peer. Log and forget.
      dispatch({type: PEER_CONNECTION_CLOSED, payload: peer})
    })
  }
}

function doPeersDisconnect (peers) {
  return function ({dispatch, disconnect}) {
    peers.forEach(function (peer) {
      dispatch({type: PEER_CONNECTION_STARTED_CLOSING, payload: peer})
      disconnect(peer, function (err) {
        if (err) console.log(err) // we tried to disconnect from an already disconnected peer. Log and forget.
        dispatch({type: PEER_CONNECTION_CLOSED, payload: peer})
      })
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
