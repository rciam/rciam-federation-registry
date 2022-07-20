const qs = require('qs');
const customLogger = require('../loggers.js');
const axios = require('axios').default;
const {db} = require('../db');
const { ResultWithContext } = require('express-validator/src/chain');
const e = require('express');
const base64url = require('base64url');

function adminAuth(req,res,next){
    if(req.header('X-Api-Key')===process.env.ADMIN_AUTH_KEY){
      next();
    }else{
      
      res.status(401).send("Unauthorized");
    }
  }

function actionAuthorization(action){
  return function(req, res, next) {
    if(req.user.role.actions.includes(action)){
      next();
    }
    else{
      res.status(401).send("Unauthorized Action");
    }
  }

}


function decode(jwt) {
  const [headerB64, payloadB64] = jwt.split('.');
  const payloadStr = JSON.parse(base64url.decode(payloadB64));
  return payloadStr.user;
}

function authenticate(req,res,next){
  try{
    var clients = req.app.get('clients');
    if(process.env.NODE_ENV==='test-docker'||process.env.NODE_ENV==='test'){      
      let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
      if (token && token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
        req.user = decode(token);
        db.user_role.getRoleActions(req.user.sub,req.params.tenant).then(role=>{
          if(role){
            req.user.role = role;
            next();
          }
          else{
            res.status(401).send('Unauthenticated Request');
          }
        }).catch(err=>{
          next(err)});
      }
      else{
        res.status(500).send("Need userToken");
      }
    }
    else{

      const data = {'client_secret':clients[req.params.tenant].client_secret}
      if(req.headers.authorization){
        TokenArray = req.headers.authorization.split(" ");
        clients[req.params.tenant].userinfo(TokenArray[1]).then(userinfo => {
          req.user = userinfo;
          if(req.user.sub){
            db.user_role.getRoleActions(req.user.sub,req.params.tenant).then(role=>{
              if(role){
                req.user.role = role;
                next();
              }
              else{
                res.status(401).send('Unauthenticated Request');
              }
            }).catch((err)=> {
              customLogger(req,res,'warn','Unauthenticated request'+err);
              res.status(401).end();
            });
          }
          else{res.status(401).end();}
        }).catch(err=> {
          console.log(err);
          res.status(401).end();
        })
      }
      else{
        res.status(401).end();
      }
    }

  }
  catch(err){
    customLogger(req,res,'warn','Unauthenticated request'+err);
    next(err);
  }

}


  module.exports = {adminAuth,authenticate,actionAuthorization}