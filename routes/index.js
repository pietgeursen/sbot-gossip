'use strict'
var {Record, fromJS} = require('immutable')
var {createSelector} = require('redux-bundler')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

var {PRIORITY_MED} = require('../types')

var {
  DISCONNECTED,
  DISCONNECTING,
  CONNECTED,
  CONNECTING
} = require('./types')

var RouteRecord = Record({
  id: '', // A multiserver address
  peer: '', // id of peer this route belongs to. TBD if this needs to be here if the peer has a list of routes too.
  connectionState: DISCONNECTED,
  priority: PRIORITY_MED,

  // Below here all needs to non-volatile
  lastConnectionTime: null,
  isLongterm: false,
  isLocal: false, // we can't tell a local connection by looking at its multiserver address. It will always be 'net'
  errors: [],
  connectionCount: 0
})

const initialState = fromJS({})

module.exports = {
  name: 'routes',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case ROUTE_ADDED: {
        const { address } = action.payload
        const key = getKeyFromAddress(address)

        return state.update(address, function (route) {
          if (!route) {
            route = RouteRecord({id: address, peer: key})
          }

          return route
        })
      }
      case ROUTE_REMOVED: {
        const { address } = action.payload

        return state.delete(address)
      }
      case CONNECTION_LONGTERM_SET: {
        const { address, isLongterm } = action.payload

        return state.setIn([address, 'isLongterm'], isLongterm)
      }
      case PRIORITY_SET: {
        const { address, priority } = action.payload

        return state.setIn([address, 'priority'], priority)
      }
      case CONNECTION_STARTED: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], CONNECTING)
      }
      case CONNECTION_CONNECTED: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], CONNECTED)
      }
      case CONNECTION_CLOSED: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], DISCONNECTED)
      }
      case CONNECTION_STARTED_CLOSING: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], DISCONNECTING)
      }
      default:
        return state
    }
  },
  doAddRoute,
  doRemoveRoute,
  doRouteConnect,
  doRouteDisconnect,
  doRoutesDisconnect,
  doRouteDidDisconnect,
  doSetRoutePriority,
  doSetRouteLongtermConnection,
  doInboundRouteConnected,

  // TODO: should the peer selector give you the address as well? Selectors and action creators should have arg names updated to reflect if they're the peer address or the actual peer.
  selectRoutes,
  selectConnectedRoutes: createSelector('selectRoutes', function (peers) {
    return peers.filter(function (peer) {
      return peer.get('connectionStatus') === CONNECTED && peer.get('lastConnectionTime') // not sure why we need lastConnectionTime here.
    })
  }),
  selectRoutesThatShouldDisconnect: createSelector('selectConnectedRoutes', 'selectAppTime', 'selectConnectionLifetime', function (peers, appTime, connectionLifetime) {
    return peers.filter(function (peer) {
      const timePassed = appTime - peer.get('lastConnectionTime')
      return timePassed > connectionLifetime
    })
  }),
  reactRoutesThatShouldDisconnect: createSelector('selectRoutesThatShouldDisconnect', function (peers) {
    // needs to return an action. but we're dealing with an action that should change mulitple peers.
    // return {
    //  actionCreator: 'doRoutesDisconnect',
    //  args: [peers]
    // }
  })

}

function selectRoutes (state) {
  return state.routes
}

const ROUTE_ADDED = 'ROUTE_ADDED'
const ROUTE_REMOVED = 'ROUTE_REMOVED'
const CONNECTED_TO_US = 'CONNECTION_CONNECTED_TO_US'
const PRIORITY_SET = 'PRIORITY_SET' // Does this have immediate affect? Easier if not.
const CONNECTION_LONGTERM_SET = 'CONNECTION_LONGTERM_SET'
// thunk here to dispatch this.
const CONNECTION_STARTED = 'CONNECTION_STARTED'
const CONNECTION_CONNECTED = 'CONNECTION_CONNECTED'
const CONNECTION_ERROR = 'CONNECTION_ERROR'
const CONNECTION_STARTED_CLOSING = 'CONNECTION_STARTED_CLOSING'
const CONNECTION_CLOSED = 'CONNECTION_CLOSED'

function doAddRoute ({address}) {
  return {
    type: ROUTE_ADDED,
    payload: {
      address
    }
  }
}

function doRemoveRoute ({address}) {
  return {
    type: ROUTE_REMOVED,
    payload: {
      address
    }
  }
}

function doSetRoutePriority ({address}, priority) {
  return {
    type: PRIORITY_SET,
    payload: {
      address,
      priority
    }
  }
}

function doSetRouteLongtermConnection ({address}, isLongterm) {
  return {
    type: CONNECTION_LONGTERM_SET,
    payload: {
      address,
      isLongterm
    }
  }
}
// on connected we'll return a thunk that immediately dispatched connected with timeoutId as payload. Started closing will be dispatched eventually
// OR we use the nice reactor pattern. We dispatch connection time timed out and then write a selector so we only dispatch disconnect if we are still connected
function doRouteConnect (peer) {
  return function ({dispatch, connect}) {
    dispatch({ type: CONNECTION_STARTED, payload: peer })
    connect(peer, function (err) {
      if (err) {
        dispatch({type: CONNECTION_ERROR, payload: err})
        dispatch(doRouteDidDisconnect(peer))
      } else {
        dispatch({type: CONNECTION_CONNECTED, payload: peer})
      }
    })
  }
}

// we want to disconnect
function doRouteDisconnect (peer) {
  return function ({dispatch, disconnect}) {
    dispatch({type: CONNECTION_STARTED_CLOSING, payload: peer})
    disconnect(peer, function (err) {
      if (err) console.log(err) // we tried to disconnect from an already disconnected peer. Log and forget.
      dispatch({type: CONNECTION_CLOSED, payload: peer})
    })
  }
}

function doRoutesDisconnect (peers) {
  return function ({dispatch, disconnect}) {
    peers.forEach(function (peer) {
      dispatch({type: CONNECTION_STARTED_CLOSING, payload: peer})
      disconnect(peer, function (err) {
        if (err) console.log(err) // we tried to disconnect from an already disconnected peer. Log and forget.
        dispatch({type: CONNECTION_CLOSED, payload: peer})
      })
    })
  }
}

// disconnected remotely
function doRouteDidDisconnect (peer) {
  return {type: CONNECTION_CLOSED, payload: peer}
}

function doInboundRouteConnected (peer) {
  return {
    type: CONNECTED_TO_US,
    payload: peer
  }
}

var feedIdRegex = new RegExp(FeedIdRegex)

function getKeyFromAddress (address) {
  var {key} = parseAddress(address)
  return key.match(feedIdRegex)[1]
}
