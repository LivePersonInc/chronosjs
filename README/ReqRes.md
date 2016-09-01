#Overview

ReqRes is an API to send requests and get responses for them.

ReqRes exists in the <b>/dist/</b> folder and the <b>/dist/min/</b> folder as <b>Reqres.js</b>.

##Creation
ReqRes receives a few parameters for it's constructor.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | A default application name for requests | "*" - trigger for all |
| cloneEventData | Boolean | Defines if data is cloned per request, if ```true``` incurs minor performance penalty but promises unchanged request data | false |
| eventBufferLimit | Number | Defines number of requests stored in history (retrievable by hasFired) | -1 , no limitation |

Example:
```
 var reqres = new Chronos.ReqRes({
    appName: "MyApp",
    eventBufferLimit: 100
 });
 ```


##reply
This registers to reply to certain requests.
Returns an replyId you can use to unbind with.

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application we're replying to | default app (from configuration) |
| reqName | String | The name of the request we're responding to | None - Required |
| func | Function OR Array of functions | Function/s to trigger when request has fired | None - required |
| context | Object | Execution context for the function | None |

Example:
```
   var replyId = reqres.reply({
        appName: "MyApp",
        reqName: "WhatsTheTime",
        func : function returnTime(requestData, cb){
            if(requestData) {
                cb(new Date().getTime());
            }
        },
        context: myAppInstance
    });
```

Callback functions get called with two parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| requestData | Object / String / Number / Boolean | The request data | None |
| callback | Function | Function to call when request was completed with the data |  None |

Example reply function
```
   function requestCallback(requestData, callback){
     if(data){
        //Do something...
        if(typeof callback === 'function'){
            callback(/* The data that was requested */)
        }
     }
   }
```

##request

Trigger a requests to all those registered to reply.

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application we're replying to | default app (from configuration) |
| reqName | String | The name of the request we're responding to | None - Required |
| passDataByRef | Boolean | If to publish the request by reference | true |
| data | Object / String / Number / Boolean | The request data | None |
| cb | Function | Function to call when request was completed |  None |

Example:
```
   reqres.request({
        appName: "MyApp",
        reqName: "WhatsTheTime",
        data: { "today" : "now" },
        passDataByRef: false,
        cb : returnTime(data){  /*Notify when done */ }
    });
```

##stopReplying

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application| default app (from configuration) |
| reqName | String | The name of the request we're responding to | None - Required |
| func | Function OR Array of functions | Function/s to trigger when request has triggered | None - required |
| context | Object | Execution context for the function | None |

Example:
```
   reqres.stopReplying({
        appName: "MyApp",
        reqName: "Terminating",
        func : function doCleanUp(){ //Clean up my stuff  },
        context: myAppInstance
    });
```

OR

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| replyId | String | The id of the registration to reply | None |

Example:
```
   reqres.stopReplying(replyId);
```

##hasFired

Returns already fired requests as an Array if they still exist in the cache (see configuring reqres at the top).

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application | default app name |
| reqName | String | The name of the request | None |

Example:

```
    var firedEvents = reqres.hasFired(appName, reqName );

```


