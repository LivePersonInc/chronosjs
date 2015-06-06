define("conf", function() {
    return {
        "blanket": true,
        "blanketCoverOnly": "['../../src/','../../src/courier/']",
        "blanketCoverNever": "['../lib/','../../src/../node_modules/','//^\w+test\.js$/gi']",
        "requireConfig": {
            //By default load any module IDs from src directory
            baseUrl: "../coverage/instrument/src",
            paths: {
                chai: "../../../../node_modules/chai/chai",
                sinon: "../../../../node_modules/sinon/pkg/sinon",
                cacher: "../../../../node_modules/cacherjs/src/cacher",
                CircuitBreaker: "../../../../node_modules/circuit-breakerjs/src/CircuitBreaker",
                "Chronos.Events": "Events",
                "Chronos.EventsUtil": "util/EventsUtil",
                "Chronos.Commands": "Commands",
                "Chronos.CommandsUtil": "util/CommandsUtil",
                "Chronos.Reqres": "Reqres",
                "Chronos.Channels": "Channels",
                "Chronos.PostMessageCourier": "courier/PostMessageCourier",
                "Chronos.PostMessageUtilities": "courier/PostMessageUtilities",
                "Chronos.PostMessagePromise": "courier/PostMessagePromise",
                "Chronos.PostMessageMapper": "courier/PostMessageMapper",
                "Chronos.PostMessageChannel": "courier/PostMessageChannel",
                "Chronos.PostMessageChannelPolyfill": "courier/PostMessageChannelPolyfill"
            }
        },
        "chaiLib": "expect",
        "mochaInterface": "bdd",
        "mochaTimeout": 60000,
        "tests": [
            "../js/events_sanity_test.js",
            "../js/commands_sanity_test.js",
            "../js/reqres_sanity_test.js",
            "../js/courier_sanity_test.js",
            "../js/courier_sanity_no_iframe_test.js"
        ]
    };
});
