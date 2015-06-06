/**
 * LIMITATIONS:
 * 1) Only supports browsers which implements postMessage API and have native JSON implementation (IE8+, Chrome, FF, Safari, Opera, IOS, Opera Mini, Android)
 * 2) IE9-, FF & Opera Mini does not support MessageChannel and therefore we fallback to using basic postMessage.
 *    This makes the communication opened to any handler registered for messages on the same origin.
 * 3) All passDataByRef flags (in LPEventChannel) are obviously ignored
 * 4) In case the browser does not support passing object using postMessage (IE8+, Opera Mini), and no special serialize/deserialize methods are supplied to LPPostMessageCourier,
 *    All data is serialized using JSON.stringify/JSON.parse which means that Object data is limited to JSON which supports types like:
 *    strings, numbers, null, arrays, and objects (and does not allow circular references).
 *    Trying to serialize other types, will result in conversion to null (like Infinity or NaN) or to a string (Dates)
 *    that must be manually deserialized on the other side
 * 5) When Iframe is managed outside of LPPostMessageCourier (passed by reference to the constructor),
 *    a targetOrigin option is expected to be passed to the constructor, and a query parameter with the name "lphost" is expected on the iframe url (unless the LPPostMessageCourier
 *    at the iframe side, had also been initialized with a valid targetOrigin option)
 */
