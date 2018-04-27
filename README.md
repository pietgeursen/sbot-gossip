# sbot-connection-manager

> improved gossip manager for sbot

Module that manages making connections to other sbots (peers).
This is a replacement for the scuttlebot gossip plugin that's built into scuttlebot.

The goal is to provide more control over the manager with code that's easier to understand and extend.

Features:
- Set maximum number of peers to connect to.
- Start and stop all connections. 
- Manager is 'off' by default, will only start trying to connect to peers when told to.
- Supports prioritising peers by `HIGH`, `MEDIUM`, `LOW` and `BANNED`.
- Supports initial sync mode. TBD what this actually does, for now just one peer connection, all scheduling of other connections is off.
- Supports "long term connections" where a peer can be specified to remain connected as long as possible.
- Supports connecting immediately and permanently to a peer. Useful for debugging. 
- Provides a stream of peers with errors. Useful for another module to decide which peers should be forgotten and which could be retried occasionally with low priority.
- Provides an observable of peers
- Provides a hook for `onPrioritise` so other modules can change the prioritisation of peers.

This module uses redux as a data store. Hopefully redux is a commonly understood pattern that makes it easy for others to contribute.

Still to think about:

How to manage multi protocols? How does rtc fit in here?

## Usage

## API

### Initialisation

```js
var Manager = require('sbot-connection-manager')
var manager = Manager(opts)
```

where `opts` is an object with keys:

`connectToPeer`: (required) an async function that can be passed a multiserver address to begin an outbound connection to a peer. Will normally be the `sbot.connect` function.

### Initial sync

Starts or stops an initial sync with one (optionally provided) peer.
When initial sync is happening we don't want to be trying to connecting to multiple peers.

```js
manager.initialSync.start([peer])
```

where `peer` is optional.

or

```js
manager.initialSync.stop()
```

### Add peers

```js
manager.peers.add(peers)
```
Where `peers` is an array of objects with shape:
```js
{
  address: multiserverAddress 
}  

```
### Peers observable

An observable of the peers the manager knows about.

```js
manager.peers // tbd
```

### Prioritise peers

```js
manager.peers.setPriority(peers)
```
Where `peers` is an array of objects with shape:
```js
{
  address: multiserverAddress 
  priority: priority.HIGH
}
```
And priority is an enum of HIGH, MED, LOW, BANNED.

### Start making connections 

```js
manager.connections.start()
```

### Stop all connections 

```js
manager.connections.stop()
```

### Set maximum number of connections 

```js
manager.connections.setMax()
```
where `max` is an integer

### Set scheduler connection lifetime before disconnecting

If a connection is not "long term" it will be disconnected after `time` ms.
```js
manager.connections.setLifetime(timeMs)
```
### Remote peer did connect

```js
manager.connections.remotePeerConnected(peerId)
```

### Connection errors

```js
manager.connection.errors()
```
A pull stream of errors received from trying to connect to peers. Will emit objects of shape:

```js
{
  peer: multiServerAddress,
  error: Error
}
```
where `peerId` is the public key of the peer that connected.


## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install sbot-gossip
```

## Acknowledgments

This project is funded by a grant from [staltz](https://github.com/staltz) for the [mmmmm-mobile](https://github.com/staltz/mmmmm-mobile) project.

Thanks to [dominctarr](https://github.com/dominictarr) for a brain dump and some guidance on how to make this useful in the "normal" sbot context.

## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)
- ...

## License

MIT

