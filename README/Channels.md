#Overview

Channels wraps Events, Commands and ReqRes as a single package.
It's main use is to pass around when you'd like to share your events bus with multiple iFrames.
Such cases arise mainly when you'd like to trigger events between iFrames.

Example :
```
var channel = new Chronos.Channels(options);
```

Options can contain:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| config | Object | Configuration for protocols | None |
| events | Events Instance | A Chronos.Events instance | None |
| commands | Commands Instance | A Chronos.Commands instance | None |
| reqres | ReqRes Instance | A Chronos.reqres instance | None |


Config object options:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| events | Object | A Chronos.Events configuration object| None |
| commands | Object | A Chronos.Commands configuration object| None |
| reqres | Object | A Chronos.ReqRes configuration object| None |


Sample Code:
```
var channel = new Chronos.Channels({
    config: {
        events: {},
        commands: {},
        reqres: {}
    }
});
```
Exposed Instance API:
```     once //From Events
        hasFiredEvents //From Events
        trigger //From Events
        publish //From Events
        bind //From Events
        register //From Events
        unbind //From Events
        unregister //From Events
        hasFiredCommands //From Commands
        comply //From Commands
        stopComplying //From Commands
        command //From Commands
        hasFiredReqres //From ReqRes
        request //From ReqRes
        reply //From ReqRes
        stopReplying //From ReqRes
```
