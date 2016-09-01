#Overview

Commands is an API to send commands and get compliance for them from the client given the command.

##Creation
Commands receives a few parameters for it's constructor.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | A default application name for commands | "*" - trigger for all |
| eventBufferLimit | Number | Defines number of commands stored in history (retrievable by hasFired) | -1 , no limitation |

Example:
```
 var commands = new Chronos.Commands({
    appName: "MyApp",
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
```
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
| passDataByRef | Boolean | If to publish the event by reference | true |
| data | Object / String / Number / Boolean | The command data | None |
| cb | Function | Function to call when compliance was completed |  None |

Example:
```
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
```
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
```
   commands.stopComplying(commandId);
```

##hasFired

Returns already fired events if they still exist in the cache (see configuring events at the top).

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application | default app name |
| commandName | String | The name of the command | None |

Example:

```
    var firedEvents = commands.hasFired(appName, commandName );

```
