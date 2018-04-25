# sbot-connection-manager

> improved gossip manager for sbot

Module that manages making connections to other sbots (peers).

The goal is to provide more control over when connections happen.
Features:
- Set maximum number of peers to connect to.
- Start and stop all connections. 
- Manager is 'off' by default, will only start trying to connect to peers when told to.
- Supports prioritising peers by `HIGH`, `MEDIUM`, `LOW` and `BANNED`.
- Supports initial sync mode. TBD what this actually does, for now just one peer connection, all scheduling of other connections is off.
- Supports "long term connections" where a peer can be specified to remain connected as long as possible.
- Supports connecting immediately and permanently to a peer. Useful for debugging. 
- Provides a stream of peers with errors. Useful for another module to decide which peers should be forgotten and which could be retried occasionally with low priority.

This module uses redux as a data store. Hopefully redux is a commonly understood pattern that makes it easy for others to contribute.

## Usage

## API

### Initialisation

```js
init(opts)
```

where `opts` is an object with keys:

`connectToPeer`: (required) an async function that can be passed a multiserver address to begin an outbound connection to a peer. Will normally be the `sbot.connect` function.

### Start initial sync

Starts an initial sync with one (optionally provided) peer.
When initial sync is happening we don't want to be trying to connecting to multiple peers.

```js
startInitialSync([peer])
```

### Stop initial sync

Stops an initial sync, may be resumed with `startInitialSync()`

```js
stopInitialSync()
```

### Prioritise peer

```js
setPeerPriority(peers)
```
Where `peers` is an array of objects with shape:
```js
  {
    address: multiserverAddress 
    priority: priorities.HIGH
  }
```
Where priority is an enum of HIGH, MED, LOW, BANNED.

### Add peers

```js
addPeers(peers)
```
Where `peers` is an array of objects with shape:
```js
  {
    address: multiserverAddress 
  }  
```

### Start making connections 

```js
startConnecting()
```

### Stop all connections 

```js
stopConnecting()
```

### Set maximum number of connections 

```js
setMaxConnections(max)
```
where `max` is an integer


### Connection errors

```js
connectionErrors()
```
A pull stream of errors received from trying to connect to peers. Will emit objects of shape:

```js
  {
    peer: multiServerAddress,
    error: Error
  }
```

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install sbot-gossip
```

## Acknowledgments

sbot-gossip was inspired by..

## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)
- ...

## License

MIT

