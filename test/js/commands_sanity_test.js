describe('Commands Sanity Tests', function () {
    var commands;

    before(function (done) {
        if ("undefined" !== typeof define) {
            require(["Chronos.Commands"], function(Commands) {
                done();
            });
        }
        else {
            require("../../src/Commands")(done);
        }
    });
    beforeEach('Init ReqRes', function (done) {
        commands = new lpTag.channel.Commands();
        done();
    });

    describe("check response", function () {
        var res;
        it("should respond with 1", function () {
            var cmdId = commands.comply({
                appName: 'app',
                cmdName: 'get',
                func: function () {
                    return 1;
                }
            });

            res = commands.command({
                appName: 'app',
                cmdName: 'get',
                data: {}
            });
            expect(cmdId).not.to.be.null;
            expect(res).to.be.true;
        });
    });

    describe("check double comply to same command", function () {

        it("not accept a second comply", function () {
            var cmdId = commands.comply({
                appName: 'app',
                cmdName: 'get',
                func: function () {
                    return 1;
                }
            });

            var cmdId2 = commands.comply({
                appName: 'app',
                cmdName: 'get',
                func: function () {
                    return 1;
                }
            });
            expect(cmdId).not.to.be.null;
            expect(cmdId2).to.be.null;
        });
    });

    describe("check stopComply of command by command Id", function () {

        it("should unbind correctly", function () {
            function callback() {
                return 1;
            }

            var reqId = commands.comply({
                appName: 'app',
                cmdName: 'get',
                func: callback
            });

            var res = commands.command({
                appName: 'app',
                cmdName: 'get',
                data: {}
            });

            expect(res).to.be.true;

            var stopRes = commands.stopComplying(reqId);

            expect(stopRes).to.be.true;

            res = commands.command({
                appName: 'app',
                cmdName: 'get',
                data: {}
            });

            expect(res).to.be.false;
        });
    });

    describe("check command with no listeners", function () {

        it("should return undefined", function () {
            var res = commands.command({
                appName: 'app',
                cmdName: 'get',
                data: {}
            });

            expect(res).to.be.false;
        });
    });

    describe("force error when commanding * in cmdName", function () {

        it("should throw an error", function () {

            var res = commands.command({
                appName: 'app',
                cmdName: '*',
                data: {}
            });


            expect(res).to.be.null;
        });
    });

    describe("force error when commanding * in app name", function () {

        it("should throw an error", function () {
            var res = commands.command({
                appName: '*',
                cmdName: 'sdg',
                data: {}
            });

            expect(res).to.be.null;
        });
    });

    describe("check comply to * in app name", function () {

        it("should throw an error", function () {
            var res = commands.comply({
                appName: '*',
                cmdName: 'sdg',
                data: {}
            });

            expect(res).to.be.null;
        });
    });

    describe("check comply to * in req name", function () {

        it("should throw an error", function () {
            var res = commands.comply({
                appName: 'sdgd',
                cmdName: '*',
                data: {}
            });

            expect(res).to.be.null;
        });
    });

    describe("Two commands instances hold their own data", function () {

        it("should hold different events", function () {
            commands.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function () {
                }
            });
            commands.command({
                appName: 'app1',
                cmdName: 'ev1'
            });

            expect(commands.hasFired('app1', 'ev1').length).to.equal(1);

            var commands2 = new lpTag.channel.Commands();
            expect(commands.hasFired('app1', 'ev1').length).to.equal(1);
        });

    });

    describe("Test for async usage of commands", function () {

        it("should hold different events", function (done) {
            commands.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function (data, cb) {
                    setTimeout(function() {
                        cb();
                    }, 20);
                    return 1;
                }
            });
            var res = commands.command({
                appName: 'app1',
                cmdName: 'ev1'
            }, function () {
                expect(true).to.be.ok;
                done();
            });

            expect(commands.hasFired('app1', 'ev1').length).to.equal(1);

            expect(res).to.be.true;
        });
    });

    describe("Change bufferLimit default", function () {

        it("should catch the change and act accordingly", function () {
            var commands2 = new lpTag.channel.Commands({
                eventBufferLimit: 1
            });
            commands2.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function () {}
            });
            commands2.command({appName: 'app1', cmdName: 'ev1'});

            expect(commands2.hasFired('app1', 'ev1').length).to.equal(1);

            commands2.command({appName: 'app1', cmdName: 'ev1'});

            expect(commands2.hasFired('app1', 'ev1').length).to.equal(1);
        });

    });

    describe("Change cloneEventData default", function () {

        it("should catch the change and act accordingly", function () {
            var data = {
                item: "whatever"
            };
            var innerData;
            var commands2 = new lpTag.channel.Commands({
                cloneEventData: true
            });
            commands2.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function (data) {
                    innerData = data;
                }
            });
            commands2.command({appName: 'app1', cmdName: 'ev1', data: data});

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
            commands.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function (data) {
                    innerData = data;
                }
            });
            commands.command({appName: 'app1', cmdName: 'ev1', data: data});

            expect(innerData).to.exist;
            expect(data).to.equal(innerData);
        });

    });

    describe("command with failed compliant", function () {

        var counter = 0;

        it("should work, despite  failure in registered function", function () {

            commands.comply({
                appName: "app",
                cmdName: 'cmdTest',
                func: function () {
                    throw new Error('Force error');
                    counter++;
                }
            });

            var res = commands.command({
                appName: "app",
                cmdName: 'cmdTest'
            });
            expect(counter).to.equal(0);
            expect(res).to.be.true;
        });

    });

    describe("Check calling callback with error", function () {

        it("should call the callback with error", function () {
            var called = false;

            var data = {
                item: "whatever"
            };
            var id = commands.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function (data) {
                    throw new Error("YES!");
                }
            });

            expect(id).to.exist;

            var res = commands.command({appName: 'app1', cmdName: 'ev1', data: data}, function (err) {
                called = true;
                expect(err).to.exist;
                expect(err.message).to.equal("YES!");
            });

            expect(res).to.be.true;
            expect(called).to.be.true;
        });

    });

    describe("Check calling callback with error and the callback itself throws error", function () {

        it("should call the callback with error and fail", function () {
            var called = false;

            var data = {
                item: "whatever"
            };
            var id = commands.comply({
                appName: 'app1',
                cmdName: 'ev1',
                func: function (data) {
                    throw new Error("YES!");
                }
            });

            expect(id).to.exist;

            var res = commands.command({appName: 'app1', cmdName: 'ev1', data: data}, function (err) {
                called = true;
                expect(err).to.exist;
                expect(err.message).to.equal("YES!");
                throw new Error("STAM");
            });

            expect(res).to.be.true;
            expect(called).to.be.true;
        });

    });

});
