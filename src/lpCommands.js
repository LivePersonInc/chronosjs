;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpCommands", ["exports", "lpEventsUtil", "lpCommandUtil"], function (exports, evUtil, cmdUtil) {
            if (!namespace.lpCommands) {
                factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
            }

            return namespace.LPCommands;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.lpCommands) {
            factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/lpEventsUtil"), require("util/lpCommandUtil"));
    }
    else {
        /**
         * @depend ./util/lpEventsUtil.js
         * @depend ./util/lpCommandUtil.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
    }
}(this, function (root, exports, evUtil, cmdUtil) {
    "use strict";

    function LPCommands(defaults) {
        var appName = "Commands",
            attrName = "cmdName",
            commandId = 0,
            commands = {},
            fired = [],
            prefix = "cmdId_",
            indexer = 0,
            cloneData,
            eventBufferLimit;

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
    exports.LPCommands = exports.LPCommands || LPCommands;
}));
