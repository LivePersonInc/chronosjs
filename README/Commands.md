#Overview

Commands is an API to send commands and get compliance for them from the client given the command.

Commands exists in the <b>/dist/</b> folder and the <b>/dist/min/</b> folder as <b>Commands.js</b>.

##Creation
Commands receives a few parameters for it's constructor.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | A default application name for commands | "*" - trigger for all |
| cloneEventData | Boolean | Defines if data is cloned per complyer, if ```true``` incurs minor performance penalty but promises unchanged command data | false |
| eventBufferLimit | Number | Defines number of commands stored in history (retrievable by hasFired) | -1 , no limitation |

Example:
```javascript
 var commands = new Chronos.Commands({
    appName: "MyApp",
    cloneEventData: true,
    eventBufferLimit: 100
 });
 ```

#API
These are the exposed methods on an instance.

##comply
Allows registering for commands to comply with.
Returns a commandId to stopComplying.


Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application sending the command| default app (from configuration) |
| cmdName | String | The name of the command we're complying to | None - Required |
| func | Function OR Array of functions | Function/s to trigger when command has triggered | None - required |
| context | Object | Execution context for the function | None |

Example:
```javascript
   var commandId = commands.comply({
        appName: "MyApp",
        cmdName: "Terminating",
        func : function doCleanUp(){ //Clean up my stuff  },
        context: myAppInstance
    });
```

##command

Trigger a command to all those complying.

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application| default app (from configuration) |
| cmdName | String | The name of the command we're complying to | None - Required |
| passDataByRef | Boolean | If to publish the command by reference | true |
| data | Object / String / Number / Boolean | The command data | None |
| cb | Function | Function to call when compliance was completed |  None |

Example:
```javascript
   commands.command({
        appName: "MyApp",
        cmdName: "Terminating",
        data: { "action" : "stopIt" },
        passDataByRef: false,
        cb : function(){  /*Notify when done */ }
    });
```

##stopComplying

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application| default app (from configuration) |
| cmdName | String | The name of the command we're complying to | None - Required |
| func | Function OR Array of functions | Function/s to trigger when command has triggered | None - required |
| context | Object | Execution context for the function | None |

Example:
```javascript
   commands.stopComplying({
        appName: "MyApp",
        cmdName: "Terminating",
        func : function doCleanUp(){ //Clean up my stuff  },
        context: myAppInstance
    });
```

OR

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| commandId | String | The name of the application sending the command| default app (from configuration) |

Example:
```javascript
   commands.stopComplying(commandId);
```

##hasFired

Returns already fired commands if they still exist in the cache (see configuring commands at the top).

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application | default app name |
| commandName | String | The name of the command | None |

Example:

```javascript
    var firedEvents = commands.hasFired(appName, commandName );

```
