var winston = require('winston');
var {oneLineJson} = require('./logFormat');
var logPath = __dirname + "/logs/logs.log";

// Get log destinations from environment variable (default: 'both')
// Valid values: 'file', 'console', 'both'
const logDestinations = (process.env.LOG_DESTINATIONS || 'both').toLowerCase();

// Builds a fresh set of transports, so that the logger below and the
// express-winston middlewares in index.js can all honour LOG_DESTINATIONS.
// A factory is required because winston binds every transport to the logger
// that uses it, so the same instances cannot be shared between loggers.
const createTransports = () => {
  const transports = [];

  switch (logDestinations) {
    case 'file':
      transports.push(new winston.transports.File({ filename: logPath }));
      break;
    case 'console':
      transports.push(new winston.transports.Console({ timestamp: true }));
      break;
    case 'both':
    default:
      transports.push(new winston.transports.Console({ timestamp: true }));
      transports.push(new winston.transports.File({ filename: logPath }));
      break;
  }

  return transports;
};

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    oneLineJson
  ),
  transports: createTransports()
});


// Structured-logging facade: message is always a string, meta keys land
// top-level in the entry, and ctx carries optional {req,res} request context.
const log = (level, message, meta = {}, ctx = {}) => {
  var entry = {};
  entry.level = level;
  entry.message = message;
  if (ctx.req) {
    if (ctx.req.user && ctx.req.user.sub && ctx.req.user.role) {
      entry.user = {};
      entry.user.sub = ctx.req.user.sub;
      entry.user.role = ctx.req.user.role;
      entry.method = ctx.req.method;
      entry.url = ctx.req.url;
    }
  }
  if (ctx.res) {
    entry.status = ctx.res.statusCode;
    entry.responseTime = ctx.res.responseTime;
  }
  // meta keys land top-level but must never override `level` or `message`
  Object.assign(entry, meta);
  entry.level = level;
  entry.message = message;
  winstonLogger.log(entry);
};

log.debug = (message, meta, ctx) => log('debug', message, meta, ctx);
log.info = (message, meta, ctx) => log('info', message, meta, ctx);
log.warn = (message, meta, ctx) => log('warn', message, meta, ctx);
log.error = (message, meta, ctx) => log('error', message, meta, ctx);


// `log` is the module namespace: it is the callable facade itself, with the
// helpers hanging off it. `createTransports` is exported for the request/error
// loggers in index.js, which need their own transports.
log.createTransports = createTransports;

module.exports = log;
