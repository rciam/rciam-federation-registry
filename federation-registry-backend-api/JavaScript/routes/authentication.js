const qs = require('qs');
const customLogger = require('../loggers.js');
const axios = require('axios').default;
const {db} = require('../db');
const { ResultWithContext } = require('express-validator/src/chain');
const e = require('express');
const base64url = require('base64url');
var CryptoJS = require("crypto-js");


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

function clearCookies(res,domain){
  domain = domain.replace( /:[0-9]{0,4}.*/, '' );
  res.clearCookie('id_token',{domain});
  res.clearCookie('access_token',{domain});
  return res;
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
      if(req.headers.authorization||req.cookies.access_token){
        let access_token = req.cookies.access_token||req.headers.authorization.split(" ")[1];  
        if(req.cookies.access_token){
          let hash = req.app.get('hash');
          access_token = CryptoJS.AES.decrypt(access_token,hash).toString(CryptoJS.enc.Utf8);
          req.cookies.access_token = access_token 
        }
        clients[req.params.tenant].userinfo(access_token).then(userinfo => {
          req.user = userinfo;
          if(req.user.sub){
            db.user_role.getRoleActions(req.user.sub,req.params.tenant).then(role=>{
              if(role){
                req.user.role = role;
                next();
              }
              else{
                res = clearCookies(res,req.headers.host);                
                res.status(401).send('Unauthenticated Request');
              }
            }).catch((err)=> {
              res = clearCookies(res,req.headers.host);
              customLogger(req,res,'warn','Unauthenticated request'+err);
              res.status(401).end();
            });
          }
          else{
            res = clearCookies(res,req.headers.host);
            res.status(401).end();}
        }).catch(err=> {
          res = clearCookies(res,req.headers.host);
          res.status(401).end();
        })
      }
      else{
        res = clearCookies(res,req.headers.host);
        res.status(401).end();
      }
    }
  }
  catch(err){
    res = clearCookies(res,req.headers.host);
    customLogger(req,res,'warn','Unauthenticated request'+err);
    next(err);
  }

}


  module.exports = {adminAuth,authenticate,actionAuthorization,clearCookies}