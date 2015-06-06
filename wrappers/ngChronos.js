angular.module('Chronos', [])
    .factory('Chronos.Channels', function ($window) {
        var channels = new $window.Chronos.Channels();

        return channels;
    });
