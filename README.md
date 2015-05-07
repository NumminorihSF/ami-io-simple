ami-io-simple - simplifier of ami-io (Asterisk AMI client)
========================

This is a AMI client.  List of available commands is below.

Install with:

    npm install ami-io-simple


## Usage

Simple example:

```js

    var AmiIo = require("ami-io-simple"),
        amiio = AmiIo.createClient(),
        amiio2 = new AmiIo.Client();

    //Both of this are similar

    amiio.on('incorrectServer', function () {
        amiio.logger.error("Invalid AMI welcome message. Are you sure if this is AMI?");
        process.exit();
    });
    amiio.on('connectionRefused', function(){
        amiio.logger.error("Connection refused.");
        process.exit();
    });
    amiio.on('incorrectLogin', function () {
        amiio.logger.error("Incorrect login or password.");
        process.exit();
    });
    amiio.on('event', function(event){
        amiio.logger.info('event:', event);
    });
    amiio.connect();
    amiio.on('connected', function(){
        setTimeout(function(){
            amiio.disconnect();
            amiio.on('disconnected', process.exit());
        },30000);
    });

```

Used events you can see below.


# API

## Connection Events

`client` will emit some events about the state of the connection to the AMI.

### "connectionRefused"

`client` will emit `connectionRefused` if server refused connection.

### "incorrectServer"

`client` will emit `incorrectServer` if server, you try connect is not an AMI.

### "incorrectLogin"

`client` will emit `incorrectLogin` if login or password aren't valid.

### "connected"

`client` will emit `connect` after connect to AMI and success authorize.

### "disconnected"

`client` will emit `disconnect` when connection close.

## AMI Events

### "event"

`client` will emit `event` when has new event object. All of them should find at
https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events.

### "responseEvent"

`client` will emit `responseEvent` when some response has event as part of itself.

### "rawEvent"

`client` will emit `rawEvent` when has new event object or a part of response object.
Note that use event and rawEvent at the same time is not a good idea.

### "rawEvent."+eventName

`client` will emit `rawEvent.`+eventName when has new event object or a part of response object.
You can find event names at https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events

### "ais."+eventName

These events will be emitted, then some raw event was simplified. See below.


## AIS Events

### "ais.CallStart"
 
Emitted, then call started. The argument to function is event Object:

* `callId` - String. An UniqueId of call from asterisk.
* `from` - String. Phone number of person, who try call somewhere.
* `to` - String. What number somebody try call to.
* `startAt` - Number. Unix timestamp.
         
### "ais.CallRing"

Emitted, then call ringed at recipient of it. The argument to function is event Object:

* `callId` - String. An UniqueId of call from asterisk.
* `from` - String. Phone number of person, who try call somewhere.
* `ringTo` - String. What number somebody try call to.
* `ringAt` - Number. Unix timestamp.

**Attention!** If call is in queue, may spawn many times.

### "ais.CallAddInfo"

Emitted, then some new data about call created. The argument to function is event Object:

* `callId` - String. An UniqueId of call from Asterisk.
* `queue` - String. *Optional*. Asterisk's queue name.
* `ringTo` - String. *Optional*. May spawned many times. What number somebody try call to.
* `ringAt` - Number. *Optional*. May spawned many times. Unix timestamp.
* `client` - String. *Optional*. If call to queue - client number.
* `origPos` - Number. *Optional*. If call to queue - position, that applied to call at join to queue.
* `route` - Number. *Optional*. `1` if call to queue.
* `abanPos` - Number. *Optional*. If call to queue and client abandon call - his position in queue at this moment.
* `context` - Number. *Optional*. May spawned many times. Context of call.
* `referTo` - String. *Optional*. If Asterisk use `local bridge` (besides `bridge`) - uniqueid of call, that our call bridged with.
* `callId2` - String. *Optional*. Id of call, that call bridged with.

**Attention!** Spawn many times.


### "ais.CallAnswered"

Emitted, then call answered. The argument to function is event Object:

* `callId` - String. An UniqueId of call from Asterisk.
* `channelFrom` - String. *Optional*. Channel name, from there call come.
* `channelNameFrom` - String. *Optional*. Part of channel name, from there call come.
* `channelIn` - String. *Optional*. Channel name, from there call come.
* `channelNameIn` - String. *Optional*. Part of channel name, from there call come.
* `answerAt` - Number. Unix timestamp.


