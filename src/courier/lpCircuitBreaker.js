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
        define("lpCircuitBreaker", ["exports"], function (exports) {
            if (!namespace.LPCircuitBreaker) {
                factory(root, namespace);
            }

            return namespace.LPCircuitBreaker;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPCircuitBreaker) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports);
    }
    else {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    /*jshint validthis:true */
    /**
     * @type {{OPEN: number, HALF_OPEN: number, CLOSED: number}}
     * State representation for the circuit
     */
    var STATE = {
        OPEN: 0,
        HALF_OPEN: 1,
        CLOSED: 2
    };

    /**
     * @type {{FAILURE: string, SUCCESS: string, TIMEOUT: string, OUTAGE: string}}
     * Measure types for each slide
     */
    var MEASURE = {
        FAILURE: "failure",
        SUCCESS: "success",
        TIMEOUT: "timeout",
        OUTAGE: "outage"
    };

    /**
     * LPCircuitBreaker constructor
     * @constructor
     * @param {Object} [options] the configuration options for the instance
     * @param {Number} [options.timeWindow = 30000] - the time window that will be used for state calculations
     * @param {Number} [options.slidesNumber = 10] - the number of slides that the time window will be split to (a slide is a sliding unit that is added/remove from the time window)
     * @param {Number} [options.tolerance = 50] - the tolerance before opening the circuit in percentage
     * @param {Number} [options.calibration = 5] - the calibration of minimum calls before starting to validate measurements
     * @param {Function} [options.onopen] - handler for open
     * @param {Function} [options.onclose] - handler for close
     */
    function LPCircuitBreaker(options) {
        // For forcing new keyword
        if (false === (this instanceof LPCircuitBreaker)) {
            return new LPCircuitBreaker(options);
        }

        this.initialize(options);
    }

    LPCircuitBreaker.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} [options] the configuration options for the instance
         * @param {Number} [options.timeWindow = 30000] - the time window that will be used for state calculations
         * @param {Number} [options.slidesNumber = 10] - the number of slides that the time window will be split to (a slide is a sliding unit that is added/remove from the time window)
         * @param {Number} [options.tolerance = 50] - the tolerance before opening the circuit in percentage
         * @param {Number} [options.calibration = 5] - the calibration of minimum calls before starting to validate measurements
         * @param {Function} [options.onopen] - handler for open
         * @param {Function} [options.onclose] - handler for close
         */
        function initialize(options) {
            if (!this.initialized) {
                options = options || {};

                this.timeWindow = !isNaN(options.timeWindow) && 0 < options.timeWindow ? parseInt(options.timeWindow, 10) : 30000;
                this.slidesNumber = !isNaN(options.slidesNumber) && 0 < options.slidesNumber ? parseInt(options.slidesNumber, 10) : 10;
                this.tolerance = !isNaN(options.tolerance) && 0 < options.tolerance ? parseInt(options.tolerance, 10) : 50;
                this.calibration = !isNaN(options.calibration) && 0 < options.calibration ? parseInt(options.calibration, 10) : 5;

                this.onopen = ("function" === typeof options.onopen) ? options.onopen : function() {};
                this.onclose = ("function" === typeof options.onclose) ? options.onclose : function() {};

                this.slides = [_createSlide.call(this)];
                this.state = STATE.CLOSED;

                this.initialized = true;

                _startTicking.call(this);
            }
        }

        /**
         * Method for assigning a defer execution
         * Code waiting for this promise uses this method
         * @param {Function} command - the command to run via the circuit
         * @param {Function} [fallback] - the fallback to run when circuit is opened
         */
        function run(command, fallback) {
            if (isOpen.call(this)) {
                _fallback.call(this, fallback || function() {});
                return false;
            }
            else {
                return _execute.call(this, command);
            }
        }

        /**
         * Method for forcing the circuit to open
         */
        function open() {
            this.forced = this.state;
            this.state = STATE.OPEN;
        }

        /**
         * Method for forcing the circuit to close
         */
        function close() {
            this.forced = this.state;
            this.state = STATE.CLOSED;
        }

        /**
         * Method for resetting the forcing
         */
        function reset() {
            this.state = this.forced;
            this.forced = void 0;
        }

        /**
         * Method for checking whether the circuit is open
         */
        function isOpen() {
            return STATE.OPEN === this.state;
        }

        /**
         * Method for calculating the needed metrics based on all calculation slides
         */
        function calculate() {
            var total = 0;
            var error = 0;
            var percent;

            for (var i = 0, l = this.slides.length; i < l; i++) {
                var slide = this.slides[i];
                var errors = (slide[MEASURE.FAILURE] + slide[MEASURE.TIMEOUT]);

                error += errors;
                total += (errors + slide[MEASURE.SUCCESS]);
            }

            percent = (error / (total > 0 ? total : 1)) * 100;

            return {
                total: total,
                error: error,
                percent: percent
            };
        }

        /**
         * Method for the timer tick which manages the slides
         * @private
         */
        function _tick() {
            if (this.timer) {
                clearTimeout(this.timer);
            }

            if (this.slides.length > this.slidesNumber) {
                this.slides.shift();
            }

            this.slideIndex++;

            if (this.slideIndex > this.slidesNumber) {
                this.slideIndex = 0;

                if (isOpen.call(this)) {
                    this.state = STATE.HALF_OPEN;
                }
            }

            this.slides.push(_createSlide.call(this));

            if (this.slides.length > this.slidesNumber) {
                this.slides.shift();
            }

            this.timer = setTimeout(_tick.bind(this), this.slidingWindow);
        }

        /**
         * Method for starting the timer and creating the metrics slides for calculations
         * @private
         */
        function _startTicking() {
            this.slideIndex = 0;
            this.slidingWindow = this.timeWindow / this.slidesNumber;

            if (this.timer) {
                clearTimeout(this.timer);
            }

            this.timer = setTimeout(_tick.bind(this), this.slidingWindow);
        }

        /**
         * Method for creating a single metrics slide for calculations
         * @private
         */
        function _createSlide() {
            var slide = {};

            slide[MEASURE.FAILURE] = 0;
            slide[MEASURE.SUCCESS] = 0;
            slide[MEASURE.TIMEOUT] = 0;
            slide[MEASURE.OUTAGE] = 0;

            return slide;
        }

        /**
         * Method for retrieving the last metrics slide for calculations
         * @private
         */
        function _getLastSlide() {
            return this.slides[this.slides.length - 1];
        }

        /**
         * Method for adding a calculation measure for a command
         * @param {LPCircuitBreaker.MEASURE} prop - the measurement property (success, error, timeout)
         * @param {Object} status - the status of the command (A single command can only be resolved once and represent a single measurement)
         * @private
         */
        function _measure(prop, status) {
            return function() {
                if (status.done) {
                    return;
                }

                var slide = _getLastSlide.call(this);
                slide[prop]++;

                if ("undefined" === typeof this.forced) {
                    _updateState.call(this);
                }

                status.done = true;
            };
        }

        /**
         * Method for executing a command via the circuit and counting the needed metrics
         * @param {Function} command - the command to run via the circuit
         * @private
         */
        function _execute(command) {
            var result;
            var status = {
                done: false
            };
            var success = _measure(MEASURE.SUCCESS, status).bind(this);
            var failure = _measure(MEASURE.FAILURE, status).bind(this);
            var timeout = _measure(MEASURE.TIMEOUT, status).bind(this);

            try {
                result = command(success, failure, timeout);
            }
            catch(ex) {
                failure();
                return false;
            }

            return result;
        }

        /**
         * Method for executing a command fallback via the circuit and counting the needed metrics
         * @param {Function} fallback - the command fallback to run via the circuit
         * @private
         */
        function _fallback(fallback) {
            try {
                fallback();
            }
            catch(ex) {}

            var slide = _getLastSlide.call(this);
            slide[MEASURE.OUTAGE]++;
        }

        /**
         * Method for updating the circuit state based on the last command or existing metrics
         * @private
         */
        function _updateState() {
            var metrics = calculate.call(this);

            if (STATE.HALF_OPEN === this.state) {
                var lastCommandFailed = !_getLastSlide.call(this)[MEASURE.SUCCESS] && 0 < metrics.error;

                if (lastCommandFailed) {
                    this.state = STATE.OPEN;
                }
                else {
                    this.state = STATE.CLOSED;
                    this.onclose(metrics);
                }
            }
            else {
                var toleranceDeviation = metrics.percent > this.tolerance;
                var calibrationDeviation = metrics.total > this.calibration;
                var deviation = calibrationDeviation && toleranceDeviation;

                if (deviation) {
                    this.state = STATE.OPEN;
                    this.onopen(metrics);
                }
            }
        }

        return {
            initialize: initialize,
            run: run,
            close: close,
            open: open,
            reset: reset,
            isOpen: isOpen,
            calculate: calculate,
            bind: bind
        };
    }());

    /**
     * @type {{OPEN: number, HALF_OPEN: number, CLOSED: number}}
     * State representation for the circuit
     */
    LPCircuitBreaker.STATE = STATE;

    /**
     * Method to polyfill bind native functionality in case it does not exist
     * Based on implementation from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * @param {Object} object - the object to bind to
     * @returns {Function} the bound function
     */
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

    if (!Function.prototype.bind) {
        Function.prototype.bind = bind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPCircuitBreaker = exports.LPCircuitBreaker || LPCircuitBreaker;
}));
