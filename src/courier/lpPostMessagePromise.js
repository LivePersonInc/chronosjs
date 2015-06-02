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
    var define  = window.define;

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessagePromise", ["exports"], function () {
            if (!namespace.LPPostMessagePromise) {
                factory(root, namespace);
            }

            return namespace.LPPostMessagePromise;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessagePromise) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    /*jshint validthis:true */
    var ACTION_TYPE = {
        RESOLVE: "resolve",
        REJECT: "reject",
        PROGRESS: "progress"
    };

    /**
     * LPPostMessagePromise constructor
     * @constructor
     * @param {Function} [executor] - optional method to be invoked during initialization that will have
     *                   arguments of resolve and reject according to ES6 Promise A+ spec
     */
    function LPPostMessagePromise(executer) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessagePromise)) {
            return new LPPostMessagePromise(executer);
        }

        this.initialize(executer);
    }

    LPPostMessagePromise.prototype = (function () {
        /**
         * Method for initialization
         * @param {Function} [executor] - optional method to be invoked during initialization that will have
         *                   arguments of resolve and reject according to ES6 Promise A+ spec
         *
         */
        function initialize(executor) {
            if (!this.initialized) {
                this.queue = [];
                this.actions = {
                    resolve: resolve.bind(this),
                    reject: reject.bind(this),
                    progress: progress.bind(this)
                };

                // Option to pass executor method
                if ("function" === typeof executor) {
                    executor.call(this, this.actions.resolve, this.actions.reject);
                }
                this.initialized = true;
            }
        }

        /**
         * Method for assigning a defer execution
         * Code waiting for this promise uses this method
         * @param {Function} onresolve - the resolve callback
         * @param {Function} onreject - the reject callback
         * @param {Function} onprogress - the onprogress handler
         */
        function then(onresolve, onreject, onprogress) {
            // Queue the calls to then()
            this.queue.push({
                resolve: onresolve,
                reject: onreject,
                progress: onprogress
            });
        }

        /**
         * Method for resolving the promise
         * @param {Object} [data] - the data to pass the resolve callback
         */
        function resolve(data) {
            _complete.call(this, ACTION_TYPE.RESOLVE, data);
        }

        /**
         * Method for rejecting the promise
         * @param {Object} [data] - the data to pass the resolve callback
         */
        function reject(data) {
            _complete.call(this, ACTION_TYPE.REJECT, data);
        }

        /**
         * Method for calling the progress handler
         * @param {Object} [status] - the status to pass the progress handler
         */
        function progress(status) {
            _completeQueue.call(this, ACTION_TYPE.PROGRESS, status);
        }

        /**
         * Method for calling all queued handlers with a specified type to complete the queue
         * @param {LPPostMessagePromise.ACTION_TYPE} type - the type of handlers to invoke
         * @param {Object} [arg] - the arg to pass the handler handler
         * @param {Boolean} empty - a flag to indicate whether the queue should be empty after completion
         * @private
         */
        function _completeQueue(type, arg, empty) {
            var i = 0;
            var item = this.queue[i++];

            while (item) {
                if (item[type]) {
                    item[type].call(this, arg);
                }
                item = this.queue[i++];
            }

            if (empty) {
                // Clear
                this.queue.length = 0;
            }
        }

        /**
         * Method for completing the promise (resolve/reject)
         * @param {LPPostMessagePromise.ACTION_TYPE} type - resolve/reject
         * @param {Object} [arg] - the data to pass the handler
         * @private
         */
        function _complete(type, arg) {
            // Sync/Override then()
            var action = this.actions[type];

            // Override then to invoke the needed action
            this.then = function (resolve, reject) {
                if (action) {
                    action.call(this, arg);
                }
            }.bind(this);

            // Block multiple calls to resolve or reject by overriding
            this.resolve = this.reject = function () {
                throw new Error("This Promise instance had already been completed.");
            };

            // Block progress by overriding with false result
            this.progress = function () {
                return false;
            };

            // Complete all waiting (async) queue
            _completeQueue.call(this, type, arg, true);

            // Clean
            delete this.queue;
        }

        return {
            initialize: initialize,
            then: then,
            resolve: resolve,
            reject: reject,
            progress: progress
        };
    }());

    /**
     * Method for polyfilling Promise support if not exist
     */
    LPPostMessagePromise.polyfill = function() {
        if (!root.Promise) {
            root.Promise = LPPostMessagePromise;
        }
    };

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessagePromise = exports.LPPostMessagePromise || LPPostMessagePromise;
}));
