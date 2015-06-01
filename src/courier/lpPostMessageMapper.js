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
        define("lpPostMessageMapper", ["exports", "lpPostMessageUtilities"], function (exports, LPPostMessageUtilities) {
            if (!namespace.LPPostMessageMapper) {
                factory(root, namespace, namespace.LPPostMessageUtilities);
            }

            return namespace.LPPostMessageMapper;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessageMapper) {
            factory(root, namespace, namespace.LPPostMessageUtilities);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        /**
         * @depend ./lpPostMessageUtilities.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPPostMessageUtilities);
    }
}(this, function (root, exports, LPPostMessageUtilities) {
    "use strict";

    /*jshint validthis:true */

    /**
     * LPPostMessageMapper constructor
     * @constructor
     * @param {LPEventChannel} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the LPEventChannel API)
     */
    function LPPostMessageMapper(eventChannel) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessageMapper)) {
            return new LPPostMessageMapper(eventChannel);
        }

        this.initialize(eventChannel);
    }

    LPPostMessageMapper.prototype = (function () {
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
                    LPPostMessageUtilities.log("Error on message: " + message.error, "ERROR", "PostMessageMapper");
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
            var id = method && method.id;
            var name = method && method.name;
            var args = method && method.args;
            var eventChannel = this.eventChannel;

            return function() {
                if (eventChannel && eventChannel[name]) {
                    return eventChannel[name].apply(eventChannel, args);
                }
                else {
                    LPPostMessageUtilities.log("No channel exists", "ERROR", "PostMessageMapper");
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
    exports.LPPostMessageMapper = exports.LPPostMessageMapper || LPPostMessageMapper;
}));
