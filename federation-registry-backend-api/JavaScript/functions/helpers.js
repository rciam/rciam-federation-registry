var diff = require('deep-diff').diff;
require('dotenv').config();
var path = require("path");

var fs = require('fs');
var handlebars = require('handlebars');
nodeMailer = require('nodemailer');
const customLogger = require('../loggers.js');

const calcDiff = (oldState,newState) => {
    var new_values = Object.assign({},newState);
    var old_values = Object.assign({},oldState);
    let new_cont = [];
    let old_cont = [];
    let items;
    var edits = {
      add:{},
      dlt:{},
      details:{}
    };


    new_values.contacts.forEach(item=>{
      new_cont.push(item.email+' '+item.type);
    });
    old_values.contacts.forEach(item=>{
      old_cont.push(item.email+' '+item.type);
    });
    edits.add.contacts = new_cont.filter(x=>!old_cont.includes(x));
    edits.dlt.contacts = old_cont.filter(x=>!new_cont.includes(x));
    if(edits.add.contacts.length>0){
        edits.add.contacts.forEach((item,index)=>{
          items = item.split(' ');
          edits.add.contacts[index] = {email:items[0],type:items[1]};
        })
    }
    if(edits.dlt.contacts.length>0){
        edits.dlt.contacts.forEach((item,index)=>{
          items = item.split(' ');
          edits.dlt.contacts[index] = {email:items[0],type:items[1]};
      })
    }
    if(new_values.protocol==='oidc'){
      edits.add.oidc_grant_types = new_values.grant_types.filter(x=>!old_values.grant_types.includes(x));
      edits.dlt.oidc_grant_types = old_values.grant_types.filter(x=>!new_values.grant_types.includes(x));
      edits.add.oidc_scopes = new_values.scope.filter(x=>!old_values.scope.includes(x));
      edits.dlt.oidc_scopes = old_values.scope.filter(x=>!new_values.scope.includes(x));
      edits.add.oidc_redirect_uris = new_values.redirect_uris.filter(x=>!old_values.redirect_uris.includes(x));
      edits.dlt.oidc_redirect_uris = old_values.redirect_uris.filter(x=>!new_values.redirect_uris.includes(x));
    }
    for(var i in edits){
      for(var key in edits[i]){
        if(edits[i][key].length===0){
          delete edits[i][key]
        }
      }
    }
    delete new_values.grant_types;
    delete new_values.contacts;
    delete new_values.redirect_uris;
    delete new_values.scope;
    delete old_values.grant_types;
    delete old_values.contacts;
    delete old_values.redirect_uris;
    delete old_values.scope;
    if(diff(old_values,new_values)){
      edits.details = new_values;
    }
    return edits
}

const sendInvitationMail = async (data) => {
  return new Promise(resolve=>{
    if(process.env.NODE_ENV!=='test-docker'&& process.env.NODE_ENV!=='test'){
      var currentDate = new Date();
      readHTMLFile(path.join(__dirname, '../html/invitation.hbs'), function(err, html) {
        let transporter = nodeMailer.createTransport({
            host: 'relay.grnet.gr',
            port: 587,
            secure: false
        });
        var template = handlebars.compile(html);
        var replacements = {
          invited_by:data.invited_by,
          group_manager:data.group_manager,
          email:data.email,
          registry_url: process.env.EXPRESS_BASE+'/'+ data.tenant,
          url:process.env.EXPRESS_BASE+'/'+ data.tenant +'/invitation/' + data.code
        }
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: "noreply@faai.grnet.gr",
          to : 'koza-sparrow@hotmail.com',
          subject : 'Invitation to manage service',
          html : htmlToSend
        };
        return transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            resolve(false);
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email not sent'},{error:error},{user:null},{data:data.email}]);
          }
          else {
            resolve(true);
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{user:null},{data:data.email}]);
          }
        });
      });
    }
    else{
      resolve(true);
    }

  });

}
const newMemberNotificationMail = (data,managers) => {
  if(process.env.NODE_ENV!=='test-docker'&& process.env.NODE_ENV!=='test'){
    var currentDate = new Date();
    readHTMLFile(path.join(__dirname, '../html/new-member-notification.html'), function(err, html) {
      let transporter = nodeMailer.createTransport({
          host: 'relay.grnet.gr',
          port: 587,
          secure: false
      });
      var replacements = {
        invitation_mail:data.invitation_mail,
        username:data.preferred_username,
        email:data.email,
        url:process.env.EXPRESS_BASE+'/'+ data.tenant
      };
      var template = handlebars.compile(html);
      managers.forEach((manager)=>{
        replacements.target_email = manager.email;
        replacements.username = manager.username;

        var htmlToSend = template(replacements);
        var mailOptions = {
          from: "noreply@faai.grnet.gr",
          to : 'koza-sparrow@hotmail.com',
          subject : 'New member in your owners group',
          html : htmlToSend
        };
        transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email not sent'},{error:error},{user:manager},{data:data}]);
          }
          else {
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{user:manager},{data:data}]);
          }
        });
      })
    })
  }
}

const sendMail= (data,template_uri,users)=>{
  var currentDate = new Date();
  var result;
  if(!(process.env.NODE_ENV==='test')&&!(process.env.NODE_ENV==='test-docker')){
  readHTMLFile(path.join(__dirname, '../html/', template_uri), function(err, html) {
      let transporter = nodeMailer.createTransport({
          host: 'relay.grnet.gr',
          port: 587,
          secure: false
      });
      var template = handlebars.compile(html);
      //var replacements = {username: "John Doe",name:"The name"};
      var state;
      if(data.state){
        if(data.state==='deployed'){
          state= 'Deployed';
        }
        else if(data.state==='error'){
          state= 'Deployment Malfunction';
        }
        else{
          state=data.state
        }
      }
      var replacements = {
        service_name:data.service_name,
        date:currentDate,
        state:state,
        url:process.env.EXPRESS_BASE+'/'+ data.tenant
      };

      users.forEach((user) => {
          replacements.name = user.name;
          replacements.email = user.email;
          var htmlToSend = template(replacements);
          var mailOptions = {
            from: "noreply@faai.grnet.gr",
            to : 'koza-sparrow@hotmail.com',
            subject : data.subject,
            html : htmlToSend
          };
          transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
              customLogger(null,null,'info',[{type:'email_log'},{message:'Email not sent'},{error:error},{user:users},{data:data}]);
            }
            else {
              customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{user:users},{data:data}]);
            }
          });
      });

  });
  }
  return result
}

const addToString = (str,value) =>{
  let sentence='';
  const words = str.split('_');
  words.forEach((item,index)=>{
    if(index==1){
      sentence = sentence + value + '_';
    }
    sentence=sentence + item +'_';
  });
  sentence = sentence.slice(0,-1);
  return sentence
}
var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};


module.exports = {
  calcDiff,
  addToString,
  sendMail,
  sendInvitationMail,
  newMemberNotificationMail
}
