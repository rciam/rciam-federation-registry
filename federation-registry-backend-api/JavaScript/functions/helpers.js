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
});

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('breaklines', function(text) {
  text = hbs.Utils.escapeExpression(text);
  text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
  return new hbs.SafeString(text);
});

const delay = ms => new Promise(res => setTimeout(res, ms));

const sendMultipleInvitations = function (data,t) {

  try{
    t.invitation.addMultiple(data).then(async res=>{
      
      for(const invitation_data of data){
        await delay(400);
        sendInvitationMail(invitation_data);
      }
      }).catch(err=>{customLogger(null,null,'warn','Error when creating and sending invitations: '+err)})
  }
  catch(err){
    customLogger(null,null,'warn','Error when creating and sending invitations: '+err);
  }

}




const calcDiff = (oldState,newState,tenant) => {
  
    var new_values = Object.assign({},newState);
    var old_values = Object.assign({},oldState);
    let new_cont = [];
    let old_cont = [];
    let items;
    var edits = {
      add:{
        service_boolean:{}
      },
      dlt:{},
      update:{
        service_boolean:{},
        requested_attributes:[]
      },
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
      if(!old_values.post_logout_redirect_uris){
        old_values.post_logout_redirect_uris = [];
      }
      if(!new_values.post_logout_redirect_uris){
        new_values.post_logout_redirect_uris = [];
      }

      edits.add.oidc_grant_types = new_values.grant_types.filter(x=>!old_values.grant_types.includes(x));
      edits.dlt.oidc_grant_types = old_values.grant_types.filter(x=>!new_values.grant_types.includes(x));
      edits.add.oidc_scopes = new_values.scope.filter(x=>!old_values.scope.includes(x));
      edits.dlt.oidc_scopes = old_values.scope.filter(x=>!new_values.scope.includes(x));
      edits.add.oidc_redirect_uris = new_values.redirect_uris.filter(x=>!old_values.redirect_uris.includes(x));
      edits.dlt.oidc_redirect_uris = old_values.redirect_uris.filter(x=>!new_values.redirect_uris.includes(x));
      edits.add.oidc_post_logout_redirect_uris = new_values.post_logout_redirect_uris.filter(x=>!old_values.post_logout_redirect_uris.includes(x));
      edits.dlt.oidc_post_logout_redirect_uris = old_values.post_logout_redirect_uris.filter(x=>!new_values.post_logout_redirect_uris.includes(x));
    }
    if(new_values.protocol==='saml'){
      if(!old_values.requested_attributes){
        old_values.requested_attributes = [];
      }
      if(!new_values.requested_attributes){
        new_values.requested_attributes = [];
      }
      edits.add.requested_attributes = new_values.requested_attributes.filter(x=> !old_values.requested_attributes.some(e=> e.friendly_name === x.friendly_name));
      edits.dlt.requested_attributes = old_values.requested_attributes.filter(x=> !new_values.requested_attributes.some(e=> e.friendly_name === x.friendly_name));
      edits.update.requested_attributes = new_values.requested_attributes.filter(x=> old_values.requested_attributes.some(e=> e.friendly_name === x.friendly_name&&(e.required!==x.required||e.name!==x.name)));
    }

    for(var property in tenant_config[tenant].form.extra_fields){
      if(tenant_config[tenant].form.extra_fields[property].tag==="coc"||tenant_config[tenant].form.extra_fields[property].tag==="once"){
        if(property in new_values){
          if(property in old_values && old_values[property]!==new_values[property]){
            edits.update.service_boolean[property]=new_values[property];
          }
          else{
            edits.add.service_boolean[property]=new_values[property];
          }
        }

      }
    }
    for(var i in edits){
      for(var key in edits[i]){
        if(edits[i][key].length===0&&key!='requested_attributes'){
          delete edits[i][key]
        }
      }
    }
    delete new_values.requested_attributes;
    delete old_values.requested_attributes;
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


const sendNotif= (data,template_uri,user)=>{
  if(process.env.NODE_ENV!=='test'&&process.env.NODE_ENV!=='test-docker'&&!config.disable_emails){
    readHTMLFile(path.join(__dirname, '../html/', template_uri), function(err, html) {
      let transporter = createTransport();

    var replacements = {
      name:user.name,
      logo_url:tenant_config[data.tenant].logo_url
    };
    var template = hbs.compile(html);
    var htmlToSend = template(replacements);
    var mailOptions = {
      from: tenant_config[data.tenant].sender+" Notifications <noreply@faai.grnet.gr>",
      to : user.email,
      subject : data.subject,
      html : htmlToSend
    };
    transporter.sendMail(mailOptions, function (error, response) {
      if (error) {
        customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{error:error},{user:user},{data:data}]);
      }
      else {user(null,null,'info',[{type:'email_log'},{message:'Email sent'},{user:user},{data:data}]);
      }
    });
    

  });
 
  }
  
}