### "ais.CallEnd"

Emitted, then call answered. The argument to function is event Object:

* `callId` - String. An UniqueId of call from Asterisk.
* `cause` - Number. Cause code from Asterisk. See http://www.voip-info.org/wiki/view/Asterisk+variable+hangupcause
* `endAt` - Number. Unix timestamp.


### "ais.QueueJoin"

Emitter, then somebody joined to queue (incoming call). The argument to function is event Object:
                                                       
* `callId` - String. An UniqueId of call from Asterisk.
* `queue` - String. Asterisk's queue name.
* `origPos` - Number. Position, that applied to call at join to queue.
* `client` - String. Client number.
* `joinAt` - Number. Unix timestamp.
                                                       

### "ais.QueueLeave"

Emitter, then somebody leaved queue (incoming call). The argument to function is event Object:
                                                       
* `callId` - String. An UniqueId of call from Asterisk.
* `queue` - String. Asterisk's queue name.
* `position` - Number. Position of call in queue, at the moment, then call leave queue.


### "ais.QueueMemberStatus"

Emitted, then some queue member changed status. If queue member is in more then one queue, spawn event to every queue.
The argument to function is event Object:

* `queue` - String. Asterisk's queue name.
* `device` - String. Phone number, user use.
* `user` - String. User name. Try parse it from Asterisk's `membername` field.
 If `membername` include `'$'` symbol - part of string before it. Else - whole field.
* `appId` - Number. Try parse it from Asterisk's `membername` field.
 If `membername` include `'$'` symbol - part of string after it. Default `0`.
* `penalty` - Number. Asterisk's queue member's penalty.
* `paused` - Number. Pause status of this device at this queue. 
`0` - unpaused, `1` - paused manualy, `2` - auto-pause, `3` - scenario-pause, `4` - service-pause.
All values bigger than 1 - create `reason` field based.
* `status` - Number. Status of device at queue. See https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+ManagerEvent_QueueMemberStatus
* `extenState` - Object. Status of devices at all queues, there it is.
* `reason` - String|`null`. If set pause to true - say why.

### "ais.QueueMemberAdded"

Emitted, then somebody adds to queue. If queue member is in more then one queue, spawn event to every queue.
The argument to function is event Object:

* `queue` - String. Asterisk's queue name.
* `device` - String. Phone number, user use.
* `user` - String. User name. Try parse it from Asterisk's `membername` field.
 If `membername` include `'$'` symbol - part of string before it. Else - whole field.
* `appId` - Number. Try parse it from Asterisk's `membername` field.
 If `membername` include `'$'` symbol - part of string after it. Default `0`.
* `penalty` - Number. Asterisk's queue member's penalty.
* `paused` - Number. Pause status of this device at this queue. 
`0` - unpaused, `1` - paused manualy, `2` - auto-pause, `3` - scenario-pause, `4` - service-pause.
All values bigger than 1 - create `reason` field based.
* `status` - Number. Status of device at queue. See https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+ManagerEvent_QueueMemberStatus
* `extenState` - Object. Status of devices at all queues, there it is.

### "ais.QueueMemberRemoved"

Emitted, then somebody adds to queue. If queue member is in more then one queue, spawn event to every queue.
The argument to function is event Object:

* `queue` - String. Asterisk's queue name.
* `device` - String. Phone number, user use.
* `user` - String. User name. Try parse it from Asterisk's `membername` field.
 If `membername` include `'$'` symbol - part of string before it. Else - whole field.
* `appId` - Number. Try parse it from Asterisk's `membername` field.
 If `membername` include `'$'` symbol - part of string after it. Default `0`.


# Methods

## amiio.createClient()

* `amiio.createClient() = amiio.createClient({port:5038, host:'127.0.0.1', login:'admin', password:'admin'})`

If some of object key are undefined - will use default value.

* `host`: which host amiio should use. Defaults to `127.0.0.1`.
* `port`: which port amiio should use. Defaults to `5038`.
* `login`: Default to `admin`.
* `password`: Default to `admin`.


