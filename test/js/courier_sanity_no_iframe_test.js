describe("PostMessageCourier Sanity Tests with iFrame creation from the outside", function () {
    var courierLocal;
    var msgChannel;
    var evChannel;
    var ignorePorts = ["80", "443", "0", ":"];
    var protocol = location.protocol + "//";
    var hostname = location.hostname === "localhost" ? "127.0.0.1" : "localhost";
    var port = (-1 === ignorePorts.indexOf(location.port.toString())) ? ":" + location.port.replace(":", "") : "";
    var split = location.href.split("/");
    var base = split.splice(3, split.length - 4).join("/");
    var url = protocol + hostname + port + "/" + base + "/courier_test_frame.html";
    var buster = 0;
    var withChannel = window.PHANTOMJS ? false : void 0;
    var sandbox;

    if (false === withChannel) {
        url += "?lpPMCPolyfill=true";
    }

    before(function (done) {
        if ("undefined" !== typeof define) {
            require(["Chronos.PostMessageCourier"], function (lpPostMessageCourier) {
                done();
            });
        } else {
            // Do not use new deliberately to test if component is adding it
            require("../../src/courier/PostMessageCourier")(done);
        }
    });
    beforeEach("Init Courier & iFrame", function (done) {
        // create a sandbox
        sandbox = sinon.sandbox.create();

        var target = {
            url: url + (0 < url.indexOf("?") ? "&" : "?") + "_d=" + buster++,
            callback: function() {
                courierLocal = new lpTag.channel.PostMessageCourier({
                    target: frame,
                    targetOrigin: protocol + hostname + port,
                    channel: withChannel
                });
                msgChannel = courierLocal.getMessageChannel();
                evChannel = courierLocal.getEventChannel();
                done();
            }
        };
        var frame = createIFrame({ target: target });
    });

    afterEach("Dispose iFrame", function (done) {
        sandbox.restore();
        courierLocal.dispose();
        courierLocal = null;

        var frame = document.getElementsByTagName("iframe");
        for (var i = 0; frame.length; i++) {
            // Always 0 since we remove it every time
            frame.item(0).parentNode.removeChild(frame.item(0));
        }

        done();
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
            var callback = function(err) {
                expect(err).to.be.null;
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
            var callback = function(err) {
                expect(err).to.be.null;
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

    describe("check can run request on iframe and get async response (based on promise which will be resolved) with the value sent", function () {

        it("run request on iframe and get async response (based on promise which will be resolved) with the value sent", function (done) {
            var request = courierLocal.request({
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
            var request = courierLocal.request({
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
});

function addElementEventListener(element, event, callback) {
    if ("undefined" !== typeof element.addEventListener) {
        element.addEventListener(event, callback, false);
    }
    else {
        element.attachEvent("on" + event, callback);
    }
}

function createIFrame(options) {
    var frame = document.createElement("IFRAME");

    frame.setAttribute("id", "MyId");
    frame.setAttribute("name", "MyName");
    frame.setAttribute("tabindex", "-1");       // To prevent it getting focus when tabbing through the page
    frame.setAttribute("aria-hidden", "true");  // To prevent it being picked up by screen-readers
    frame.setAttribute("title", "");            // Adding an empty title at AT&Ts insistence
    frame.setAttribute("role", "presentation"); // Adding a presentation role http://yahoodevelopers.tumblr.com/post/59489724815/easy-fixes-to-common-accessibility-problems
    frame.setAttribute("allowTransparency", "true");

    if (options && options.target && options.target.style) {
        for (var attr in options.target.style) {
            if (options.target.style.hasOwnProperty(attr)) {
                frame.style[attr] = options.target.style[attr];
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

    document.body.appendChild(frame);

    addElementEventListener(frame, "load", function() {
        if (options && options.target && options.target.callback) {
            options.target.callback(options.target.context);
        }
    }.bind(this));

    document.body.appendChild(frame);

    if (options && options.target && options.target.url) {
        var src = options.target.url + (0 < options.target.url.indexOf("?") ? "&bust=" : "?bust=");
        src += (new Date()).getTime();
        src += ("&host=" + document.location.protocol + "//" + document.location.host);
        frame.setAttribute("src", src);
    }

    return frame;
}
