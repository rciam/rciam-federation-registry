var winston = require('winston');



const customLogger = (req,res,level,message)=>{
  var log ={};
  log.level =level;
  log.status=res.statusCode;
  log.message=message;
  if(req.user){
    log.user.sub = req.user.sub;
    log.user.role = req.user.role;
  }
  log.method= req.method;
  log.url= req.url;
  log.responseTime= res.responseTime;
  logger.log(log);
}


const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console({'timestamp':true})]

});

module.exports = customLogger;