## client.connect([shouldReconnect[, reconnectTimeout]])

When connecting to AMI servers you can use: `client.connect(true)` to create connection with auto-reconnect.
Auto-reconnect works only if auth was success. If you use `client.disconnect()` connection will close and
shouldn't be any reconnect.
If use `client.connect()` reconnect will not work.

Default reconnect timeout is 5000ms.

Also you may want to set timeout of reconnecting. Then use `client.connect(true, timeoutInMs)`.
You don't need to set up timeout for every time you connect (in one client object). After `client.disconnect()`
timeout will not be set to default, so you can use `client.connect(true)` to connect again with similar timeout.


## client.disconnect()

Forcibly close the connection to the AMI server.  Also stop reconnecting.


```js
    var amiio = require("ami-io"),
        client = amiio.createClient();

    client.connect();
    //Some code here
    client.disconnect();
```


## client.unref()

Call `unref()` on the underlying socket connection to the AMI server,
allowing the program to exit once no more commands are pending.

```js
var AmiIo = require("ami-io");
var client = AmiIo.createClient();

/*
    Calling unref() will allow this program to exit immediately after the get command finishes.
    Otherwise the client would hang as long as the client-server connection is alive.
*/
client.unref();
//will close process if only AmiIo is in it.
client.connect();
```

## client.ref()

Call `ref()` will cancel `unref()` effect.

## client.useLogger

Use `client.useLogger(LoggerObject)` if you want to use some another logger.
By default use console and ignore any logging levels.

```js
var AmiIo = require("ami-io");
var client = AmiIo.createClient();
var client.useLogger(logger);
```

logger should has `trace`,`debug`,`info`,`warn`,`error`,`fatal` methods.
Of course you can emulate them if some lib has not it.


# Extras

Some other things you might like to know about.

## client.connected

`true` if client is connected of `false` if it is not.

## client.reconnectionTimeout

Timeout for reconnect. If you didn't want reconnect ever, `client.reconnectionTimeout == undefined`.

## client.shouldReconnect

`true` if will be reconnect, or `false` if will not.

# Send action to AMI

Available actions:

* AGI
* AbsoluteTimeout
* AgentLogoff
* Agents
* AttendedTransfer
* BlindTransfer
* Bridge
* ChangeMonitor
* Command
* ConfbridgeKick
* ConfbridgeList
* ConfbridgeListRooms
* ConfbridgeLock
* ConfbridgeMute
* ConfbridgeUnlock
* ConfbridgeUnmute
* CoreSettings
* CoreShowChannels
* CoreStatus
* CreateConfig
* DahdiDialOffHook
* DahdiDndOff
* DahdiDndOn
* DahdiHangup
* DahdiRestart
* DahdiShowChannels
* DbDel
* DbDeltree
* DbGet
* DbPut
* ExtensionState
* GetConfig
* GetConfigJson
* GetVar
* Hangup
* JabberSend
* ListCategories
* ListCommands
* LocalOptimizeAway
* Login
* Logoff
* MailboxCount
* MailboxStatus
* MeetmeList
* MeetmeMute
* MeetmeUnmute
* ModuleCheck
* ModuleLoad
* ModuleReload
* ModuleUnload
* Monitor
* Originate
* Park
* ParkedCalls
* PauseMonitor
* Ping
* PlayDtmf
* QueueAdd
* QueueLog
* QueuePause
* QueueRemove
* QueueRule
* QueueStatus
* QueueSummary
* QueueUnpause
* Queues
* Redirect
* Reload
* SendText
* SetVar
* ShowDialPlan
* SipPeers
* SipQualifyPeer
* SipShowPeer
* SipShowRegistry
* Status
* StopMonitor
* UnpauseMonitor
* VoicemailUsersList

Description of all commands and variables they need, you can find at
https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Actions
All values, needed in commands, should passed like this:

```js
    var action = new amiio.Action.QueueSummary();
    action.queue = "some queue's name";
    amiioClient.send(action, function(err, data){
        if (err){
            //in current time - may be without error. need test
            //err === null if ami response match(/success/i), else response will pass as error
        }
    });
```



## LICENSE - "MIT License"

Copyright (c) 2015 Konstantine Petryaev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.