const sendInvitationMail = async (data) => {

  return new Promise(resolve=>{
    if(process.env.NODE_ENV!=='test-docker'&& process.env.NODE_ENV!=='test'&&!config.disable_emails){
      var currentDate = new Date();
      readHTMLFile(path.join(__dirname, '../html/invitation.hbs'), function(err, html) {
        let transporter = createTransport();

        var template = hbs.compile(html);
        var replacements = {
          invited_by:data.invited_by,
          group_manager:data.group_manager,
          registry_url: tenant_config[data.tenant].base_url,
          tenant:data.tenant,
          logo_url:tenant_config[data.tenant].logo_url,
          url:tenant_config[data.tenant].base_url +'/invitation/' + data.code,
          tenant_signature:tenant_config[data.tenant].tenant_signature
        }
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: tenant_config[data.tenant].sender+" Notifications <noreply@faai.grnet.gr>",
          to : data.email,
          subject : 'Invitation to manage service',
          html : htmlToSend
        };
        return transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            resolve(false);
            customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{template:'invitation'},{error:error},{user:null},{data:data.email}]);
          }
          else {
            resolve(true);
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{template:'invitation'},{user:null},{data:data.email}]);
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
  if(process.env.NODE_ENV!=='test-docker'&& process.env.NODE_ENV!=='test'&&!config.disable_emails){
    var currentDate = new Date();
    readHTMLFile(path.join(__dirname, '../html/new-member-notification.html'), function(err, html) {
      let transporter = createTransport();
      var replacements = {  
        invitation_mail:data.invitation_mail,
        username:data.preferred_username,
        email:data.email,
        url:tenant_config[data.tenant].base_url+'/'+data.url,
        tenant:data.tenant.toUpperCase(),
        logo_url:tenant_config[data.tenant].logo_url,
        tenant_title:tenant_config[data.tenant].sender,
        tenant_signature:tenant_config[data.tenant].tenant_signature
      };
      var template = hbs.compile(html);
      managers.forEach(async (manager)=>{
        replacements.target_email = manager.email;
        replacements.recipient_name = manager.name;
        await delay(400);
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: tenant_config[data.tenant].sender+" Notifications <noreply@faai.grnet.gr>",
          to : manager.email,
          subject : 'New member in your owners group',
          html : htmlToSend
        };
        transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{error:error},{template:'new-member-notification'} ,{user:manager},{data:data}]);
          }
          else {
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{user:manager},{template:'new-member-notification'},{data:data}]);
          }
        });
      })
    })
  }
}

const sendNotifications = (data,template_uri,users) => {
  if(process.env.NODE_ENV!=='test'&&process.env.NODE_ENV!=='test-docker'&&!config.disable_emails){
  readHTMLFile(path.join(__dirname, '../html/', template_uri), function(err, html) {
      let transporter = createTransport();
      var template = hbs.compile(html);
      //var replacements = {username: "John Doe",name:"The name"};
      var replacements = {
        ...data,
        url:tenant_config[data.tenant].base_url+ (data.url?data.url:""),
        logo_url:tenant_config[data.tenant].logo_url,
        tenant_title:tenant_config[data.tenant].sender,
        tenant_signature:tenant_config[data.tenant].tenant_signature
      };
      var htmlToSend = template(replacements);
      users.forEach(async (user) => {
        var mailOptions = {
          from: {
            name: data.sender_name,
            address: data.sender_email
          },
          to : user,
          subject : data.subject + " ["+tenant_config[data.tenant].sender +" Notifications"+"]",
          html : htmlToSend,
          cc : data.cc_emails
        }; 
        await delay(400);
        transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{template:template_uri},{error:error},{user:user},{data:data}]);
          }
          else {
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{template:template_uri},{user:user},{data:data}]);
          }
        });
      });
     


  });
  }
}

