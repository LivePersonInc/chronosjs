describe('ReqRes Sanity Tests', function () {
    var reqres;
    var ReqRes;

    before(function (done) {
        if ("undefined" !== typeof define) {
            require(["Chronos.Reqres"], function(Reqres) {
                ReqRes = Reqres;
                done();
            });
        }
        else {
            require("../../src/Reqres")(done);
        }
    });
    beforeEach('Init ReqRes', function (done) {
        reqres = new ReqRes();
        done();
    });
    describe("check for global scope", function () {
        it("should not be polluted", function() {
            expect(window.Chronos).to.be.undefined;
        })
    });

    describe("check response", function () {
        var res;
        it("should respond with 1", function () {
            var cmdId = reqres.reply({
                appName: 'app',
                reqName: 'get',
                func: function () {
                    return 1;
                }
            });

            res = reqres.request({
                appName: 'app',
                reqName: 'get',
                data: {}
            });
            expect(cmdId).not.to.be.null;
            expect(res).to.equal(1);
        });
    });

    describe("check double reply to same command", function () {

        it("not accept a second reply", function () {
            var cmdId = reqres.reply({
                appName: 'app',
                reqName: 'get',
                func: function () {
                    return 1;
                }
            });

            var cmdId2 = reqres.reply({
                appName: 'app',
                reqName: 'get',
                func: function () {
                    return 1;
                }
            });
            expect(cmdId).not.to.be.null;
            expect(cmdId2).to.be.null;
        });
    });

    describe("check stopReply of command by request Id", function () {

        it("should unbind correctly", function () {
            function callback() {
                return 1;
            }

            var reqId = reqres.reply({
                appName: 'app',
                reqName: 'get',
                func: callback
            });

            var res = reqres.request({
                appName: 'app',
                reqName: 'get',
                data: {}
            });

            expect(res).to.equal(1);

            var stopRes = reqres.stopReplying(reqId);

            expect(stopRes).to.be.true;

            res = reqres.request({
                appName: 'app',
                reqName: 'get',
                data: {}
            });

            expect(res).to.be.undefined;
        });
    });

    describe("check request with no listeners", function () {

        it("should return undefined", function () {
            var res = reqres.request({
                appName: 'app',
                reqName: 'get',
                data: {}
            });

            expect(res).to.be.undefined;
        });
    });

    describe("force error when requesting * in reqName", function () {

        it("should throw an error", function () {
            function fn() {
                reqres.request({
                    appName: 'app',
                    reqName: '*',
                    data: {}
                });
            }

            expect(fn).to.throw(Error, /Invalid request/);
        });
    });

    describe("force error when requesting * in app name", function () {

        it("should throw an error", function () {
            function fn() {
                reqres.request({
                    appName: '*',
                    reqName: 'sdg',
                    data: {}
                });
            }

            expect(fn).to.throw(Error, /Invalid request/);
        });
    });

    describe("check reply to * in app name", function () {

        it("should throw an error", function () {
            var res = reqres.reply({
                appName: '*',
                reqName: 'sdg',
                data: {}
            });

            expect(res).to.be.null;
        });
    });

    describe("check reply to * in req name", function () {

        it("should throw an error", function () {
            var res = reqres.reply({
                appName: 'sdgd',
                reqName: '*',
                data: {}
            });

            expect(res).to.be.null;
        });
    });

    describe("Two reqres instances hold their own data", function () {

        it("should hold different events", function () {
            reqres.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function () {
                }
            });
            reqres.request({
                appName: 'app1',
                reqName: 'ev1'
            });

            expect(reqres.hasFired('app1', 'ev1').length).to.equal(1);

            var reqres2 = new ReqRes();
            expect(reqres.hasFired('app1', 'ev1').length).to.equal(1);
        });
    });

    describe("Test for async usage of reqres", function () {

        it("should return and call the callback", function (done) {
            reqres.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function (data, cb) {
                    setTimeout(function() {
                        cb(2);
                    }, 20);
                    return 1;
                }
            });
            var res = reqres.request({
                appName: 'app1',
                reqName: 'ev1'
            }, function (result) {
                expect(result).to.equal(2);
                done();
            });

            expect(reqres.hasFired('app1', 'ev1').length).to.equal(1);

            expect(res).to.equal(1);
        });
    });

    describe("Change bufferLimit default", function () {

        it("should catch the change and act accordingly", function () {
            var reqres2 = new ReqRes({
                eventBufferLimit: 1
            });
            reqres2.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function () {}
            });
            reqres2.request({appName: 'app1', reqName: 'ev1'});

            expect(reqres2.hasFired('app1', 'ev1').length).to.equal(1);

            reqres2.request({appName: 'app1', reqName: 'ev1'});

            expect(reqres2.hasFired('app1', 'ev1').length).to.equal(1);
        });

    });

    describe("Change cloneEventData default", function () {

        it("should catch the change and act accordingly", function () {
            var data = {
                item: "whatever"
            };
            var innerData;
            var reqres2 = new ReqRes({
                cloneEventData: true
            });
            reqres2.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function (data) {
                    innerData = data;
                }
            });
            reqres2.request({appName: 'app1', reqName: 'ev1', data: data});

            expect(innerData).to.exist;
            expect(data).to.not.equal(innerData);
        });

    });

    describe("Check not cloning data by default", function () {

        it("should see that data is the same", function () {
            var data = {
                item: "whatever"
            };
            var innerData;
            reqres.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function (data) {
                    innerData = data;
                }
            });
            reqres.request({appName: 'app1', reqName: 'ev1', data: data});

            expect(innerData).to.exist;
            expect(data).to.equal(innerData);
        });

    });


    describe("request with failed replier", function () {

        var counter = 0;

        it("should work, despite  failure in registered function", function () {

            reqres.reply({
                appName: "app",
                reqName: 'reqTest',
                func: function () {
                    throw new Error('Force error');
                    counter++;
                }
            });

            var res = reqres.request({
                appName: "app",
                reqName: 'reqTest'
            });
            expect(counter).to.equal(0);
            expect(res).to.be.undefined;
        });

    });

    describe("Check calling callback with error", function () {

        it("should call the callback with error", function () {
            var called = false;

            var data = {
                item: "whatever"
            };
            var id = reqres.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function (data) {
                    throw new Error("YES!");
                }
            });

            expect(id).to.exist;

            var res = reqres.request({appName: 'app1', reqName: 'ev1', data: data}, function (err, data) {
                called = true;
                expect(data).to.be.undefined;
                expect(err).to.exist;
                expect(err.message).to.equal("YES!");
            });

            expect(res).to.be.undefined;
            expect(called).to.be.true;
        });

    });

    describe("Check calling callback with error and the callback itself throws error", function () {

        it("should call the callback with error and fail", function () {
            var called = false;

            var data = {
                item: "whatever"
            };
            var id = reqres.reply({
                appName: 'app1',
                reqName: 'ev1',
                func: function (data) {
                    throw new Error("YES!");
                }
            });

            expect(id).to.exist;

            var res = reqres.request({appName: 'app1', reqName: 'ev1', data: data}, function (err, data) {
                called = true;
                expect(data).to.be.undefined;
                expect(err).to.exist;
                expect(err.message).to.equal("YES!");
                throw new Error("STAM");
            });

            expect(res).to.be.undefined;
            expect(called).to.be.true;
        });

    });

    describe("check response on named reqres", function () {
        var res;
        var namedReqRes;
        before(function() {
            namedReqRes = new ReqRes({ appName: "NamedReqRes" });
        });

        it("should respond with 1", function () {
            var reqId = namedReqRes.reply({
                reqName: "get",
                func: function () {
                    return 1;
                }
            });

            res = namedReqRes.request({
                reqName: "get",
                data: {}
            });
            expect(reqId).not.to.be.null;
            expect(res).to.equal(1);
        });
    });
});
