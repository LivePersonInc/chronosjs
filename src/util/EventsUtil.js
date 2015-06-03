;(function (root, factory) {
    "use strict";

    if ("function" === typeof define && define.amd) {
        root.Chronos = root.Chronos || {};
        // AMD. Register as an anonymous module.
        define("Chronos.EventsUtil", ["exports"], function () {
            if (!root.Chronos.EventsUtil) {
                factory(root, root.Chronos);
            }

            return root.Chronos.EventsUtil;
        });
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports);
    }
    else {
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports) {
    "use strict";

    function getListeners(lstnrs, eventName, appName) {
        var callBacks = [];
        if (lstnrs[eventName] && lstnrs[eventName].length) {
            for (var i = 0; i < lstnrs[eventName].length; i++) {
                if ((!appName || "*" === lstnrs[eventName][i].appName) ||//generic event // &&
                    lstnrs[eventName][i].appName === appName) {//Specific events for a named instance
                    callBacks.push(lstnrs[eventName][i]);
                }
            }
        }
        if (lstnrs["*"]) {
            for (var k = 0; k < lstnrs["*"].length; k++) {
                if ((!appName || "*" === lstnrs["*"][k].appName) ||//generic event // &&
                    lstnrs["*"][k].appName === appName) {//Specific events for a named instance
                    callBacks.push(lstnrs["*"][k]);
                }
            }
        }
        return callBacks;
    }

    function log(msg, level, app) {
        if (root && "function" === typeof root.log) {
            root.log(msg, level, app);
        }
    }

    /**
     * var eventObj = {
     *   unbindObj: unbindObj,
     *   attrName: "eventName",
     *   loggerName: "Events",
     *   lstnrs: {}
     * };
     */
    function unbind(eventObj) {
        var cmdName = eventObj.unbindObj[eventObj.attrName];
        var unBound = false;
        var updatedListeners;

        if (!eventObj.unbindObj) {
            log("CMD listen id not spec for unbind", "ERROR", eventObj.loggerName);
            return null;
        }

        if (typeof eventObj.unbindObj === "string") {//Data is of type commandId
            return _unregister(eventObj.lstnrs, eventObj.unbindObj);
        }
        else if (!eventObj.unbindObj.func && !eventObj.unbindObj.context && !eventObj.unbindObj.appName) {//No data passed in to help us find unbind
            return false;
        }

        var listeners = eventObj.lstnrs;
        if (cmdName) {
            listeners = {};
            listeners[cmdName] = eventObj.lstnrs[cmdName];
        }
        for (var key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                if (listeners[key] && listeners[key].length) {
                    updatedListeners = _unbind(listeners[key], eventObj.unbindObj.func, eventObj.unbindObj.context, eventObj.unbindObj.appName);
                    if (updatedListeners.length !== listeners[key].length) {
                        eventObj.lstnrs[key] = updatedListeners;
                        unBound = true;
                    }
                }
            }
        }
        return unBound;
    }

    /**
     * Clones objects and properties (everything except functions)
     * @param cloneObj - the object we want to clone
     * @return {Object}
     */
    function cloneEventData(cloneObj) {
        var resultObj = {};
        if (cloneObj.constructor === Object) {//If this is an object
            for (var key in cloneObj) {
                //noinspection JSUnfilteredForInLoop
                if (cloneObj.hasOwnProperty(key) && cloneObj[key] !== null && cloneObj[key] !== undefined) {//Make sure we have some data that's object specific
                    //noinspection JSUnfilteredForInLoop
                    if (typeof cloneObj[key] === "object" && cloneObj[key].constructor !== Array) {
                        //noinspection JSUnfilteredForInLoop
                        resultObj[key] = cloneEventData(cloneObj[key]);
                    }
                    else { //noinspection JSUnfilteredForInLoop
                        if (cloneObj[key].constructor === Array) {
                            //noinspection JSUnfilteredForInLoop
                            resultObj[key] = cloneObj[key].slice(0) || [];
                        }
                        else { //noinspection JSUnfilteredForInLoop
                            if (typeof cloneObj[key] !== "function") {
                                //noinspection JSUnfilteredForInLoop
                                resultObj[key] = cloneObj[key] !== null && cloneObj[key] !== undefined ? cloneObj[key] : "";
                            }
                        }
                    }
                }
            }
        } else {//Return copy of Array or primitive type in case of no Object
            if (cloneObj.constructor === Array) {
                resultObj = cloneObj.slice(0) || [];
            }
            else if (typeof cloneObj !== "function") {
                resultObj = cloneObj;
            }
        }
        return resultObj;
    }

    function hasFired(fired, app, evName) {
        if ((typeof (evName) === "undefined" || evName === "*") && app === "*") {
            return fired;
        }
        var firedEvents = [];
        for (var n = 0; n < fired.length; n++) {
            if (fired[n].eventName === evName || evName === "*") {
                if ((app && app === fired[n].appName) ||//For events specific to a caller
                    (!fired[n].appName || fired[n].appName === "*") || app === "*") { //For all events that don't have a specific appName
                    firedEvents.push(fired[n]);
                }
            }
        }
        return firedEvents;
    }

    /**
     * Stores events so we can later ask for them, can be set to a limited store by defaults on instantiation
     * @param data = {
     *  triggerData: triggerData,
     *  eventBufferLimit: eventBufferLimit,
     *  attrName: attrName,
     *  fired: fired,
     *  index: index
     * }
     */
    function storeEventData(data) {
        //noinspection JSUnresolvedVariable
        if (data.eventBufferLimit === 0 || (data.triggerData.data && !!data.triggerData.data.doNotStore)) {//No events should be stored or this event should not be stored
            data = null;
            return;
        }
        var firedEventData = {eventName: data.triggerData[data.attrName], appName: data.triggerData.appName};
        firedEventData.data = data.triggerData.passDataByRef ? data.triggerData.data : cloneEventData(data.triggerData.data);
        if (data.eventBufferLimit > 0) {//Limiting Array size to what was decided on creation
            if (data.index >= data.eventBufferLimit) {
                data.index = 0;
            }
            data.fired[data.index] = firedEventData;
            data.index++;
        }
        else {//All events should be stored
            data.fired.push(firedEventData);
        }
        data = null;
    }

    function _unregister(lstnrs, eventId) {
        var unBound = false;
        if (!eventId) {
            log("Ev listen id not spec for unregister", "ERROR", "Events");
            return null;
        }
        for (var eventName in lstnrs) {
            if (lstnrs.hasOwnProperty(eventName)) {
                for (var i = 0; i < lstnrs[eventName].length; i++) {
                    if (lstnrs[eventName][i].id == eventId) {
                        lstnrs[eventName].splice(i, 1);
                        log("Ev listen=" + eventId + " and name=" + eventName + " unregister", "DEBUG", "Events");
                        unBound = true;
                        break;
                    }
                }
            }
        }
        if (!unBound) {
            log("Ev listen not found " + eventId + " unregister", "DEBUG", "Events");
        }
        return unBound;
    }

    /**
     * The actual unbinding of the callbacks from the events mechanism
     * @param listeners - the array of listeners that match this query
     * @param func - the function we want to unbind
     * @param context - the context we want to unbind
     * @param appName - the specific appName we want to unbind (UID)
     * @return {Array} - the new array of listeners we want to use
     */
    function _unbind(listeners, func, context, appName) {
        var newListeners = [];
        if (listeners && listeners.length) {
            for (var i = 0; i < listeners.length; i++) {
                try {
                    var sameFunc = (!context && listeners[i].func === func);//If this fits the function and no context was passed
                    var sameContext = (!func && context && listeners[i].context === context);//If this fits the context and no function was passed
                    var sameFuncAndContext = (func && context && listeners[i].func === func && listeners[i].context === context);//if this fits the function and context
                    var hasSameAppName = (appName && appName === listeners[i].appName);//If we're unbinding a specific appName
                    var hasGlobalAppName = (listeners[i].appName === "*");//If we're unbinding a general appName
                    if ((sameFunc || sameContext || sameFuncAndContext)) {
                        if (hasSameAppName || hasGlobalAppName) {
                            continue;//This is a callback to remove
                        }
                        if (sameContext) {
                            continue;
                        }
                    }
                    else if (!func && !context && hasSameAppName) {//This should only happen if nothing but an appName was passed in
                        continue;//This is a callback to remove
                    }
                    newListeners.push(listeners[i]);//This is callbacks we keep
                } catch (err) {
                    log("Error in unbind e=" + err.message, "ERROR", "Events");
                }
            }
        }
        return newListeners;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.EventsUtil = exports.EventsUtil || {
        getListeners: getListeners,
        log: log,
        unbind: unbind,
        hasFired: hasFired,
        cloneEventData: cloneEventData,
        storeEventData: storeEventData
    };
}));
