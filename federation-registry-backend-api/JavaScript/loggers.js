var winston = require('winston');
var {oneLineJson} = require('./logFormat');
var logPath = __dirname + "/logs/logs.log";



const customLogger = (req,res,level,message,data)=>{
    var log ={};
    log.level =level;
    if(req){
      if(req.user&&req.user.sub&&req.user.role){
        log.user = {};
        log.user.sub = req.user.sub;
        log.user.role = req.user.role;
        log.method= req.method;
        log.url= req.url;
      }
    }
    if(res){
      log.status=res.statusCode;
      log.responseTime= res.responseTime;
    }
    if(Array.isArray(message)){
      Object.assign(log, ...message);
    }
    if(data){
      log.data = data;
    }
    else{
      log.message=message;
    }
    winstonLogger.log(log);

}


const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    oneLineJson
  ),
  transports: [
    new winston.transports.Console({'timestamp':true}),
    new(winston.transports.File)({filename:logPath})]

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


module.exports = customLogger;
// transitional export; customLogger removed in follow-up commit
module.exports.log = log;
