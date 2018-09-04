var {createSelector} = require('redux-bundler')
var {fromJS} = require('immutable')

const MAX_NUM_CONNECTIONS_SET = 'MAX_NUM_CONNECTIONS_SET'
const SCHEDULER_DID_START = 'SCHEDULER_DID_START'
const SCHEDULER_DID_STOP = 'SCHEDULER_DID_STOP'
const SCHEDULER_DID_TICK = 'SCHEDULER_DID_TICK'
const CONNECTION_LIFETIME_SET = 'CONNECTION_LIFETIME_SET'

const initialState = fromJS({
  maxConnectedPeers: 3,
  connectionLifetime: 10E3,
  appTime: 0,
  tickIntervalId: null,
  isSchedulerRunning: false
})

module.exports = {
  name: 'scheduler',
  reducer: function (state = initialState, {payload, type}) {
    switch (type) {
      case SCHEDULER_DID_START:
        return state
          .set('tickIntervalId', payload)
          .set('isSchedulerRunning', true)
      case SCHEDULER_DID_STOP:
        return state
          .set('isSchedulerRunning', false)
      case MAX_NUM_CONNECTIONS_SET:
        return state.set('maxConnectedPeers', payload)
      case CONNECTION_LIFETIME_SET:
        return state.set('connectionLifetime', payload)
      case SCHEDULER_DID_TICK:
        return state.update('appTime', function (time) {
          return time + payload
        })
      default:
        return state
    }
  },
  selectScheduler: function (state) {
    return state.scheduler
  },
  selectTickIntervalId: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('tickIntervalId')
  }),
  selectAppTime: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('appTime')
  }),
  selectConnectionLifetime: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('connectionLifetime')
  }),
  selectMaxConnectedPeers: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('maxConnectedPeers')
  }),
  selectIsSchedulerRunning: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('isSchedulerRunning')
  }),
  selectNumberOfFreeConnectionSlots: createSelector('selectMaxConnectedPeers', 'selectDisconnectedRoutes', 'selectRoutes', function (maxConnectedPeers, disconnectedRoutes, routes) {
    return maxConnectedPeers - (routes.size - disconnectedRoutes.size)
  }),
  reactRoutesThatShouldConnect: createSelector('selectIsSchedulerRunning', 'selectNumberOfFreeConnectionSlots', 'selectNextRoutesToConnectTo', function (isSchedulerRunning, numberOfFreeSlots, nextRoutesToConnectTo) {
    if (isSchedulerRunning && numberOfFreeSlots > 0) {
      var addresses = nextRoutesToConnectTo.take(numberOfFreeSlots)
      return {
        actionCreator: 'doRoutesConnect',
        args: [addresses.map(function (route) {
          return route.id
        })]
      }
    }
  }),
  doSetMaxNumConnections,
  doStartScheduler,
  doStopScheduler,
  doSchedulerTick,
  doSetConnectionLifetime
}

function doSetMaxNumConnections (max) {
  return {
    type: MAX_NUM_CONNECTIONS_SET,
    payload: max
  }
}

function doStartScheduler (interval) {
  return function ({dispatch}) {
    interval = interval || 1000
    var intervalID = setInterval(function () {
      dispatch(doSchedulerTick(interval))
    }, interval)
    dispatch({type: SCHEDULER_DID_START, payload: intervalID})
  }
}

// Kills all existing timers. Kills all existing connections.
// Sets all peers states to disconnected.
function doStopScheduler () {
  return function ({ dispatch, store, getState }) {
    var schedulerTimerId = store.selectTickIntervalId(getState())
    var connectedRoutes = store.selectConnectedRoutes(getState())

    clearInterval(schedulerTimerId)
    dispatch({type: SCHEDULER_DID_STOP})

    var namedAction = {
      actionCreator: 'doRoutesDisconnect',
      args: [connectedRoutes.map(function (route) {
        return route.id
      })]
    }
    setTimeout(function () {
      dispatch(namedAction)
    })
  }
}

function doSchedulerTick (ms) {
  return {
    type: SCHEDULER_DID_TICK,
    payload: ms
  }
}

function doSetConnectionLifetime (seconds) {
  return {
    type: CONNECTION_LIFETIME_SET,
    payload: seconds
  }
}
