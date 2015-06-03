module.exports = function (grunt, options) {

    var tasks = ['node_version', 'jshint', 'env', 'instrument', 'connect', 'mocha', 'makeReport', 'concat', 'concat_in_order'];
    return {
        'tasks': ['availabletasks'],
        'default': tasks,
        'test': [
            'node_version',
            'mochaTest'
        ]
    };
};
