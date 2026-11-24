// In this example we are showing how to properly use pg-monitor to log
// errors in a DEV and PROD environments.

// As an alternative for a PROD environment, instead of using pg-monitor
// you could handle event 'error' within initialization options yourself,
// which may be a little better performing, but lacks all the nice formatting
// provided by pg-monitor.
const monitor = require('pg-monitor');
const log = require('../loggers.js');
monitor.setTheme('matrix'); // changing the default theme;

// Flag to indicate whether we are in a DEV environment:
const $DEV = process.env.NODE_ENV === 'development';

// Below we are logging errors exactly the way they are reported by pg-monitor,
// which you can tweak any way you like, as parameter 'info' provides all the
// necessary details for that.
//
// see: https://github.com/vitaly-t/pg-monitor#log
monitor.setLog((msg, info) => {
    // pg-monitor writes to the console itself, which would bypass the
    // configured log destinations, so winston takes over instead.
    info.display = false;

    // In a PROD environment we will only receive event 'error',
    // because this is how we set it up below.

    // And the check below is for DEV environment only, as we want to log
    // errors only, or else the file will grow out of proportion in no time.

    if (info.event === 'error') {
        log.error(msg, { type: 'db' });
    } else {
        log.info(msg, { type: 'db' });
    }
});

class Diagnostics {
    // Monitor initialization function;
    static init(options) {
        if ($DEV) {
            // In a DEV environment, we attach to all supported events:
            monitor.attach(options, ['query', 'error', 'receive', 'task', 'transact']);
        } else {
            // In a PROD environment we should only attach to the type of events
            // that we intend to log. And we are only logging event 'error' here:
            monitor.attach(options, ['error']);
        }
    }
}

module.exports = {Diagnostics};
