var winston = require('winston');



const customLogger = (req,res,level,message)=>{
  if(!process.env.NODE_ENV==='test'&&!process.env.NODE_ENV==='test-docker'){
    var log ={};
    log.level =level;
    if(req){
      if(res.user&&req.user.sub&&req.user.role){
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
    else{
      log.message=message;
    }
    logger.log(log);    
  }
}


const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console({'timestamp':true})]

});

module.exports = customLogger;

