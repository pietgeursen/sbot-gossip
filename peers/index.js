'use strict'
var {Record, Map, fromJS} = require('immutable')
var {createSelector} = require('redux-bundler')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

var {PRIORITY_MED} = require('../types')

var feedIdRegex = new RegExp(FeedIdRegex)

// TODO: put somewhere else
var DISCONNECTED = 'DISCONNECTED'
var DISCONNECING = 'DISCONNECING'
var CONNECTING = 'CONNECTING'
var CONNECTED = 'DISCONNECTED'

var RouteRecord = Record({
  isConnected: false,
  priority: PRIORITY_MED,

  // Below here all needs to non-volatile
  lastConnectionTime: null,
  isLongterm: false,
  isLocal: false, // we can't tell a local connection by looking at its multiserver address. It will always be 'net'
  errors: [],
  connectionCount: 0
})

// peerRecords are keyed in `peers` by their pubKey.
var PeerRecord = Record({
  routes: Map({}) // map of routeRecords, keyed by multiserver address
  // eg:
  // {
  // <multiserver-address>: <routeRecord>
  // }

})

const initialState = fromJS({})

module.exports = {
  name: 'peers',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case PEER_ROUTE_ADDED: {
        const { address } = action.payload
        let {key} = parseAddress(address)
        key = key.match(feedIdRegex)[1]

        return state.update(key, function (peer) {
          // If we don't have a peerRecord we need to make one
          if (!peer) {
            peer = PeerRecord()
          }

          return peer.updateIn(['routes', address], function (route) {
            if (!route) {
              route = RouteRecord()
            }

            return route
          })
        })
      }
      case PEER_ROUTE_REMOVED: {
        const { address } = action.payload
        let {key} = parseAddress(address)
        key = key.match(feedIdRegex)[1]

        return state.deleteIn([key, 'routes', address])
      }
      case PEER_CONNECTION_LONGTERM_SET: {
        const { address, isLongterm } = action.payload
        let {key} = parseAddress(address)
        key = key.match(feedIdRegex)[1]

        return state.setIn([key, 'routes', address, 'isLongterm'], isLongterm)
      }
      case PEER_PRIORITY_SET: {
        const { address, priority } = action.payload
        let {key} = parseAddress(address)
        key = key.match(feedIdRegex)[1]

        return state.setIn([key, 'routes', address, 'priority'], priority)
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
  doRemoveRouteToPeer,
  doSetPeerPriority,
  doSetPeerLongtermConnection,
  doInboundPeerConnected,

  // TODO: should the peer selector give you the address as well? Selectors and action creators should have arg names updated to reflect if they're the peer address or the actual peer.
  selectPeers,
  selectConnectedPeers: createSelector('selectPeers', function (peers) {
    return peers.filter(function (peer) {
      return peer.get('connectionStatus') === CONNECTED && peer.get('lastConnectionTime') // not sure why we need lastConnectionTime here.
    })
  }),
  selectPeersThatShouldDisconnect: createSelector('selectConnectedPeers', 'selectAppTime', 'selectConnectionLifetime', function (peers, appTime, connectionLifetime) {
    return peers.filter(function (peer) {
      const timePassed = appTime - peer.get('lastConnectionTime')
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
const PEER_ROUTE_REMOVED = 'PEER_ROUTE_REMOVED'
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

function doRemoveRouteToPeer (route) {
  return {
    type: PEER_ROUTE_REMOVED,
    payload: route
  }
}

function doSetPeerPriority ({address}, priority) {
  return {
    type: PEER_PRIORITY_SET,
    payload: {
      address,
      priority
    }
  }
}

function doSetPeerLongtermConnection ({address}, isLongterm) {
  return {
    type: PEER_CONNECTION_LONGTERM_SET,
    payload: {
      address,
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
