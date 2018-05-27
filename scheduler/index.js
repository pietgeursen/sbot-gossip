var {createSelector} = require('redux-bundler')
var {fromJS} = require('immutable')

const MAX_NUM_CONNECTIONS_SET = 'MAX_NUM_CONNECTIONS_SET'
const SCHEDULER_DID_START = 'SCHEDULER_DID_START'
const SCHEDULER_DID_STOP = 'SCHEDULER_DID_STOP'
const SCHEDULER_DID_TICK = 'SCHEDULER_DID_TICK'
const CONNECTION_LIFETIME_SET = 'CONNECTION_LIFETIME_SET'

const initialState = fromJS({
  maxConnectedPeers: {
    rtc: 3,
    net: 3,
    onion: 3,
    ws: 0,
    wss: 0
  },
  connectionLifetime: 30E3
})

module.exports = {
  name: 'scheduler',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case MAX_NUM_CONNECTIONS_SET:
        return state.mergeIn(['maxConnectedPeers'], action.payload)
      default:
        return state
    }
  },
  selectScheduler: function (state) {
    return state.scheduler
  },
  selectConnectionLifetime: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('connectionLifetime')
  }),
  selectMaxConnectedPeers: createSelector('selectScheduler', function (scheduler) {
    return scheduler.get('maxConnectedPeers')
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

// I think we want a thunk that dispatches DID_START straight away, intervalId as payload. Then ticks actions are dispatched from the interval

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
function doStopScheduler () {
  return function ({dispatch, doPeerDisconnect, selectSchedulerTimerID, selectPeerTimers, selectConnectedPeers}) {
    clearInterval(selectSchedulerTimerID())
    selectPeerTimers().forEach(clearInterval)

    selectConnectedPeers().forEach(doPeerDisconnect)
    dispatch({type: SCHEDULER_DID_STOP})
  }
}

function doSchedulerTick () {
  return {
    type: SCHEDULER_DID_TICK
  }
}

function doSetConnectionLifetime (seconds) {
  return {
    type: CONNECTION_LIFETIME_SET,
    payload: seconds
  }
}
