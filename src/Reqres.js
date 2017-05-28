;(function (root, factory) {
    "use strict";

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Reqres", ["Chronos.EventsUtil", "Chronos.CommandsUtil"], function (EventsUtil, CommandsUtil) {
            return factory(root, root, EventsUtil, CommandsUtil, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./util/EventsUtil").EventsUtil, require("./util/CommandsUtil").CommandsUtil);
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
    function ReqRes(defaults) {
        var appName = "ReqRes",
            attrName = "reqName",
            requestId = 0,
            requests = {},
            fired = [],
            prefix = "reqId_",
            indexer = 0,
            cloneData,
            eventBufferLimit,
            defaultAppName;

        defaultAppName = defaults && defaults.appName || "*";
        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This function allows registering for command with the following structure:
         * @param req = {
         *   reqName: string that is the name of the event that will be triggered like 'get'
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   }
         *
         * @return {String} - command Id.
         */
        function reply(req) {
            if ("*" !== defaultAppName) {
                req.appName = req.appName || defaultAppName;
            }
            return cmdUtil.bind({
                cmd: req,
                attrName: attrName,
                loggerName: appName,
                prefix: prefix,
                id: requestId,
                lstnrs: requests
            });
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * reqName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - requestId
         * @return {Boolean} - has stopped complying.
         */
        function stopReplying(unbindObj) {
            if ("*" !== defaultAppName) {
                unbindObj.appName = unbindObj.appName || defaultAppName;
            }
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: requests
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param reqName = command name
         * @return {Array}
         */
        function hasFired(app, reqName) {
            if ("undefined" === typeof reqName) {
                reqName = app;
                app = defaultAppName;
            }

            return evUtil.hasFired(fired, app, reqName);
        }

        /**
         * This triggers a command
         * @param req = {
         *  reqName - the name of the command triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  }
         *  @param cb - optional callback to notify when finished
         * @return {*}
         */
        function request(req, cb) {
            var ret;
            if (!req || typeof (req.reqName) === "undefined" || !cmdUtil.valid(req, req.reqName)) {
                evUtil.log("request: name not spec for command", "ERROR", "ReqRes");
                throw new Error("Invalid request object");
            }
            if ("*" !== defaultAppName) {
                req.appName = req.appName || defaultAppName;
            }
            req.passDataByRef = req.passDataByRef || !cloneData;
            _storeEventData(req);
            if (!requests[req.reqName]) {
                return ret; //return undefined
            }
            var callBacks = evUtil.getListeners(requests, req.reqName, req.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var reqData = req.passDataByRef ? req.data : evUtil.cloneEventData(req.data);//Clone the event data if there was not an explicit request to passByRef
                    var requestInformation = {appName: req.appName, reqName: req.reqName};
                    var callBack = callBacks[j];

                    try {
                        if ("function" === typeof cb) {
                            ret = callBack.func.call(callBack.context, reqData, cb);
                        } else {
                            ret = callBack.func.call(callBack.context, reqData);
                        }
                        reqData = null;//Delete local pointer
                        callBack = null;
                    } catch (err) {
                        if ("function" === typeof cb) {
                            try {
                                cb(err);
                            } catch (e) {
                                evUtil.log("Error executing callback on error, " + requestInformation.reqName + " requestId: " + callBack.id + "e=" + e.message, "ERROR", "ReqRes");
                            }
                        }
                        //noinspection JSUnresolvedVariable
                        evUtil.log("Error executing " + requestInformation.reqName + " requestId: " + callBack.id + "e=" + err.message, "ERROR", "ReqRes");
                    }
                }
            }
            return ret;
        }

        //------------------- Private methods ------------------------------//

        /**
         * Stores requests so we can later ask for them, can be set to a limited store by defaults on instantiation
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
        this.request = request;
        this.reply = reply;
        this.stopReplying = stopReplying;

    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.ReqRes = exports.ReqRes || ReqRes;
    }
    return ReqRes;
}));
