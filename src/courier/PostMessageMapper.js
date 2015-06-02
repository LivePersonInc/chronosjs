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
        root.Chronos = root.Chronos || {};
        return root.Chronos;
    }
    var define  = window.define;

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageMapper", ["exports", "Chronos.PostMessageUtilities"], function () {
            if (!namespace.PostMessageMapper) {
                factory(root, namespace, namespace.PostMessageUtilities);
            }

            return namespace.PostMessageMapper;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.PostMessageMapper) {
            factory(root, namespace, namespace.PostMessageUtilities);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        /**
         * @depend ./PostMessageUtilities.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.PostMessageUtilities);
    }
}(this, function (root, exports, PostMessageUtilities) {
    "use strict";

    /*jshint validthis:true */

    /**
     * PostMessageMapper constructor
     * @constructor
     * @param {LPEventChannel} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the LPEventChannel API)
     */
    function PostMessageMapper(eventChannel) {
        // For forcing new keyword
        if (false === (this instanceof PostMessageMapper)) {
            return new PostMessageMapper(eventChannel);
        }

        this.initialize(eventChannel);
    }

    PostMessageMapper.prototype = (function () {
        /**
         * Method for initialization
         * @param {LPPostMessageChannel} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the LPEventChannel API)
         */
        function initialize(eventChannel) {
            if (!this.initialized) {
                this.eventChannel = eventChannel;

                this.initialized = true;
            }
        }

        /**
         * Method mapping the message to the correct event on the event channel and invoking it
         * @param {Object} message - the message to be mapped
         * @returns {Function} the handler function to invoke on the event channel
         */
        function toEvent(message) {
            if (message) {
                if (message.error) {
                    PostMessageUtilities.log("Error on message: " + message.error, "ERROR", "PostMessageMapper");
                    return function() {
                        return message;
                    };
                }
                else {
                    return _getMappedMethod.call(this, message);
                }
            }
        }

        /**
         * Method mapping the method call on the event aggregator to a message which can be posted
         * @param {String} id - the id for the call
         * @param {String} name - the name of the method
         * optional additional method arguments
         * @returns {Object} the mapped method
         */
        function toMessage(id, name) {
            return {
                method: {
                    id: id,
                    name: name,
                    args: Array.prototype.slice.call(arguments, 2)
                }
            };
        }

        /**
         * Method getting the mapped method on the event channel after which it can be invoked
         * @param {Object} message - the message to be mapped
         * optional additional method arguments
         * @return {Function} the function to invoke on the event channel
         * @private
         */
        function _getMappedMethod(message) {
            var method = message && message.method;
            var name = method && method.name;
            var args = method && method.args;
            var eventChannel = this.eventChannel;

            return function() {
                if (eventChannel && eventChannel[name]) {
                    return eventChannel[name].apply(eventChannel, args);
                }
                else {
                    PostMessageUtilities.log("No channel exists", "ERROR", "PostMessageMapper");
                }
            };
        }

        return {
            initialize: initialize,
            toEvent: toEvent,
            toMessage: toMessage
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.PostMessageMapper = exports.PostMessageMapper || PostMessageMapper;
}));
