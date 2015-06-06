describe("PostMessageCourier Sanity Tests", function () {
    var courierGlobal;
    var courierGlobal2;
    var courierLocal;
    var msgChannel;
    var evChannel;
    var utils;
    var LPPromise;
    var msgMapper;
    var orgBind;
    var orgToJSON;
    var initialized = false;
    var ignorePorts = ["80", "443", "0", ":"];
    var protocol = location.protocol + "//";
    var hostname = location.hostname === "localhost" ? "127.0.0.1" : "localhost";
    var port = (-1 === ignorePorts.indexOf(location.port.toString())) ? ":" + location.port.replace(":", "") : "";
    var split = location.href.split("/");
    var base = split.splice(3, split.length - 4).join("/");
    var url = protocol + hostname + port + "/" + base + "/courier_test_frame.html";
    var withChannel = window.PHANTOMJS ? false : void 0;
    var sandbox;

    before(function (done) {
        initialized = false;
        var target = {
            url: url,
            callback: function() {
				initialized = true;
                courierGlobal2 = new Chronos.PostMessageCourier({
                    target: target2,
                    channel: false
                });
            }
        };
        var target2 = {
            url: target.url,
            bust: false,
            style: {
                width: "0px",
                height: "0px",
                position: "absolute",
                top: "-1000px",
                left: "-1000px"
            },
            callback: function() {
                courierGlobal2.trigger({
                    appName: "host",
                    eventName: "Hello"
                });
                done();
            },
            channel: withChannel
        };

        if ("undefined" !== typeof define) {
            require(["Chronos.PostMessageCourier", "Chronos.PostMessageUtilities", "Chronos.PostMessagePromise", "Chronos.PostMessageMapper"],
                function(lpPostMessageCourier, lpPostMessageUtilities, lpPostMessagePromise, lpPostMessageMapper) {
                // Do not use new deliberately to test if component is adding it
                courierGlobal = Chronos.PostMessageCourier({
                    target: target,
                    channel: withChannel
                });
                courierGlobal.trigger({
                    appName: "host",
                    eventName: "Hello"
                });
                msgChannel = courierGlobal.getMessageChannel();
                evChannel = courierGlobal.getEventChannel();
                utils = Chronos.PostMessageUtilities;
                LPPromise = Chronos.PostMessagePromise;
                // Do not use new deliberately to test if component is adding it
                msgMapper = Chronos.PostMessageMapper();
            });
        }
        else {
            // Do not use new deliberately to test if component is adding it
            require("../../src/courier/PostMessageCourier")(function() {
                courierGlobal = Chronos.PostMessageCourier({
                    target: target,
                    channel: withChannel
                });
                courierGlobal.trigger({
                    appName: "host",
                    eventName: "Hello"
                });
                msgChannel = courierGlobal.getMessageChannel();
                evChannel = courierGlobal.getEventChannel();
                utils = require("./courier/PostMessageUtilities");
                LPPromise = require("./courier/PostMessagePromise");
                // Do not use new deliberately to test if component is adding it
                msgMapper = require("./courier/PostMessageMapper")();
            });
        }
    });
    beforeEach("Init PostMessageCourier", function (done) {
        // create a sandbox
        sandbox = sinon.sandbox.create();

        courierLocal = Chronos.PostMessageCourier({
            target: {
                url: url,
                bust: false
            },
            onready: done,
            channel: withChannel
        });
    });
    afterEach(function() {
        // restore the environment as it was before
        sandbox.restore();
        courierLocal.dispose();
        courierLocal = null;
    });
    after(function() {
        courierGlobal.dispose();
        courierGlobal2.dispose();
        courierGlobal = null;
        courierGlobal2 = null;
    });

    describe("check handshake", function () {
        it("should work correctly", function () {
            expect(initialized).to.be.true;
        });
    });

    describe("check creation without new", function () {
        it("should still create instance", function (done) {
            var courierLocal2;
            var options = {
                target: {
                    url: url,
                    callback: function () {
                        expect(courierLocal2).to.be.an.instanceof(Chronos.PostMessageCourier);
                        courierLocal2.dispose();
                        courierLocal2 = null;
                        done();
                    }
                },
                channel: withChannel
            };
            courierLocal2 = Chronos.PostMessageCourier(options);
        });
    });

    describe("check creation inside a supplied container before adding to DOM", function () {
        it("should still create instance", function (done) {
            var container = document.createElement("div");
            var courierLocal2;
            var options = {
                target: {
                    url: url,
                    container: container,
                    callback: function () {
                        expect(courierLocal2).to.be.an.instanceof(Chronos.PostMessageCourier);
                        courierLocal2.dispose();
                        courierLocal2 = null;
                        done();
                    }
                },
                channel: withChannel
            };
            courierLocal2 = Chronos.PostMessageCourier(options);
            document.body.appendChild(container);
        });
    });

    describe("check creation inside a supplied container after adding to DOM", function () {
        it("should still create instance", function (done) {
            var container = document.createElement("div");
            var courierLocal2;
            var options = {
                target: {
                    url: url,
                    container: document.body.appendChild(container),
                    callback: function () {
                        expect(courierLocal2).to.be.an.instanceof(Chronos.PostMessageCourier);
                        courierLocal2.dispose();
                        courierLocal2 = null;
                        done();
                    }
                },
                channel: withChannel
            };
            courierLocal2 = Chronos.PostMessageCourier(options);
        });
    });

    describe("check creation with invalid iframe url", function () {
        it("should create instance but call the callback with timeout error", function (done) {
            var courierLocal2;
            var options = {
                target: {
                    url: url + "x",  // Invalid path
                    callback: function (err) {
                        expect(courierLocal2).to.be.an.instanceof(Chronos.PostMessageCourier);
                        expect(err.message).to.be.equal("Loading: Operation Timeout!");
                        courierLocal2.dispose();
                        courierLocal2 = null;
                        done();
                    }
                },
                channel: withChannel,
                handshakeInterval: 200,
                handshakeAttempts: 2
            };
            courierLocal2 = new Chronos.PostMessageCourier(options);
        });
    });

    describe("check creation with different serializer and deserializer", function () {
        it("should still create instance and work", function (done) {
            var courierLocal2;
            var options = {
                target: {
                    url: url
                },
                onready: {
                    callback: function () {
                        expect(courierLocal2).to.be.an.instanceof(Chronos.PostMessageCourier);
                        kickStart();
                    }
                },
                useObjects: false,
                serialize: Chronos.PostMessageUtilities.stringify,
                deserialize: JSON.parse,
                channel: withChannel
            };
            courierLocal2 = Chronos.PostMessageCourier(options);

            function kickStart() {
                var original = [3];
                var id = courierLocal2.comply({
                    appName: "frame",
                    cmdName: "expect",
                    func: complyHandler
                });

                expect(id).to.be.defined;

                function complyHandler(data) {
                    expect(data).to.be.defined;
                    expect(data[0]).to.be.defined;
                    expect(data[0]).to.equal(original[0] * original[0]);

                    courierLocal2.dispose();
                    courierLocal2 = null;

                    done();
                }

                var res = courierLocal2.command({
                    appName: "host",
                    cmdName: "square",
                    data: original
                });
            }
        });
    });

    describe("check trigger and bind works", function () {
        it("should get event back upon triggering", function (done) {
            var original = 1;
            courierLocal.bind({
                appName: "frame",
                eventName: "got_it",
                func: eventHandler
            });

            function eventHandler(data) {
                expect(data).to.be.defined;
                expect(data).to.equal(original * 2);
                done();
            }

            courierLocal.trigger({
                appName: "host",
                eventName: "multiply",
                data: original
            });

            var hasFired = courierLocal.getEventChannel().hasFiredEvents("host", "multiply");
            expect(hasFired.length).to.equal(1);

        });
    });

    describe("check trigger and bind works from iframe where iframe initiate the first trigger", function () {
        it("should get event back upon triggering", function (done) {
            var options = {
                target: {
                    url: url + "?syncTrigger=true"
                },
                channel: false
            };
            var courierLocal2 = Chronos.PostMessageCourier(options);

            courierLocal2.bind({
                appName: "frame",
                eventName: "loaded",
                func: eventHandler
            });

            function eventHandler(data) {
                expect(data).to.be.undefined;
                done();
            }
        });
    });

    describe("check command and comply works", function () {
        it("should get command back upon complying", function (done) {
            var original = {
                num: 3
            };
            var id = courierLocal.comply({
                appName: "frame",
                cmdName: "expect",
                func: complyHandler
            });

            expect(id).to.be.defined;

            function complyHandler(data) {
                expect(data).to.be.defined;
                expect(data.num).to.be.defined;
                expect(data.num).to.equal(original.num * original.num);
                done();
            }

            var res = courierLocal.command({
                appName: "host",
                cmdName: "square",
                data: original
            });

            expect(res).to.be.undefined;
        });
    });

    describe("check command and comply works with callback", function () {
        it("should get command back upon complying", function (done) {
            var complyHandler = sandbox.spy(function(data) {
                expect(data).to.be.defined;
                expect(data.num).to.be.defined;
                expect(data.num).to.equal(original.num * original.num);

                return data.num;
            });
            var callback = function() {
                expect(complyHandler.calledOnce).to.be.true;
                done();
            };
            var original = {
                num: 3
            };
            var id = courierLocal.comply({
                appName: "frame",
                cmdName: "expect",
                func: complyHandler
            });

            expect(id).to.be.defined;

            var res = courierLocal.command({
                appName: "host",
                cmdName: "square",
                data: original
            }, callback);

            expect(res).to.be.undefined;
        });
    });

    describe("check request and reply works", function () {
        it("should get request back upon replying", function (done) {
            var original = {
                num: 4
            };
            var id = courierLocal.reply({
                appName: "frame",
                reqName: "askBack",
                func: replyHandler
            });

            expect(id).to.be.defined;

            function replyHandler(data) {
                expect(data).to.be.defined;
                expect(data.num).to.be.defined;
                expect(data.num).to.equal(original.num / original.num);
                done();
            }

            var res = courierLocal.request({
                appName: "host",
                reqName: "divide",
                data: original
            });

            expect(res).to.be.undefined;
        });
    });

    describe("check request and reply works with callback", function () {
        it("should get request back upon replying", function (done) {
            var replyHandler = sandbox.spy(function(data) {
                expect(data).to.be.defined;
                expect(data.num).to.be.defined;
                expect(data.num).to.equal(original.num / original.num);

                return data.num;
            });
            var callback = function() {
                expect(replyHandler.calledOnce).to.be.true;
                done();
            };
            var original = {
                num: 4
            };

            var id = courierLocal.reply({
                appName: "frame",
                reqName: "askBack",
                func: replyHandler
            });

            expect(id).to.be.defined;

            var res = courierLocal.request({
                appName: "host",
                reqName: "divide",
                data: original
            }, callback);

            expect(res).to.be.undefined;
        });
    });

    describe("check 2 frames creation with events", function () {
        it("should create 2 instances and work", function (done) {
            var courierLocal2;
            var counting = sandbox.spy(function() {
                if (counting.calledThrice) {
                    done();
                }
            });
            var options = {
                target: {
                    url: url,
                    callback: function () {
                        expect(courierLocal2).to.be.an.instanceof(Chronos.PostMessageCourier);
                        counting();
                    }
                },
                channel: withChannel
            };
            courierLocal2 = new Chronos.PostMessageCourier(options);

            var num = 1;
            courierLocal.bind({
                appName: "frame",
                eventName: "got_it",
                func: eventHandler
            });

            function eventHandler(data) {
                expect(data).to.be.defined;
                expect(data).to.equal(num * 2);
                counting();
            }

            courierLocal.trigger({
                appName: "host",
                eventName: "multiply",
                data: num
            });

            var original = {
                num: 3
            };
            var id = courierLocal2.comply({
                appName: "frame",
                cmdName: "expect",
                func: complyHandler
            });

            expect(id).to.be.defined;

            function complyHandler(data) {
                expect(data).to.be.defined;
                expect(data.num).to.be.defined;
                expect(data.num).to.equal(original.num * original.num);
                counting();
            }

            courierLocal2.command({
                appName: "host",
                cmdName: "square",
                data: original
            });
        });
    });

    describe("check can run request on iframe and get async response (based on promise which will be resolved) with the value sent", function () {

        it("run request on iframe and get async response (based on promise which will be resolved) with the value sent", function (done) {
            var request = courierGlobal.request({
                appName: "host",
                reqName: "Async Ma Shlomha?",
                data: {
                    text: "TODA!"
                }
            }, function(err, data) {
                expect(err).to.be.null;
                expect(data).to.be.equal("TODA!");
                done();
            });

            expect(request).to.be.undefined;
        });
    });

    describe("check can run request on iframe and timeout the async response (based on promise which will be resolved) with the value sent", function () {

        it("run request on iframe and timeout the async response (based on promise which will be resolved) with the value sent", function (done) {
            var request = courierGlobal.request({
                appName: "host",
                reqName: "Async Ma Shlomha?",
                data: {
                    text: "TODA!"
                }
            }, function(err, data) {
                expect(err).to.be.defined;
                expect(err.message).to.be.equal("Callback: Operation Timeout!");
                expect(data).to.be.undefined;
                done();
            }, 500);

            expect(request).to.be.undefined;
        });
    });

    describe("check can reply request from iframe and with the value sent", function () {

        it("reply request from iframe and with the value sent", function (done) {
            courierLocal.reply({
                appName: "iframe",
                reqName: "Ma Shlomha?",
                func: function(data) {
                    // Do not use new deliberately to test if component is adding it
                    var promise = LPPromise(function(resolve, reject) {
                        setTimeout(function() {
                            resolve(data);

                            expect(promise.progress()).to.be.false;
                        }, 0);
                    });

                    return promise;
                }
            });
            var request = courierLocal.request({
                appName: "host",
                reqName: "Ask Async Ma Shlomha?",
                data: {
                    text: "TODA!"
                }
            }, function(err, data) {
                expect(err).to.be.null;
                expect(data).to.be.equal("TODA!");
                done();
            });

            expect(request).to.be.undefined;
        });
    });

    describe("check stringify serialization", function () {

        before(function () {
            // Override array.toJSON to simulate Prototype.js which fucks up this API
            orgToJSON = Array.prototype.toJSON;
            Array.prototype.toJSON = function() {
                return "SHEKER KOLSHEHOO!!!";
            };
        });

        it("serialize object using stringify method", function () {
            var obj = { checked: true };
            var serialized = utils.stringify(obj);
            var deserialized = JSON.parse(serialized);

            expect(deserialized.checked).to.be.true;
        });

        after(function () {
            // Remove array.toJSON which fucks up this API
            Array.prototype.toJSON = orgToJSON;
        });
    });

    describe("check resolveOrigin API", function () {

        it("try to resolve origin", function () {
            var querystring = "?bust=1425412100449&amp;hostParam=hosting&amp;hosting=http%3A%2F%2Flocalhost%3A63342";
            var origin = location.protocol + "//" + location.hostname + ((-1 === ignorePorts.indexOf(location.port.toString())) ? ":" + location.port.replace(":", "") : "");
            var origin2 = "undefined" !== typeof Window ? "http://127.0.0.1:63342" : "*";
            expect(utils.resolveOrigin(window, true)).to.be.equal(origin);
            expect(utils.resolveOrigin({
                contentWindow: window,
                getAttribute: function() {
                    return "http://127.0.0.1:63342/lpEvents/debug/courier.frame.html?bust=1425412100449" + querystring;
                }
            })).to.be.equal(origin2);
        });
    });

    describe("check message mapper with error message", function () {

        it("try map error message", function () {
            expect(msgMapper.toEvent({ error: "Error check 123!" })().error).to.be.equal("Error check 123!");
        });
    });

    describe("check bind polyfill", function () {

        before(function () {
            // Override function.bind to use polyfill
            orgBind = Function.prototype.bind;
            Function.prototype.bind = utils.bind;
        });

        it("bind method using polyfill method", function () {
            var obj = { checked: true };
            function tester() {
                expect(this.checked).to.be.true;
            }
            tester.bind(obj)();
        });

        after(function () {
            // Remove polyfill for function.bind
            Function.prototype.bind = orgBind;
        });
    });

    describe("check command and comply with compliant failure", function () {
        it("should call the callback anyway", function (done) {
            var counting = sandbox.spy(function() {
                if (counting.calledTwice) {
                    done();
                }
            });

            var res = courierGlobal.command({
                appName: "host",
                cmdName: "command",
                data: { success: true }
            }, function(err, callback) {
                expect(err).to.be.undefined;
                counting();
                callback();
            });
            expect(res).to.be.undefined;

            res = courierGlobal.command({
                appName: "host",
                cmdName: "command",
                data: { success: false }
            }, function(err, callback) {
                expect(err).to.be.defined;
                expect(err.message).to.be.equal("Error in command");
                counting();
                callback();
            });
            expect(res).to.be.undefined;
        });
    });
});