// TODO: Add Support for target management when there is a problem that requires re-initialization of the target
;(function (root, cacherRoot, circuitRoot, factory) {
    "use strict";

    root.Chronos = root.Chronos || {};
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageCourier", ["exports", "Chronos.PostMessageUtilities", "Chronos.Channels", "cacher", "CircuitBreaker", "Chronos.PostMessageChannel", "Chronos.PostMessagePromise", "Chronos.PostMessageMapper"], function () {
            if (!root.Chronos.PostMessageCourier) {
                factory(root, root.Chronos, root.Chronos.PostMessageUtilities, root.Chronos.Channels,
                    cacherRoot.Cacher, circuitRoot.CircuitBreaker,
                    root.Chronos.PostMessageChannel, root.Chronos.PostMessagePromise, root.Chronos.PostMessageMapper);
            }

            return root.Chronos.PostMessageCourier;
        });
        return;
    }
    //</amd>
    /**
     * @depend ../Channels.js
     * @depend ../../node_modules/circuit-breakerjs/src/CircuitBreaker.js
     * @depend ../../node_modules/cacherjs/src/cacher.js
     * @depend ./PostMessageUtilities.js
     * @depend ./PostMessageChannel.js
     * @depend ./PostMessagePromise.js
     * @depend ./PostMessageMapper.js
     */
    if ("object" !== typeof exports) {
        factory(root, root.Chronos, root.Chronos.PostMessageUtilities, root.Chronos.Channels,
            cacherRoot.Cacher,  circuitRoot.CircuitBreaker,
            root.Chronos.PostMessageChannel, root.Chronos.PostMessagePromise, root.Chronos.PostMessageMapper);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot,
    typeof CacherRoot === "undefined" ? this : CacherRoot,
    typeof CircuitRoot === "undefined" ? this : CircuitRoot,
    function (root, exports, PostMessageUtilities, Channels, Cacher, CircuitBreaker, PostMessageChannel, PostMessagePromise, PostMessageMapper) {
        "use strict";

        /*jshint validthis:true */
        var MESSAGE_PREFIX = "LPMSG_";
        var ACTION_TYPE = {
            TRIGGER: "trigger",
            COMMAND: "command",
            REQUEST: "request",
            RETURN: "return"
        };
        var DEFAULT_TIMEOUT = 30 * 1000;
        var DEFAULT_CONCURRENCY = 100;
        var DEFAULT_MESSURE_TIME = 30 * 1000;
        var DEFAULT_MESSURE_TOLERANCE = 30;
        var DEFAULT_MESSURE_CALIBRATION = 10;
        var CACHE_EVICTION_INTERVAL = 1000;

        /**
         * PostMessageCourier constructor
         * @constructor
         * @param {Object} options - the configuration options for the instance
         * @param {Object} options.target - the target iframe or iframe configuration
         * @param {String} [options.target.url] - the url to load
         * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @param {String} [options.target.style] - the CSS style to apply
         * @param {String} [options.target.style.width] width of iframe
         * @param {String} [options.target.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
         * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.target.context] - optional context for the callback
         * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded
         * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.onready.context] - optional context for the callback
         * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
         * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
         * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
         * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
         * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
         * @param {Function} onmessage - the handler for incoming messages
         * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
         * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
         * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
         * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
         * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
         * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
         * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
         *
         * @example
         * var courier = new Chronos.PostMessageCourier({
         *     target: {
         *         url: "http://localhost/chronosjs/debug/courier.frame.html",
         *         style: {
         *             width: "100px",
         *             height: "100px"
         *         }
         *     }
         * });
         */
        function PostMessageCourier(options) {
            // For forcing new keyword
            if (false === (this instanceof PostMessageCourier)) {
                return new PostMessageCourier(options);
            }

            this.initialize(options);
        }

        PostMessageCourier.prototype = (function () {
            /**
             * Method for initialization
             * @param {Object} options - the configuration options for the instance
             * @param {Object} options.target - the target iframe or iframe configuration
             * @param {String} [options.target.url] - the url to load
             * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
             * @param {String} [options.target.style] - the CSS style to apply
             * @param {String} [options.target.style.width] width of iframe
             * @param {String} [options.target.style.height] height of iframe
             *          .....
             * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
             * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded
             * @param {Object} [options.target.context] - optional context for the callback
             * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded
             * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
             * @param {Object} [options.onready.context] - optional context for the callback
             * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
             * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
             * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
             * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
             * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
             * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
             * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
             * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
             * @param {Function} onmessage - the handler for incoming messages
             * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
             * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
             * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
             * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
             * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
             * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
             * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
             */
            function initialize(options) {
                var mapping;
                var onmessage;
                var messureTime;

                if (!this.initialized) {
                    options = options || {};

                    this.useObjects = false === options.useObjects ? options.useObjects : _getUseObjectsUrlIndicator();
                    if ("undefined" === typeof this.useObjects) {
                        // Defaults to true
                        this.useObjects = true;
                    }
                    options.useObjects = this.useObjects;

                    // Define the serialize/deserialize methods to be used
                    if ("function" !== typeof options.serialize || "function" !== typeof options.deserialize) {
                        if (this.useObjects && PostMessageUtilities.hasPostMessageObjectsSupport()) {
                            this.serialize = _de$serializeDummy;
                            this.deserialize = _de$serializeDummy;
                        }
                        else {
                            this.serialize = PostMessageUtilities.stringify;
                            this.deserialize = JSON.parse;
                        }

                        options.serialize = this.serialize;
                        options.deserialize = this.deserialize;
                    }
                    else {
                        this.serialize = options.serialize;
                        this.deserialize = options.deserialize;
                    }

                    // Grab the event channel and initialize a new mapper
                    this.eventChannel = options.eventChannel || new Channels({
                            events: options.events,
                            commands: options.commands,
                            reqres: options.reqres
                        });
                    this.mapper = new PostMessageMapper(this.eventChannel);

                    // Bind the mapping method to the mapper
                    mapping = this.mapper.toEvent.bind(this.mapper);
                    // Create the message handler which uses the mapping method
                    onmessage = _createMessageHandler(mapping).bind(this);

                    // Initialize a message channel with the message handler
                    this.messageChannel = new PostMessageChannel(options, onmessage);

                    this.callbackCache = new Cacher({
                        max: PostMessageUtilities.parseNumber(options.maxConcurrency, DEFAULT_CONCURRENCY),
                        ttl: PostMessageUtilities.parseNumber(options.timeout, DEFAULT_TIMEOUT),
                        interval: CACHE_EVICTION_INTERVAL
                    });

                    messureTime = PostMessageUtilities.parseNumber(options.messureTime, DEFAULT_MESSURE_TIME);
                    this.circuit = new CircuitBreaker({
                        timeWindow: messureTime,
                        slidesNumber: Math.ceil(messureTime / 100),
                        tolerance: PostMessageUtilities.parseNumber(options.messureTolerance, DEFAULT_MESSURE_TOLERANCE),
                        calibration: PostMessageUtilities.parseNumber(options.messureCalibration, DEFAULT_MESSURE_CALIBRATION),
                        onopen: PostMessageUtilities.parseFunction(options.ondisconnect, true),
                        onclose: PostMessageUtilities.parseFunction(options.onreconnect, true)
                    });

                    // Dumb Proxy methods
                    this.once = this.eventChannel.once;
                    this.hasFiredEvents = this.eventChannel.hasFiredEvents;
                    this.bind = this.eventChannel.bind;
                    this.register = this.eventChannel.register;
                    this.unbind = this.eventChannel.unbind;
                    this.unregister = this.eventChannel.unregister;
                    this.hasFiredCommands = this.eventChannel.hasFiredCommands;
                    this.comply = this.eventChannel.comply;
                    this.stopComplying = this.eventChannel.stopComplying;
                    this.hasFiredReqres = this.eventChannel.hasFiredReqres;
                    this.reply = this.eventChannel.reply;
                    this.stopReplying = this.eventChannel.stopReplying;
                    this.initialized = true;
                }
            }

            /**
             * Method to get the member instance of the message channel
             * @returns {PostMessageChannel} the member message channel
             */
            function getMessageChannel() {
                return this.messageChannel;
            }

            /**
             * Method to get the member instance of the event channel
             * @returns {Events} the member event channel
             */
            function getEventChannel() {
                return this.eventChannel;
            }

            /**
             * Method to trigger event via post message
             * @link Chronos.Events#trigger
             * @param {Object|String} options - Configuration object or app name
             * @param {String} [options.eventName] - the name of the event triggered
             * @param {String} [options.appName] - optional specifies the identifier it is bound to
             * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
             * @param {Object} [options.data] - optional event parameters to be passed to the listeners
             * @param {String|Boolean} [evName] - the name of the event triggered || [noLocal] - optional boolean flag indicating whether to trigger the event on the local event channel too
             * @param {Object} [data] - optional event parameters to be passed to the listeners
             * @param {Boolean} [noLocal] - optional boolean flag indicating whether to trigger the event on the local event channel too
             * @returns {*}
             *
             * @example
             * courier.trigger({
             *     appName: "frame",
             *     eventName: "got_it",
             *     data: 2
             * });
             */
            function trigger() {
                if (!this.disposed) {
                    var args = Array.prototype.slice.apply(arguments);

                    // We are looking for a "noLocal" param which can only be second or forth
                    // And only if its value is true, we will not trigger the event on the local event channel
                    if (!((2 === arguments.length || 4 === arguments.length) &&
                        true === arguments[arguments.length - 1])) {
                        this.eventChannel.trigger.apply(this.eventChannel, args);
                    }

                    return _postMessage.call(this, args, ACTION_TYPE.TRIGGER);
                }
            }

            /**
             * Method to trigger a command via post message
             * @link Chronos.Commands#command
             * @param {Object|String} options - Configuration object or app name
             * @param {String} [options.cmdName] - the name of the command triggered
             * @param {String} [options.appName] - optional specifies the identifier it is bound to
             * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
             * @param {Object} [options.data] - optional event parameters to be passed to the listeners
             * @param {Function} [callback] - optional callback method to be triggered when the command had finished executing
             * @returns {*}
             *
             * @example
             * courier.command({
             *     appName: "frame",
             *     cmdName: "expect",
             *     data: data
             * }, function(err) {
             *     if (err) {
             *         console.log("Problem invoking command");
             *     }
             * });
             */
            function command() {
                if (!this.disposed) {
                    var args = Array.prototype.slice.apply(arguments);
                    return _postMessage.call(this, args, ACTION_TYPE.COMMAND);
                }
            }

            /**
             * Method to trigger a request via post message
             * @link Chronos.ReqRes#request
             * @param {Object|String} options - Configuration object or app name
             * @param {String} [options.reqName] - the name of the request triggered
             * @param {String} [options.appName] - optional specifies the identifier it is bound to
             * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
             * @param {Object} [options.data] - optional event parameters to be passed to the listeners
             * @param {Function} [callback] - optional callback method to be triggered when the command had finished executing
             * @return {*}
             *
             * @example
             * courier.request({
             *     appName: "iframe",
             *     reqName: "Ma Shlomha?",
             *     data: data
             * }, function(err, data) {
             *      if (err) {
             *          console.log("Problem invoking request");
	         *          return;
	         *      }
             *
             *      // Do Something with data
             * });
             */
            function request() {
                if (!this.disposed) {
                    var args = Array.prototype.slice.apply(arguments);
                    return _postMessage.call(this, args, ACTION_TYPE.REQUEST);
                }
            }

            /**
             * Method for disposing the object
             */
            function dispose() {
                if (!this.disposed) {
                    this.messageChannel.dispose();
                    this.messageChannel = void 0;
                    this.eventChannel = void 0;
                    this.mapper = void 0;
                    this.callbackCache = void 0;
                    this.circuit = void 0;
                    this.disposed = true;
                }
            }

            /**
             * Method to get url indication for using serialization/deserialization
             * @returns {Boolean} indication for serialization/deserialization usage
             * @private
             */
            function _getUseObjectsUrlIndicator() {
                var deserialize = PostMessageUtilities.getURLParameter("lpPMDeSerialize");

                if ("true" === deserialize) {
                    return false;
                }
            }

            /**
             * Just a dummy serialization/deserialization method for browsers supporting objects with postMessage API
             * @param {Object} object - the object to (NOT) serialize/deserialize.
             * @returns {Object} The same object
             */
            function _de$serializeDummy(object) {
                return object;
            }

            /**
             * Method for posting the message via the circuit breaker
             * @param {Array} args - the arguments for the message to be processed.
             * @param {String} name - name of type of command.
             * @private
             */
            function _postMessage(args, name) {
                return this.circuit.run(function (success, failure, timeout) {
                    var message = _prepare.call(this, args, name, timeout);

                    if (message) {
                        try {
                            var initiated = this.messageChannel.postMessage.call(this.messageChannel, message);

                            if (false === initiated) {
                                failure();
                            }
                            else {
                                success();
                            }
                        }
                        catch (ex) {
                            failure();
                        }
                    }
                    else {
                        // Cache is full, as a fail fast mechanism, we should not continue
                        failure();
                    }
                }.bind(this));
            }

            /**
             * Method for posting the returned message via the circuit breaker
             * @param {Object} message - the message to post.
             * @param {bject} [target] - optional target for post.
             * @private
             */
            function _returnMessage(message, target) {
                return this.circuit.run(function (success, failure) {
                    try {
                        var initiated = this.messageChannel.postMessage.call(this.messageChannel, message, target);

                        if (false === initiated) {
                            failure();
                        }
                        else {
                            success();
                        }
                    }
                    catch (ex) {
                        failure();
                    }
                }.bind(this));
            }

            /**
             * Method for preparing the message to be posted via the postmessage and caching the callback to be called if needed
             * @param {Array} args - the arguments to pass to the message mapper
             * @param {String} name - the action type name (trigger, command, request)
             * @param {Function} [ontimeout] - the ontimeout measurement handler
             * @returns {Function} handler function for messages
             * @private
             */
            function _prepare(args, name, ontimeout) {
                var method;
                var ttl;
                var id = PostMessageUtilities.createUniqueSequence(MESSAGE_PREFIX + name + PostMessageUtilities.SEQUENCE_FORMAT);

                args.unshift(id, name);

                if (_isTwoWay(name)) {
                    if (1 < args.length && "function" === typeof args[args.length - 1]) {
                        method = args.pop();
                    }
                    else if (2 < args.length && !isNaN(args[args.length - 1]) && "function" === typeof args[args.length - 2]) {
                        ttl = parseInt(args.pop(), 10);
                        method = args.pop();
                    }

                    if (method) {
                        if (!this.callbackCache.set(id, method, ttl, function (id, callback) {
                                ontimeout();
                                _handleTimeout.call(this, id, callback);
                            }.bind(this))) {
                            // Cache is full, as a fail fast mechanism, we will not continue
                            return void 0;
                        }
                    }
                }

                return this.mapper.toMessage.apply(this.mapper, args);
            }

            /**
             * Method for checking two way communication for action
             * @param {LPPostMessageCourier.ACTION_TYPE} action - the action type name
             * @returns {Boolean} flag to indicate whether the action is two way (had return call)
             * @private
             */
            function _isTwoWay(action) {
                return ACTION_TYPE.REQUEST === action || ACTION_TYPE.COMMAND === action;
            }

            /**
             * Method for handling timeout of a cached callback
             * @param {String} id - the id of the timed out callback
             * @param {Function} callback - the callback object from cache
             * @private
             */
            function _handleTimeout(id, callback) {
                // Handle timeout
                if (id && "function" === typeof callback) {
                    try {
                        callback.call(null, new Error("Callback: Operation Timeout!"));
                    }
                    catch (ex) {
                        PostMessageUtilities.log("Error while trying to handle the timeout using the callback", "ERROR", "PostMessageCourier");
                    }
                }
            }

            /**
             * Method for wrapping the handler of the postmessage for parsing
             * @param {Object} mapping - the handler for incoming messages to invoke which maps the message to event
             * @returns {Function} handler function for messages
             * @private
             */
            function _createMessageHandler(mapping) {
                return function handle(message) {
                    var handler;
                    var result;
                    var params;
                    var retMsg;
                    var id;
                    var name;
                    var args;
                    var callback;

                    if (message) {
                        id = message.method && message.method.id;
                        name = message.method && message.method.name;
                        args = message.method && message.method.args;

                        // In case the message is a return value from a request/response call
                        // It is marked as a "return" message and we need to call the supplied cached callback
                        if (ACTION_TYPE.RETURN === name) {
                            callback = this.callbackCache.get(id, true);
                            if ("function" === typeof callback) {
                                // First try to parse the first parameter in case the error is an object
                                if (args && args.length && args[0] && "Error" === args[0].type && "string" === typeof args[0].message) {
                                    args[0] = new Error(args[0].message);
                                }

                                try {
                                    callback.apply(null, args);
                                }
                                catch (ex) {
                                    PostMessageUtilities.log("Error while trying to handle the returned message from request/command", "ERROR", "PostMessageCourier");
                                }
                            }
                        }
                        else {
                            // Call the mapping method to receive the handling method on the event channel
                            // Invoke the handling method
                            try {
                                if (_isTwoWay(name)) {
                                    if (args.length) {
                                        args.push(function (err, result) {
                                            var error = err;

                                            // In case of Error Object, create a special object that can be parsed
                                            if (err instanceof Error) {
                                                error = {
                                                    type: "Error",
                                                    message: err.message
                                                };
                                            }

                                            // Call the mapping method to receive the message structure
                                            params = [id, ACTION_TYPE.RETURN, error];

                                            if (ACTION_TYPE.REQUEST === name) {
                                                params.push(result);
                                            }

                                            retMsg = this.mapper.toMessage.apply(this.mapper, params);

                                            // Post the message
                                            _returnMessage.call(this, retMsg, message.source);
                                        }.bind(this));
                                    }
                                }

                                handler = mapping(message);
                                result = handler && handler();
                            }
                            catch (ex) {
                                PostMessageUtilities.log("Error while trying to invoke the handler on the events channel", "ERROR", "PostMessageCourier");

                                if (_isTwoWay(name)) {
                                    params = [id, ACTION_TYPE.RETURN, {error: ex.toString()}];
                                    retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                    _returnMessage.call(this, retMsg, message.source);
                                }
                            }

                            // In case the method is two way and returned a result
                            if (_isTwoWay(name) && "undefined" !== typeof result) {
                                // If the result is async (promise) we need to defer the execution of the results data
                                if (("undefined" !== typeof Promise && result instanceof Promise) || result instanceof PostMessagePromise) {
                                    // Handle async using promises
                                    result.then(function (data) {
                                        params = [id, ACTION_TYPE.RETURN, null];

                                        if (ACTION_TYPE.REQUEST === name) {
                                            params.push(data);
                                        }

                                        retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                        _returnMessage.call(this, retMsg, message.source);
                                    }.bind(this), function (data) {
                                        params = [id, ACTION_TYPE.RETURN, data];

                                        retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                        _returnMessage.call(this, retMsg, message.source);
                                    }.bind(this));
                                }
                                else {
                                    if (result.error) {
                                        params = [id, ACTION_TYPE.RETURN, result];

                                        // Call the mapping method to receive the message structure
                                        retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                    }
                                    else {
                                        params = [id, ACTION_TYPE.RETURN, null];

                                        if (ACTION_TYPE.REQUEST === name) {
                                            params.push(result);
                                        }

                                        // Call the mapping method to receive the message structure
                                        retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                    }

                                    // Post the message
                                    _returnMessage.call(this, retMsg, message.source);
                                }
                            }
                        }
                    }
                };
            }

            return {
                initialize: initialize,
                getMessageChannel: getMessageChannel,
                getEventChannel: getEventChannel,
                trigger: trigger,
                publish: trigger,
                command: command,
                request: request,
                dispose: dispose
            };
        }());

        // attach properties to the exports object to define
        // the exported module properties.
        exports.PostMessageCourier = exports.PostMessageCourier || PostMessageCourier;
    }));
