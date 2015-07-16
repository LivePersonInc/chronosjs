;(function (root, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Commands", ["Chronos.EventsUtil", "Chronos.CommandsUtil"], function (EventsUtil, CommandsUtil) {
            return factory(root, root, EventsUtil, CommandsUtil, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/EventsUtil"), require("util/CommandsUtil"));
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./util/EventsUtil.js
         * @depend ./util/CommandsUtil.js
         */
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil, root.Chronos.CommandsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil, cmdUtil, hide) {
    "use strict";

    function Commands(defaults) {
        var appName = "Commands",
            attrName = "cmdName",
            commandId = 0,
            commands = {},
            fired = [],
            prefix = "cmdId_",
            indexer = 0,
            cloneData,
            eventBufferLimit,
            defaultAppName;

        defaultAppName = defaults && defaults.appName || "*";
        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This function allows registering for command with the following structure:
         * @param cmd = {
         *   cmdName: string that is the name of the event that will be triggered like 'get'
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   }
         *
         * @return {String} - command Id.
         */
        function comply(cmd) {
            if ("*" !== defaultAppName) {
                cmd.appName = cmd.appName || defaultAppName;
            }
            return cmdUtil.bind({
                cmd: cmd,
                attrName: attrName,
                loggerName: appName,
                prefix: prefix,
                id: commandId,
                lstnrs: commands
            });
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * cmdName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - commandId
         * @return {Boolean} - has stopped complying.
         */
        function stopComplying(unbindObj) {
            if ("*" !== defaultAppName) {
                unbindObj.appName = unbindObj.appName || defaultAppName;
            }
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: commands
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param cmdName = command name
         * @return {Array}
         */
        function hasFired(app, cmdName) {
            if ("undefined" === typeof cmdName) {
                cmdName = app;
                app = defaultAppName;
            }

            return evUtil.hasFired(fired, app, cmdName);
        }

        /**
         * This triggers a command
         * @param cmd = {
         *  cmdName - the name of the command triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  }
         *
         * @param cb - optional callback to notify when finished
         * @return {*}
         */
        function command(cmd, cb) {
            if (!cmd || typeof (cmd.cmdName) === "undefined" || !cmdUtil.valid(cmd, cmd.cmdName)) {
                evUtil.log("CMD name not spec for command", "ERROR", "Commands");
                return null;
            }
            if ("*" !== defaultAppName) {
                cmd.appName = cmd.appName || defaultAppName;
            }
            cmd.passDataByRef = cmd.passDataByRef || !cloneData;
            _storeEventData(cmd);
            if (!commands[cmd.cmdName]) {
                return false;
            }
            var callBacks = evUtil.getListeners(commands, cmd.cmdName, cmd.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var cmdData = cmd.passDataByRef ? cmd.data : evUtil.cloneEventData(cmd.data);//Clone the event data if there was not an explicit request to passByRef
                    var callBack = callBacks[j];

                    try {
                        if ("function" === typeof cb) {
                            callBack.func.call(callBack.context, cmdData, cb);
                        } else {
                            callBack.func.call(callBack.context, cmdData);
                        }
                        cmdData = null;//Delete local pointer
                        callBack = null;
                    } catch (err) {
                        if ("function" === typeof cb) {
                            try {
                                cb(err);
                            } catch (e) {
                                evUtil.log("Error executing callback on error, " +cmd.cmdName + " commandId: " + callBack.id + "e=" + e.message, "ERROR", "Commands");
                            }
                        }
                        //noinspection JSUnresolvedVariable
                        evUtil.log("Error executing " + cmd.cmdName + " commandId: " + callBack.id + "e=" + err.message, "ERROR", "Commands");
                    }
                }
            }
            return (callBacks.length > 0);
        }

        //------------------- Private methods ------------------------------//

        /**
         * Stores commands so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }

        this.hasFired = hasFired;
        this.comply = comply;
        this.stopComplying = stopComplying;
        this.command = command;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.Commands = exports.Commands || Commands;
    }
    return Commands;
}));
