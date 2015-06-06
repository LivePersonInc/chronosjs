;(function (root, chronosRoot, factory) {
    "use strict";

    chronosRoot.Chronos = chronosRoot.Chronos || {};

    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {

        // AMD. Register as an anonymous module.
        define("Chronos.PostMessageUtilities", ["exports"], function () {
            if (!chronosRoot.Chronos.PostMessageUtilities) {
                factory(root, chronosRoot.Chronos);
            }

            return chronosRoot.Chronos.PostMessageUtilities;
        });
        return;
    }
    //</amd>
    if ("object" !== typeof exports) {
        factory(root, chronosRoot.Chronos);
    }
}(this, typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports) {
    "use strict";

    var SEQUENCE_FORMAT = "_xxxxxx-4xxx-yxxx";

    /**
     * This function was added because of incompatibility between the JSON.stringify and Prototype.js library
     * When a customer uses Prototype.js library, It overrides the Array.prototype.toJSON function of the native JSON
     * uses. This causes arrays to be double quoted and Shark to fail on those SDEs.
     * The function accepts a value and uses the native JSON.stringify
     * Can throw an exception (same as JSON.stringify).
     * @returns {String} the strigified object
     */
    function stringify() {
        var stringified;
        var toJSONPrototype;

        if ("function" === typeof Array.prototype.toJSON) {
            toJSONPrototype = Array.prototype.toJSON;
            Array.prototype.toJSON = void 0;

            try {
                stringified = JSON.stringify.apply(null, arguments);
            }
            catch (ex) {
                Array.prototype.toJSON = toJSONPrototype;
                throw ex;
            }

            Array.prototype.toJSON = toJSONPrototype;
        }
        else {
            stringified = JSON.stringify.apply(null, arguments);
        }

        return stringified;
    }

    /**
     * Method to identify whether the browser supports passing object references to postMessage API
     * @returns {Boolean} whether the browser supports passing object references to postMessage API
     */
    function hasPostMessageObjectsSupport() {
        var hasObjectsSupport = true;
        try {
            root.postMessage({
                toString:function() {
                    hasObjectsSupport = false;
                }
            }, "*");
        }
        catch(ex) {}

        return hasObjectsSupport;
    }


    /**
     * Method to create a unique sequence
     * @param {String} format - the format for the unique name eg. xxxxx-xx4xxx-yxxxx
     * @returns {String} the unique iFrame name
     */
    function createUniqueSequence(format) {
        return format && format.replace(/[xy]/g, function(chr) {
                var rnd = Math.random() * 16 | 0;
                var val = chr === "x" ? rnd : (rnd & 0x3 | 0x8);

                return val.toString(16);
            });
    }

    /**
     * Method to validate and parse an input number
     * @param {Number} input - the input value to parse
     * @param {Number} defaultValue - the default value to return in case of invalid input
     * @returns {Number} the number to return
     */
    function parseNumber(input, defaultValue) {
        return !isNaN(input) && 0 < input ? parseInt(input, 10) : defaultValue;
    }

    /**
     * Method to validate and parse a function reference
     * @param {Function} input - the input value to parse
     * @param {Function|Boolean} defaultValue - the default value to return in case of invalid input or true for empty function
     * @returns {Function} the function to return
     */
    function parseFunction(input, defaultValue) {
        return (("function" === typeof input) ? input : (true === defaultValue ? function() {} : defaultValue));
    }

    /**
     * Function to extract the host domain from any URL
     * @param {String} url - the url to resolve the host for
     * @param {Object} [win] - the window to resolve the host for
     * @param {Boolean} [top] - boolean indication for using helper of the top window if needed
     * @returns {String} the host
     */
    function getHost(url, win, top) {
        var domainRegEx = new RegExp(/(http{1}s{0,1}?:\/\/)([^\/\?]+)(\/?)/ig);
        var matches;
        var domain;
        var frame;

        if (url && 0 === url.indexOf("http")) {
            matches = domainRegEx.exec(url);
        }
        else { // This is a partial url so we assume it's relative, this is mainly nice for tests
            frame = top ? (win.top || (win.contentWindow && win.contentWindow.parent) || window) : win;
            return frame.location.protocol + "//" + frame.location.host;
        }

        if (matches && 3 <= matches.length && "" !== matches[2]) {
            domain = matches[1].toLowerCase() + matches[2].toLowerCase(); // 0 - full match 1- HTTPS 2- domain
        }

        return domain;
    }

    /**
     * Method to resolve the needed origin
     * @param {Object} [target] - the target to resolve the host for
     * @param {Boolean} [top] - boolean indication for using helper of the top window if needed
     * @returns {String} the origin for the target
     */
    function resolveOrigin(target, top) {
        var origin;
        var url;
        var param;

        try {
            url = target && target.contentWindow && "undefined" !== typeof Window && !(target instanceof Window) && target.getAttribute && target.getAttribute("src");
        }
        catch(ex) {}

        try {
            if (!url) {
                url = getURLParameter("lpHost");

                if (!url) {
                    param = getURLParameter("hostParam");

                    if (param) {
                        url = getURLParameter(param);
                    }
                }
            }

            if (!url) {
                url = document.referrer;
            }

            if (url) {
                url = decodeURIComponent(url);
            }

            origin = getHost(url, target, top);
        }
        catch(ex) {
            log("Cannot parse origin", "ERROR", "PostMessageUtilities");
        }

        return origin || "*";
    }

    /**
     * Method to retrieve a url parameter from querystring by name
     * @param {String} name - the name of the parameter
     * @returns {String} the url parameter value
     */
    function getURLParameter(name) {
        return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(document.location.search) || [void 0, ""])[1].replace(/\+/g, "%20")) || null;
    }

    /**
     * Method to delay a message execution (async)
     * @param {Function} method - the function to delay
     * @param {Number} [milliseconds] - optional milliseconds to delay or false to run immediately
     */
    function delay(method, milliseconds) {
        if ("undefined" !== typeof setImmediate && (isNaN(milliseconds) || 0 >= milliseconds)) {
            setImmediate(method);
        }
        else if (false === milliseconds) {
            method();
        }
        else {
            setTimeout(method, (isNaN(milliseconds) || 0 >= milliseconds) ? 0 : parseInt(milliseconds, 10));
        }
    }

    /**
     * Method to add DOM events listener to an element
     * @param {Object} element - the element we're binding to
     * @param {String} event - the event we want to bind
     * @param {Function} callback - the function to execute
     */
    function addEventListener(element, event, callback) {
        if (element.addEventListener) {
            element.addEventListener(event, callback, false);
        }
        else {
            element.attachEvent("on" + event, callback);
        }

        return function() {
            removeEventListener(element, event, callback);
        };
    }

    /**
     * Method to add DOM events listener to an element
     * @param {Object} element - the element we're binding to
     * @param {String} event - the event we want to bind
     * @param {Function} callback - the function to execute
     */
    function removeEventListener(element, event, callback) {
        if (element.removeEventListener) {
            element.removeEventListener(event, callback, false);
        }
        else {
            element.detachEvent("on" + event, callback);
        }
    }

    /**
     * Method to implement a simple logging based on lptag
     * @param {String} msg - the message to log
     * @param {String} level - the logging level of the message
     * @param {String} app - the app which logs
     */
    function log(msg, level, app) {
        if (root && "function" === typeof root.log) {
            root.log(msg, level, app);
        }
    }

    /**
     * Method to polyfill bind native functionality in case it does not exist
     * Based on implementation from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * @param {Object} object - the object to bind to
     * @returns {Function} the bound function
     */
    /* istanbul ignore next */
    function bind(object) {
        /*jshint validthis:true */
        var args;
        var fn;

        if ("function" !== typeof this) {
            // Closest thing possible to the ECMAScript 5
            // Internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        args = Array.prototype.slice.call(arguments, 1);
        fn = this;

        function Empty() {}

        function bound() {
            return fn.apply(this instanceof Empty && object ? this : object,
                args.concat(Array.prototype.slice.call(arguments)));
        }

        Empty.prototype = this.prototype;
        bound.prototype = new Empty();

        return bound;
    }

    /* istanbul ignore if  */
    if (!Function.prototype.bind) {
        Function.prototype.bind = bind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.PostMessageUtilities = exports.PostMessageUtilities || {
        SEQUENCE_FORMAT: SEQUENCE_FORMAT,
        stringify: stringify,
        hasPostMessageObjectsSupport: hasPostMessageObjectsSupport,
        createUniqueSequence: createUniqueSequence,
        parseNumber: parseNumber,
        parseFunction: parseFunction,
        getHost: getHost,
        resolveOrigin: resolveOrigin,
        getURLParameter: getURLParameter,
        delay: delay,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        log: log,
        bind: bind
    };
}));
