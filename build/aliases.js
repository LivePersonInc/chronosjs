module.exports = function (grunt, options) {

    var tasks = ['teamcity', 'node_version', 'jshint', 'env', 'instrument', 'mochaTest', 'storeCoverage', 'makeReport', 'concat', 'concat_in_order'];
    // computation...
    return {
        'tasks': ['availabletasks'],
        'default': tasks,
        'test': [
            'node_version',
            'mochaTest'
        ]
    };
};
