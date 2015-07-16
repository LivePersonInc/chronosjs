describe('Channels Sanity Tests', function () {
    var channels;
    var Channels;

    before(function (done) {
        if ("undefined" !== typeof define) {
            require(["Chronos.Channels"], function(Channels) {
                Channels = Channels;
                done();
            });
        }
        else {
            require("../../src/Channels")(done);
        }
    });
    beforeEach('Init ReqRes', function (done) {
        channels = new Channels();
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
            var cmdId = channels.reply({
                appName: 'app',
                reqName: 'get',
                func: function () {
                    return 1;
                }
            });

            res = channels.request({
                appName: 'app',
                reqName: 'get',
                data: {}
            });
            expect(cmdId).not.to.be.null;
            expect(res).to.equal(1);
        });
    });

    describe("check response on named channels", function () {
        var res;
        var namedChannels = new Channels({ appName: "NamedReqRes" });

        it("should respond with 1", function () {
            var reqId = namedChannels.reply({
                reqName: "get",
                func: function () {
                    return 1;
                }
            });

            res = namedChannels.command({
                reqName: "get",
                data: {}
            });
            expect(reqId).not.to.be.null;
            expect(res).to.be.true;
        });
    });
});
