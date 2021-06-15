var diff = require('deep-diff').diff;
require('dotenv').config();
var path = require("path");
var fs = require('fs');
var hbs = require('handlebars');
nodeMailer = require('nodemailer');
var config = require('../config');
const customLogger = require('../loggers.js');


hbs.registerHelper('loud', function (aString) {
    return aString.toUpperCase()
})

const sendMultipleInvitations = function (data,t) {

  try{
    t.invitation.addMultiple(data).then(res=>{data.forEach(invitation_data=>{
      sendInvitationMail(invitation_data);
    })}).catch(err=>{customLogger(null,null,'warn','Error when creating and sending invitations: '+err)})
  }
  catch(err){
    customLogger(null,null,'warn','Error when creating and sending invitations: '+err);
  }

}

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

    if(!old_values.contacts){
      old_values.contacts = [];
    }
    if(!new_values.contacts){
      new_values.contacts = [];
    }
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
      if(!old_values.redirect_uris){
        old_values.redirect_uris = [];
      }
      if(!new_values.redirect_uris){
        new_values.redirect_uris = [];
      }
      if(!old_values.scope){
        old_values.scope = [];
      }
      if(!new_values.scope){
        new_values.scope = [];
      }
      if(!old_values.grant_types){
        old_values.scope = [];
      }
      if(!new_values.grant_types){
        new_values.scope = [];
      }
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
        // let transporter = nodeMailer.createTransport({
        //   service: 'gmail',
        //   auth: {
        //     user: 'orionaikido@gmail.com',
        //     pass: ''
        //   }
        // });
        var template = hbs.compile(html);
        var replacements = {
          invited_by:data.invited_by,
          group_manager:data.group_manager,
          registry_url: process.env.REACT_BASE+'/'+ data.tenant,
          tenant:data.tenant,
          url:process.env.REACT_BASE+'/'+ data.tenant +'/invitation/' + data.code
        }
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: "noreply@faai.grnet.gr",
          to : data.email,
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
      // let transporter = nodeMailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: 'orionaikido@gmail.com',
      //     pass: ''
      //   }
      // });
      var replacements = {
        invitation_mail:data.invitation_mail,
        username:data.preferred_username,
        email:data.email,
        url:process.env.REACT_BASE+'/'+ data.tenant
      };
      var template = hbs.compile(html);
      managers.forEach((manager)=>{
        replacements.target_email = manager.email;
        replacements.username = manager.username;

        var htmlToSend = template(replacements);
        var mailOptions = {
          from: "noreply@faai.grnet.gr",
          to : manager.email,
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
  if(process.env.NODE_ENV!=='test'&&process.env.NODE_ENV!=='test-docker'){
  readHTMLFile(path.join(__dirname, '../html/', template_uri), function(err, html) {
      let transporter = nodeMailer.createTransport({
          host: 'relay.grnet.gr',
          port: 587,
          secure: false
      });
      // let transporter = nodeMailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: 'orionaikido@gmail.com',
      //     pass:
      //   }
      // });
      var template = hbs.compile(html);
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
        url:process.env.REACT_BASE+'/'+ data.tenant
      };

      users.forEach((user) => {
          replacements.name = user.name;
          var htmlToSend = template(replacements);
          var mailOptions = {
            from: "noreply@faai.grnet.gr",
            to : user.email,
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


const createGgusTickets = async (ids,t)=>{
  if(process.env.NODE_ENV!=='test'&&process.env.NODE_ENV!=='test-docker'){

    t.service_petition_details.getTicketInfo(ids,config.restricted_env.egi.env).then(async data=>{

    readHTMLFile(path.join(__dirname, '../html/ticket.html'), async function(err, html) {
        let transporter = nodeMailer.createTransport({
            host: 'relay.grnet.gr',
            port: 587,
            secure: false
        });
        // let transporter = nodeMailer.createTransport({
        //   service: 'gmail',
        //   auth: {
        //     user: 'orionaikido@gmail.com',
        //     pass:
        //   }
        // });
        var template = hbs.compile(html);
        let ticket_data;
          data.forEach(ticket_data=>{
            var replacements = {
              reviewed_at:ticket_data.reviewed_at,
              reviewer_username:ticket_data.reviewer_username,
              requester_email:ticket_data.requester_email,
              requester_username:ticket_data.requester_username,
              protocol:ticket_data.protocol,
              service_name:ticket_data.service_name,
              env:ticket_data.integration_environment,
              action:(ticket_data.type==='create'?'register':ticket_data.type==='edit'?'reconfigure':'deregister'),
              reviewer_email:ticket_data.reviewer_email
            };

            let code = makeCode(5);
            var htmlToSend = template(replacements);
            var mailOptions = {
              from: "noreply@faai.grnet.gr",
              to : config.ggus_email,
              subject : "Federation Registry: Service integration to "+ ticket_data.integration_environment + " (" + code + ")",
              html : htmlToSend,
              cc:ticket_data.reviewer_email
            };
            transporter.sendMail(mailOptions, function (error, response) {
              if (error) {
                return true;
                customLogger(null,null,'info',[{type:'email_log'},{message:'Email not sent'},{error:error},{recipient:'Ggus'},{ticket_data:ticket_data}]);
              }
              else {
                return true;
                customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{recipient:'Ggus'},{ticket_data:ticket_data}]);
              }
            });

          })
        });
      }).catch(err=> {
          customLogger(null,null,'info',[{type:'email_log'},{message:'Email not sent'},{error:err},{recipient:'Ggus'},{ticket_data:ticket_data}]);
      })
    }

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

const extractCoc = (service) => {
  if(service.coc){
    service.coc.map(item=>{
      for(const name in item){
        service[name] = item[name];
      }
    });
  }
  delete service.coc;
  return service;
}

function makeCode(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() *
 charactersLength));
   }
   return result;
}


module.exports = {
  calcDiff,
  addToString,
  sendMail,
  sendInvitationMail,
  newMemberNotificationMail,
  sendMultipleInvitations,
  readHTMLFile,
  extractCoc,
  createGgusTickets
}