const sendMail= (data,template_uri,users)=>{
  var currentDate = new Date();
  var result;
  if(process.env.NODE_ENV!=='test'&&process.env.NODE_ENV!=='test-docker'&&!config.disable_emails){
  readHTMLFile(path.join(__dirname, '../html/', template_uri), function(err, html) {
      let transporter = createTransport();

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
        comment:data.comment,
        logo_url:tenant_config[data.tenant].logo_url,
        ...data,
        url:tenant_config[data.tenant].base_url+ (data.url?data.url:""),
        tenant_title:tenant_config[data.tenant].sender,
        tenant_signature:tenant_config[data.tenant].tenant_signature
      };
      users.forEach(async (user) => {
          replacements.name = user.name;
          var htmlToSend = template(replacements);
          var mailOptions = {
            from:  tenant_config[data.tenant].sender+" Notifications <noreply@faai.grnet.gr>",
            to : user.email,
            subject : data.subject,
            html : htmlToSend
          };
          await delay(400);
          transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
              customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{template:template_uri},{error:error},{user:user},{data:data}]);
            }
            else {
              customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{template:template_uri},{user:user},{data:data}]);
            }
          });
      });

  });
  }
  return result
}


const sendDeploymentMail =  function(data){
  if(process.env.NODE_ENV!=='test'&&process.env.NODE_ENV!=='test-docker'&&!config.disable_emails){
    try{
        if(data&&data.length>0){
          readHTMLFile(path.join(__dirname, '../html/ticket.html'), async function(err, html) {
            let transporter = createTransport();


                data.forEach((ticket_data)=>{
                    let code = makeCode(5);
                    let type = ticket_data.type==='create'?'register':ticket_data.type==='edit'?'reconfigure':'deregister';
                    let service_name = ticket_data.service_name;
                    let requester_email = ticket_data.requester_email;
                    let requester_username = ticket_data.requester_username;
                    let reviewer_email = ticket_data.reviewer_email;
                    let reviewer_username = ticket_data.reviewer_username;
                    let protocol = ticket_data.protocol;
                    let reviewed_at = ticket_data.reviewed_at;
                    let env = ticket_data.integration_environment;
  
                    var mailOptions = {
                      from: ticket_data.reviewer_email,
                      to : tenant_config[ticket_data.tenant].service_integration_notification.email,
                      subject : "Federation Registry: Service integration to "+ ticket_data.integration_environment + " (" + code + ")",
                      text:`A request was made to `+ type +` a service on the `+ env +` environment
                            Service Info
                              service_name: ` + service_name + `
                              service_protocol: ` + protocol + `
                            Submitted by
                              username: `+ requester_username + `
                              email: `+ requester_email + `
                            Approved by
                              username: `+ reviewer_username +`
                              email: `+ reviewer_email +`
                              date_of_approval: `+reviewed_at,
                      cc:ticket_data.reviewer_email
                    };
                    transporter.sendMail(mailOptions, function (error, response) {
                      if (error) {
                        customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{error:error},{recipient:'Ggus'},{ticket_data:ticket_data}]);
                        return true;
                      }
                      else {
                        customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{recipient:'Ggus'},{ticket_data:ticket_data}]);
                        return true;
                      }
                    });
                  

                })
              });
            }

        }catch(err){
          console.log(err);
        }

    }
}

const createTransport = () =>{
  let transporter = nodeMailer.createTransport({
    host: 'relay.grnet.gr',
    port: 587,
    secure: false
  });
  // let transporter = nodeMailer.createTransport({
  //     service: 'gmail',
  //     auth: {
  //         user: 'orionaikido@gmail.com',
  //         pass: ''
  //       }
  //     });
  return transporter
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

const extractServiceBoolean = (service) => {
  if(service.service_boolean){
    service.service_boolean.map(item=>{
      for(const name in item){
        service[name] = item[name];
      }
    });
  }
  delete service.service_boolean;
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


function shallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }
  return true;
}


module.exports = {
  calcDiff,
  addToString,
  sendMail,
  sendInvitationMail,
  newMemberNotificationMail,
  sendMultipleInvitations,
  readHTMLFile,
  extractServiceBoolean,
  sendDeploymentMail,
  delay,
  sendNotif,
  createTransport,
  sendNotifications,
  shallowEqual
}
