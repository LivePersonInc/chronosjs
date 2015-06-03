;(function (root, factory) {
    "use strict";

    root.Chronos = root.Chronos || {};

    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageChannel", ["exports", "Chronos.PostMessageUtilities", "Chronos.PostMessageChannelPolyfill"], function () {
            if (!root.Chronos.PostMessageChannel) {
                factory(root, root.Chronos, root.Chronos.PostMessageUtilities, root.Chronos.PostMessageChannelPolyfill);
            }

            return root.Chronos.PostMessageChannel;
        });
    }
    else if ("object" !== typeof exports) {
        /**
         * @depend ./PostMessageUtilities.js
         * @depend ./PostMessageChannelPolyfill.js
         */
        factory(root, root.Chronos, root.Chronos.PostMessageUtilities, root.Chronos.PostMessageChannelPolyfill);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, PostMessageUtilities, PostMessageChannelPolyfill) {
    "use strict";

    /*jshint validthis:true */
    var IFRAME_PREFIX = "LPFRM";
    var TOKEN_PREFIX = "LPTKN";
    var HANSHAKE_PREFIX = "HNDSK";
    var DEFAULT_CONCURRENCY = 100;
    var DEFAULT_HANDSHAKE_RETRY_INTERVAL = 5000;
    var DEFAULT_HANDSHAKE_RETRY_ATTEMPTS = 3;
    var DEFAULT_BODY_LOAD_DELAY = 100;

    /**
     * PostMessageChannel constructor
     * @constructor
     * @param {Object} options the configuration options for the instance
     * @param {Object} options.target - the target iframe or iframe configuration
     * @param {String} [options.target.url] - the url to load
     * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
     * @param {String} [options.target.style] - the CSS style to apply
     * @param {String} [options.target.style.width] width of iframe
     * @param {String} [options.target.style.height] height of iframe
     *          .....
     * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
     * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded,
     * @param {Object} [options.target.context] - optional context for the callback
     * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded {
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
     */
    function PostMessageChannel(options, onmessage) {
        // For forcing new keyword
        if (false === (this instanceof PostMessageChannel)) {
            return new PostMessageChannel(options, onmessage);
        }

        this.initialize(options, onmessage);
    }

    PostMessageChannel.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} options the configuration options for the instance
         * @param {Object} options.target - the target iframe or iframe configuration
         * @param {String} [options.target.url] - the url to load
         * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @param {String} [options.target.style] - the CSS style to apply
         * @param {String} [options.target.style.width] width of iframe
         * @param {String} [options.target.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
         * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded,
         * @param {Object} [options.target.context] - optional context for the callback
         * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded {
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
         */
        function initialize(options, onmessage) {
            var handleMessage;
            var handler;
            var initiated;

            if (!this.initialized) {
                this.hosted = false;
                this.messageQueue = [];

                options = options || {};
                handler = _initParameters.call(this, options, onmessage);
                if (!_isNativeMessageChannelSupported.call(this)) {
                    this.receiver = new PostMessageChannelPolyfill(this.target, {
                        serialize: this.serialize,
                        deserialize: this.deserialize
                    });
                    this.receiver.onmessage = handler;
                }

                if (this.hosted || !_isNativeMessageChannelSupported.call(this)) {
                    handleMessage = _getHandleMessage(handler).bind(this);
                    this.removeListener = PostMessageUtilities.addEventListener(root, "message", handleMessage);
                }
                else if (_isNativeMessageChannelSupported.call(this)) {
                    this.channelFactory();
                }

                if (this.target && !this.loading && !this.ready) {
                    try {
                        initiated = _handshake.call(this);
                    }
                    catch(ex) {
                        initiated = false;
                    }

                    if (!initiated) {
                        // Fallback to pure postMessage
                        this.channel = false;
                        this.receiver = new PostMessageChannelPolyfill(this.target, {
                            serialize: this.serialize,
                            deserialize: this.deserialize
                        });
                        this.receiver.onmessage = handler;

                        if (!this.hosted) {
                            handleMessage = _getHandleMessage(handler).bind(this);
                            this.removeListener = PostMessageUtilities.addEventListener(root, "message", handleMessage);
                        }

                        _handshake.call(this);
                    }

                    this.handshakeAttempts--;

                    PostMessageUtilities.delay(function() {
                        if (!this.hosted && !this.ready) {
                            _addLoadHandler.call(this, this.target);
                            this.timer = PostMessageUtilities.delay(_handshake.bind(this, this.handshakeInterval), this.handshakeInterval);
                        }
                    }.bind(this));
                }

                this.initialized = true;
            }
        }

        /**
         * Method for disposing the object
         */
        function dispose() {
            if (!this.disposed) {
                if (this.removeListener) {
                    this.removeListener.call(this);
                    this.removeListener = void 0;
                }

                if (this.targetUrl && this.target || this.removeDispose) {
                    try {
                        if (this.targetContainer) {
                            this.targetContainer.removeChild(this.target);
                        }
                        else {
                            document.body.removeChild(this.target);
                        }
                    }
                    catch(ex) {
                        PostMessageUtilities.log("Error while trying to remove the iframe from the container", "ERROR", "PostMessageChannel");
                    }
                }

                this.messageQueue.length = 0;
                this.messageQueue = void 0;
                this.channel = void 0;
                this.onready = void 0;
                this.disposed = true;
            }
        }

        /**
         * Method to post the message to the target
         * @param {Object} message - the message to post
         * @param {Object} [target] - optional target for post
         * @param {Boolean} [force = false] - force post even if not ready
         */
        function postMessage(message, target, force) {
            var consumer;
            var parsed;

            if (!this.disposed) {
                try {
                    if (message) {
                        if (this.ready || force) {
                            // Post the message
                            consumer = target || this.receiver;
                            parsed = _prepareMessage.call(this, message);
                            consumer.postMessage(parsed);
                            return true;
                        }
                        else if (this.maxConcurrency >= this.messageQueue.length) {
                            // Need to delay/queue messages till target is ready
                            this.messageQueue.push(message);
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                }
                catch(ex) {
                    PostMessageUtilities.log("Error while trying to post the message", "ERROR", "PostMessageChannel");
                    return false;
                }
            }
        }

        function _initParameters(options, onmessage) {
            var handler;
            _simpleParametersInit.call(this, options);
            handler = _wrapMessageHandler(onmessage).bind(this);

            this.channelFactory = _hookupMessageChannel.call(this, handler);

            // No Iframe - We are inside it (hosted) initialized by the host/container
            if (!options.target || (options.target !== root || options.target === root.top) && "undefined" !== typeof Window && options.target instanceof Window) {
                this.hosted = true;
                this.target = options.target || root.top;
            }
            else if (options.target.contentWindow) { // We've got a reference to an "external" iframe
                this.target = options.target;
            }
            else if (options.target.url) { // We've got the needed configuration for creating an iframe
                this.targetUrl = options.target.url;
                this.targetOrigin = this.targetOrigin || PostMessageUtilities.getHost(options.target.url);
            }

            if (!this.hosted) {
                this.token = PostMessageUtilities.createUniqueSequence(TOKEN_PREFIX + PostMessageUtilities.SEQUENCE_FORMAT);
            }

            if (this.targetUrl) { // We've got the needed configuration for creating an iframe
                this.loading = true;
                this.targetContainer = options.target.container || document.body;
                this.target = _createIFrame.call(this, options.target, this.targetContainer);
            }
            return handler;
        }

        function _simpleParametersInit(options) {
            this.serialize = PostMessageUtilities.parseFunction(options.serialize, PostMessageUtilities.stringify);
            this.deserialize = PostMessageUtilities.parseFunction(options.deserialize, JSON.parse);
            this.targetOrigin = options.targetOrigin;
            this.maxConcurrency = PostMessageUtilities.parseNumber(options.maxConcurrency, DEFAULT_CONCURRENCY);
            this.handshakeInterval = PostMessageUtilities.parseNumber(options.handshakeInterval, DEFAULT_HANDSHAKE_RETRY_INTERVAL);
            this.handshakeAttempts = PostMessageUtilities.parseNumber(options.handshakeAttempts, DEFAULT_HANDSHAKE_RETRY_ATTEMPTS);
            this.hostParam = options.hostParam;
            this.channel = "undefined" !== typeof options.channel ? options.channel : _getChannelUrlIndicator();
            this.useObjects = options.useObjects;
            this.onready = _wrapReadyCallback(options.onready, options.target).bind(this);
            this.removeDispose = options.removeDispose;
        }

        /**
         * Method for handling the initial handler binding for needed event listeners
         * @param {Object} event - the event object on message
         */
        function _getHandleMessage(handler) {
            return function _handleMessage(event) {
                var handshake;
                var previous;

                if (event.ports && 0 < event.ports.length) {
                    this.receiver = event.ports[0];

                    if (_isHandshake.call(this, event)) {
                        if (!this.token) {
                            this.token = event.data;
                        }
                    }

                    this.receiver.start();

                    // Swap Listeners
                    previous = this.removeListener.bind(this);
                    this.removeListener = PostMessageUtilities.addEventListener(this.receiver, "message", handler);
                    previous();

                    if (this.hosted && !this.ready) {
                        handshake = true;
                    }
                }
                else {
                    if (_isHandshake.call(this, event)) {
                        if (!this.token) {
                            this.token = event.data;
                        }

                        if (this.hosted && !this.ready) {
                            handshake = true;
                        }
                    }
                    else if (this.token) {
                        this.receiver.receive.call(this.receiver, event);
                    }
                }

                if (handshake) {
                    this.receiver.postMessage(HANSHAKE_PREFIX + this.token);
                    _onReady.call(this);
                }
            };
        }

        /**
         * Method to prepare the message for posting to the target
         * @param message
         * @returns {*}
         * @private
         */
        function _prepareMessage(message) {
            _tokenize.call(this, message);
            return this.serialize(message);
        }

        /**
         * Method to get url indication for using message channel or polyfill
         * @returns {Boolean} indication for message channel usage
         * @private
         */
        function _getChannelUrlIndicator() {
            if ("true" === PostMessageUtilities.getURLParameter("lpPMCPolyfill")) {
                return false;
            }
        }

        /**
         * Method to create and hookup message channel factory for further use
         * @param {Function} onmessage - the message handler to be used with the channel
         * @private
         */
        function _hookupMessageChannel(onmessage) {
            return function() {
                this.channel = new MessageChannel();
                this.receiver = this.channel.port1;
                this.dispatcher = this.channel.port2;
                this.receiver.onmessage = onmessage;
                this.neutered = false;
            }.bind(this);
        }

        /**
         * Method for applying the token if any on the message
         * @param {Object} message - the message to be tokenize
         * @private
         */
        function _tokenize(message) {
            if (this.token) {
                message.token = this.token;
            }
        }

        /**
         * Method for applying the token if any on the message
         * @param {Object} message - the message to be tokenize
         * @private
         */
        function _validateToken(message) {
            return (message && message.token === this.token);
        }

        /**
         * Method to validate whether an event is for handshake
         * @param {Object} event - the event object on message
         * @private
         */
        function _isHandshake(event) {
            return (event && event.data && "string" === typeof event.data && (0 === event.data.indexOf(TOKEN_PREFIX) || (HANSHAKE_PREFIX + this.token) === event.data));
        }

        /**
         * Method for wrapping the callback of iframe ready
         * @param {Function} [onready] - the handler for iframe ready
         * @param {Object} [target] - the target iframe configuration
         * @returns {Function} handler function for messages
         * @private
         */
        function _wrapReadyCallback(onready, target) {
            return function callback(err) {
                if (target && "function" === typeof target.callback) {
                    target.callback.call(target.context, err, this.target);
                }
                if (onready) {
                    if ("function" === typeof onready) {
                        onready(err, this.target);
                    }
                    else if ("function" === typeof onready.callback) {
                        onready.callback.call(onready.context, err, this.target);
                    }
                }
            };
        }

        /**
         * Method for wrapping the handler of the postmessage for parsing
         * @param {Function} onmessage - the handler for incoming messages to invoke
         * @returns {Function} handler function for messages
         * @private
         */
        function _wrapMessageHandler(onmessage) {
            return function handle(message) {
                var msgObject;

                if (!message.origin || "*" === message.origin ||  this.targetOrigin === message.origin) {
                    if (_isHandshake.call(this, message) && !this.hosted && !this.ready) {
                        _onReady.call(this);
                    }
                    else {
                        try {
                            msgObject = this.deserialize(message.data);

                            if (_validateToken.call(this, msgObject)) {
                                return onmessage && onmessage(msgObject);
                            }
                        }
                        catch (ex) {
                            msgObject = message.data || message;
                            PostMessageUtilities.log("Error while trying to handle the message", "ERROR", "PostMessageChannel");
                        }

                        return msgObject || message;
                    }
                }
            };
        }

        /**
         * Method to check whether the browser supports MessageChannel natively
         * @returns {Boolean} support flag
         * @private
         */
        function _isNativeMessageChannelSupported() {
            return false !== this.channel && "undefined" !== typeof MessageChannel && "undefined" !== typeof MessagePort;
        }

        /**
         * Method to hookup the initial "handshake" between the two parties (window and iframe) So they can start their communication
         * @param {Number} retry - retry in milliseconds
         * @returns {Boolean} indication if handshake initiated
         * @private
         */
        function _handshake(retry) {
            if (this.timer) {
                clearTimeout(this.timer);
            }

            if (!this.ready) {
                if (!_isNativeMessageChannelSupported.call(this)) {
                    this.targetOrigin = this.targetOrigin || PostMessageUtilities.resolveOrigin(this.target) || "*";
                }

                if (!this.hosted) {
                    if (_isNativeMessageChannelSupported.call(this)) {
                        try {
                            if (this.neutered) {
                                this.channelFactory();
                            }
                            this.target.contentWindow.postMessage(this.token, this.targetOrigin, [ this.dispatcher ]);
                            this.neutered = true;
                        }
                        catch(ex) {
                            return false;
                        }
                    }
                    else {
                        this.target.contentWindow.postMessage(this.token, this.targetOrigin);
                    }
                }
            }

            if (!this.ready && retry) {
                if (0 < this.handshakeAttempts) {
                    this.handshakeAttempts--;
                    this.timer = PostMessageUtilities.delay(_handshake.bind(this, retry), retry);
                }
                else {
                    this.onready(new Error("Loading: Operation Timeout!"));
                }
            }

            return true;
        }

        /**
         * Method to mark ready, and process queued/waiting messages if any
         * @private
         */
        function _onReady() {
            if (!this.ready) {
                this.ready = true;

                // Process queued messages if any
                if (this.messageQueue && this.messageQueue.length) {
                    PostMessageUtilities.delay(function() {
                        var message;
                        var parsed;

                        if (this.ready) {
                            while (this.messageQueue && this.messageQueue.length) {
                                message = this.messageQueue.shift();
                                try {
                                    parsed = _prepareMessage.call(this, message);
                                    this.receiver.postMessage(parsed);
                                }
                                catch(ex) {
                                    PostMessageUtilities.log("Error while trying to post the message from queue", "ERROR", "PostMessageChannel");
                                }
                            }

                            // Invoke the callback for ready
                            this.onready();
                        }
                    }.bind(this));
                }
                else {
                    // Invoke the callback for ready
                    this.onready();
                }
            }
        }

        /**
         * Method to enable running a callback once the document body is ready
         * @param {Object} [options] Configuration options
         * @param {Function} options.onready - the callback to run when ready
         * @param {Object} [options.doc = root.document] - document to refer to
         * @param {Number} [options.delay = 0] - milliseconds to delay the execution
         * @private
         */
        function _waitForBody(options) {
            options = options || {};
            var onready = options.onready;
            var doc = options.doc || root.document;
            var delay = options.delay;

            function _ready() {
                if (doc.body) {
                    onready();
                }
                else {
                    PostMessageUtilities.delay(_ready, delay || DEFAULT_BODY_LOAD_DELAY);
                }
            }

            PostMessageUtilities.delay(_ready, delay || false);
        }

        /**
         * Creates an iFrame in memory and sets the default attributes except the actual URL
         * Does not attach to DOM at this point
         * @param {Object} options a passed in configuration options
         * @param {String} options.url - the url to load,
         * @param {String} [options.style] - the CSS style to apply
         * @param {String} [options.style.width] width of iframe
         * @param {String} [options.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true),
         * @param {Function} [options.callback] - a callback to invoke after the iframe had been loaded,
         * @param {Object} [options.context] - optional context for the callback
         * @param {Object} [container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @returns {Element} the attached iFrame element
         * @private
         */
        function _createIFrame(options, container) {
            var frame = document.createElement("IFRAME");
            var name = PostMessageUtilities.createUniqueSequence(IFRAME_PREFIX + PostMessageUtilities.SEQUENCE_FORMAT);
            var delay = options.delayLoad;

            frame.setAttribute("id", name);
            frame.setAttribute("name", name);
            frame.setAttribute("tabindex", "-1");       // To prevent it getting focus when tabbing through the page
            frame.setAttribute("aria-hidden", "true");  // To prevent it being picked up by screen-readers
            frame.setAttribute("title", "");            // Adding an empty title at AT&Ts insistence
            frame.setAttribute("role", "presentation"); // Adding a presentation role http://yahoodevelopers.tumblr.com/post/59489724815/easy-fixes-to-common-accessibility-problems
            frame.setAttribute("allowTransparency", "true");

            if (options.style) {
                for (var attr in options.style) {
                    if (options.style.hasOwnProperty(attr)) {
                        frame.style[attr] = options.style[attr];
                    }
                }
            }
            else {
                frame.style.width = "0px";
                frame.style.height = "0px";
                frame.style.position = "absolute";
                frame.style.top = "-1000px";
                frame.style.left = "-1000px";
            }

            // Append and hookup after load
            _waitForBody({
                delay: delay,
                onready: function() {
                    (container || document.body).appendChild(frame);
                    _addLoadHandler.call(this, frame);
                    _setIFrameLocation.call(this, frame, options.url, (false !== options.bust));
                }.bind(this)
            });

            return frame;
        }

        /**
         * Add load handler for the iframe to make sure it is loaded
         * @param {Object} frame - the actual DOM iframe
         * @private
         */
        function _addLoadHandler(frame) {
            PostMessageUtilities.addEventListener(frame, "load", function() {
                this.loading = false;

                _handshake.call(this, this.handshakeInterval);
            }.bind(this));
        }

        /**
         * Sets the iFrame location using a cache bust mechanism,
         * making sure the iFrame is actually loaded and not from cache
         * @param {Object} frame - the iframe DOM object
         * @param {String} src - the source url for the iframe
         * @param {Boolean} bust - flag to indicate usage of cache buster when loading the iframe
         * @private
         */
        function _setIFrameLocation(frame, src, bust){
            src += (0 < src.indexOf("?") ? "&" : "?");

            if (bust) {
                src += "bust=";
                src += (new Date()).getTime() + "&";
            }

            src += ((this.hostParam ? "hostParam=" + this.hostParam + "&" + this.hostParam + "=" : "lpHost=") + encodeURIComponent(PostMessageUtilities.getHost(void 0, frame, true)));

            if (!_isNativeMessageChannelSupported.call(this)) {
                src += "&lpPMCPolyfill=true";
            }

            if (false === this.useObjects) {
                src += "&lpPMDeSerialize=true";
            }

            frame.setAttribute("src", src);
        }

        return {
            initialize: initialize,
            postMessage: postMessage,
            dispose: dispose
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.PostMessageChannel = PostMessageChannel;
}));
