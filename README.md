![chronosjs](https://cloud.githubusercontent.com/assets/5138735/7985842/785e3ef4-0adc-11e5-9a13-383d4c462949.png)
========
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
[![Build Status](https://travis-ci.org/LivePersonInc/chronosjs.svg)](https://travis-ci.org/LivePersonInc/chronosjs)
[![Test Coverage](https://codeclimate.com/github/LivePersonInc/chronosjs/badges/coverage.svg)](https://codeclimate.com/github/LivePersonInc/chronosjs/coverage)
[![Code Climate](https://codeclimate.com/github/LivePersonInc/chronosjs/badges/gpa.svg)](https://codeclimate.com/github/LivePersonInc/chronosjs)
[![npm version](https://badge.fury.io/js/chronosjs.svg)](http://badge.fury.io/js/chronosjs)
[![Dependency Status](https://david-dm.org/LivePersonInc/chronosjs.svg?theme=shields.io)](https://david-dm.org/LivePersonInc/chronosjs)
[![devDependency Status](https://david-dm.org/LivePersonInc/chronosjs/dev-status.svg?theme=shields.io)](https://david-dm.org/LivePersonInc/chronosjs#info=devDependencies)
[![npm downloads](https://img.shields.io/npm/dm/chronosjs.svg)](https://img.shields.io/npm/dm/chronosjs.svg)
[![NPM](https://nodei.co/npm/chronosjs.png)](https://nodei.co/npm/chronosjs/)

> LivePerson's Generic JS Channels Mechanism (Events/Commands/ReqRes)

Getting Started
---------------
Run ```npm install chronosjs```

Overview
-------------

This library provides an ability to develop event driven applications using the included submodules of events, commands and request/response.
Together with Courier, one can integrate multiple applications into one, by allowing cross domain cross application event driven communication. An application developer can integrate/embed a 3rd party application (provided the application uses courier as well) seamlessly and securely without worrying about cross domain issues. Another use case is for building multi module application where each module can be it's own application and a developer will want to mix and match between them.


### Chronos.Events
An events channel for binding and triggering events.
Allows multiple listeners on a single event and wildcards (`"*"`) support.

### Chronos.Commands
A command mechanism for complying and commanding and API call.
Allows a single comelier per command.
Supports async commands with an options to call a callback when done.

### Chronos.ReqRes
A request mechanism for replying and requesting and API call that returns a response.
Allows a single replier per request.
Supports async requests with an options to call a callback when done with a result.

### Chronos.Channels
A Channel which includes all communication means (events, commands, requests). Implements the same API's as all means it contains

### Chronos.PostMessageCourier
A generic implementation of Channels over postMessage API.
Allows communication between cross domain IFRAMES "sharing" Channels.

### Package Contents
The package holds a few artifacts:
- Events.js: The events channel
- Commands.js: The commands channel
- Reqres.js: The request/response channel
- Channels.js: Combination of all 3 channel options
- PostMessageCourierNoDep.js: Channel transport over postmessage
- PostMessageCourier.js: Combination of all 3 channel options with channel transport over postmessage

Usage examples
---------------

### Events
```javascript
var events = new Chronos.Events();

//Listen on the event only once
events.once({
    appName: "Your App Name",
    eventName: "Your Event Name",
    func: _yourCallBackFunction
});

//Regular bind on the event
events.bind({
    appName: "Your App Name",
    eventName: "Your Event Name",
    func: _yourCallBackFunction
});

//Unbind from the event
events.unbind({
    appName: "Your App Name",
    eventName: "Your Event Name",
    func: _yourCallBackFunction
});

//Trigger the event
events.trigger({
    appName: "Your App Name",
    eventName: "Your Event Name",
    data: {}
});

//Will return an array of fired events
events.hasFired("Your App Name", "Your Event Name");
```

There is an option to pass `"*"` as event name and `"*"` as app name on all APIs which is an ALL indicator.

### Commands
```javascript
var commands = new Chronos.Commands();

function _yourCommandExecution(data, cb) {
    //Do something async with data and call cb when done.
}

//Comply to a command
commands.comply({
    appName: "Your App Name",
    cmdName: "Your Command Name",
    func: _yourCommandExecution
});

//Stop complying to a command
commands.stopComplying({
    appName: "Your App Name",
    cmdName: "Your Command Name",
    func: _yourCommandExecution
});

var cmd = {
    appName: "Your App Name",
    cmdName: "Your Event Name",
    data: {}
}
function notifyWhenDone(err) {
    if (!err) {
        console.log('Done executing command');
    }
}
//Issue the command
commands.command(cmd, notifyWhenDone);

//Will return an array of fired commands
commands.hasFired("Your App Name", "Your Command Name");
```

The callback on the command is optional.

### ReqRes
```javascript
var reqres = new Chronos.ReqRes();

function _yourRequestExecution(data, cb) {
    //Do something async with data and call cb when done.
    return 1; //Whatever you want to return
}

//Reply to a request
reqres.reply({
    appName: "Your App Name",
    reqName: "Your Request Name",
    func: _yourRequestExecution
});

//Stop replying to a request
reqres.stopReplying({
    appName: "Your App Name",
    reqName: "Your Command Name",
    func: _yourRequestExecution
});

var req = {
    appName: "Your App Name",
    reqName: "Your Request Name",
    data: {}
}
function notifyWhenDoneWithResult(err, res) {
    if (!err) {
        console.log('Done executing request with result=' + JSON.stringify(res));
    }
}
//Issue the request
var res = reqres.command(req, notifyWhenDoneWithResult);

//Will return an array of fired requests
reqres.hasFired("Your App Name", "Your Request Name");
```

The callback on the request is optional.

### PostMessageCourier
```javascript
// Initialize a new Courier
var courier = Chronos.PostMessageCourier({
    target: {
        url: "http://www.crossdomain.com/"
    }
});

///// ---- BINDINGS ------ ////
courier.bind({
    appName: "host",
    eventName: "multiply",
    func: multiply
});
courier.comply({
    appName: "host",
    cmdName: "square",
    func: square
});
courier.reply({
    appName: "host",
    reqName: "divide",
    func: divide
});

///// ---- INVOCATION ------ ////
courier.trigger({
    appName: "frame",
    eventName: "got_it",
    data: data * 2
});
courier.command({
    appName: "frame",
    cmdName: "expect",
    data: data
}, function(err) {
    if (err) {
        console.log("Problem invoking command");
    }
});
courier.request({
    appName: "frame",
    reqName: "askBack",
    data: data
}, function(err, data) {
    if (err) {
        console.log("Problem invoking request");
	    return;
	}
	// Do Something with the data
	console.log(data);
});
```
###LIMITATIONS
- Only supports browsers which implements postMessage API and have native JSON implementation (IE8+, Chrome, FF, Safari, Opera, IOS, Opera Mini, Android)
- IE9-, FF & Opera Mini does not support MessageChannel and therefore we fallback to using basic postMessage. This makes the communication opened to any handler registered for messages on the same origin.
- All passDataByRef flags (in Channels) are obviously ignored
- In case the browser does not support passing object using postMessage (IE8+, Opera Mini), and no special serialize/deserialize methods are supplied to PostMessageCourier, All data is serialized using JSON.stringify/JSON.parse which means that Object data is limited to JSON which supports types like: strings, numbers, null, arrays, and objects (and does not allow circular references). Trying to serialize other types, will result in conversion to null (like Infinity or NaN) or to a string (Dates), that must be manually deserialized on the other side
- When IFRAME is managed outside of PostMessageCourier (passed by reference to the constructor), a targetOrigin option is expected to be passed to the constructor, and a query parameter with the name "lpHost" is expected on the IFRAME url (unless the PostMessageCourier at the IFRAME side, had also been initialized with a valid targetOrigin option)

Wrappers
-----------
- [ngChronos](/wrappers/angular.md) for angular js.

License
---------
MIT

Credits
-------
Thanks to [Danielle Dimenshtein](http://cargocollective.com/danielledim) for the logo

Session on this subject with code examples can be found [here](http://webyoda.github.io/choose-your-channels/#/)
