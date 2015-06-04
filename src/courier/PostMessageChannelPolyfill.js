;(function (root, chronosRoot, factory) {
    "use strict";

    chronosRoot.Chronos = chronosRoot.Chronos || {};
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageChannelPolyfill", ["exports", "Chronos.PostMessageUtilities"], function () {
            if (!chronosRoot.Chronos.PostMessageChannelPolyfill) {
                factory(root, chronosRoot.Chronos, chronosRoot.Chronos.PostMessageUtilities);
            }

            return chronosRoot.Chronos.PostMessageChannelPolyfill;
        });
        return;
    }
    //</amd>
    if ("object" !== typeof exports) {
        /**
         * @depend ./PostMessageUtilities.js
         */
        factory(root, chronosRoot.Chronos, chronosRoot.Chronos.PostMessageUtilities);
    }
}(this, typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, PostMessageUtilities) {
    "use strict";

    /*jshint validthis:true */
    var PORT_PREFIX = "LPPort_";

    /**
     * PostMessageChannelPolyfill constructor
     * @constructor
     * @param {Object} target - The DOM node of the target iframe or window
     * @param {Object} [options] the configuration options for the instance
     * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
     * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
     */
    function PostMessageChannelPolyfill(target, options) {
        // For forcing new keyword
        if (false === (this instanceof PostMessageChannelPolyfill)) {
            return new PostMessageChannelPolyfill(target, options);
        }

        this.initialize(target, options);
    }

    PostMessageChannelPolyfill.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} target - The DOM node of the target iframe or window
         * @param {Object} [options] the configuration options for the instance
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         */
        function initialize(target, options) {
            if (!this.initialized) {
                options = options || {};

                this.target = target || root.top;
                this.hosted = this.target === root || this.target === root.top;
                this.portId = PostMessageUtilities.createUniqueSequence(PORT_PREFIX + PostMessageUtilities.SEQUENCE_FORMAT);
                this.serialize = PostMessageUtilities.parseFunction(options.serialize, PostMessageUtilities.stringify);
                this.deserialize = PostMessageUtilities.parseFunction(options.deserialize, JSON.parse);

                this.initialized = true;
            }
        }

        /**
         * Method for posting the message to the target
         * @param {Object} message - the message to be post
         */
        function postMessage(message) {
            var wrapped;
            var parsed;
            var origin = _getOrigin.call(this);
            var receiver = this.target;

            if (message) {
                try {
                    if (!this.hosted) {
                        receiver = this.target.contentWindow;
                    }
                    wrapped = _wrapMessage.call(this, message);
                    parsed = this.serialize(wrapped);
                    receiver.postMessage(parsed, origin);
                }
                catch(ex) {
                    PostMessageUtilities.log("Error while trying to post the message", "ERROR", "PostMessageChannelPolyfill");
                    return false;
                }
            }
        }

        /**
         * Method for receiving the incoming message
         * @param {Object} event - the event object on message
         */
        function receive(event) {
            var message;
            if ("function" === typeof this.onmessage) {
                message = _unwrapMessage.call(this, event);
                return this.onmessage(message);
            }
        }

        /**
         * Method for getting the origin to be used
         * @private
         */
        function _getOrigin() {
            if (!this.origin) {
                this.origin = PostMessageUtilities.resolveOrigin(this.target);
            }

            return this.origin;
        }

        /**
         * Method for wrapping the outgoing message with port and id
         * @param {Object} message - the message to be wrapped
         * @returns {Object} the wrapped message
         * @private
         */
        function _wrapMessage(message) {
            return {
                port: this.portId,
                message: message
            };
        }

        /**
         * Method for unwrapping the incoming message from port and id
         * @param {Object} event - the event object on message
         * @returns {Object} the unwrapped message
         * @private
         */
        function _unwrapMessage(event) {
            var msgObject;

            if (event && event.data) {
                try {
                    msgObject = this.deserialize(event.data);

                    if (msgObject.port && 0 === msgObject.port.indexOf(PORT_PREFIX)) {
                        return {
                            origin: event.origin,
                            data: msgObject.message
                        };
                    }
                }
                catch (ex) {
                    PostMessageUtilities.log("Error while trying to deserialize the message", "ERROR", "PostMessageChannelPolyfill");
                }
            }

            return msgObject || event;
        }

        return {
            initialize: initialize,
            postMessage: postMessage,
            receive: receive
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.PostMessageChannelPolyfill = exports.PostMessageChannelPolyfill || PostMessageChannelPolyfill;
}));
