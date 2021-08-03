fs = require('mz/fs');
const path = require('path')
const {db} = require('../db');
const filePath = path.resolve(__dirname+'/last_notif');
require('dotenv').config();
var fs2 = require('fs');
var hbs = require('handlebars');
nodeMailer = require('nodemailer');
const customLogger = require('../loggers.js');
const {delay,readHTMLFile} = require('./helpers');

const outdatedNotificationsWorker =  async(interval_seconds) =>{
  
  
  const sendNotif = () =>{
  //  console.log(db);
    db.service_state.getOutdatedOwners().then(async users=>{
      if(users){
        console.log('Sending notication to the users');
        console.log(users);
        // Save last succesfull notification
        saveLastNotif();
        for(const user of users){
          await delay(400);
          sendOutdatedNotification(user);
        }

      }
    }).catch(err=>{customLogger(null,null,'warn','Error when creating and sending invitations: '+err)})
  };

  const saveLastNotif = async () => {
    fs.writeFile(filePath, Date.now(), 'UTF-8',function (err) {
      if (err) return console.log(err);
    });
  }

  const readFromFile = async () => {
    return await fs.readFile(filePath,'UTF-8',function (err,last_notif) {
      if (err) {
        return console.log(err);
      }
      return last_notif;
    });
  }

  try{
    if(typeof(interval_seconds)!=='number'||interval_seconds>2147483){
      interval_seconds = 2147483;
    }
    if(interval_seconds<43200){
      interval_seconds = 43200;
    }
  
    fs.readFile(filePath,'UTF-8').then(date=>{
      let time_passed_sec = Infinity;
      try{
        if(date){
          date = parseInt(date);
          time_passed_sec = (Date.now() - date)/1000;
        }
      }
      catch(error){
        customLogger(null,null,'error',[{type:'outdated_notifications'},{message:'Error when sending notifications about outdated services'},{error:error.stack},{interval:interval_seconds}]);
      }
      if(time_passed_sec>interval_seconds){
        sendNotif();
        setInterval(function(){
          sendNotif();
        },interval_seconds*1000);
      }
      else if(time_passed_sec<interval_seconds){
        setTimeout(function(){
          sendNotif();
          setInterval(function(){
            sendNotif();
          },interval_seconds*1000);
        },(interval_seconds-time_passed_sec)*1000);
      }
    }).catch(error=>{
      customLogger(null,null,'error',[{type:'outdated_notifications'},{message:'Error when sending notifications about outdated services'},{error:error.stack},{interval:interval_seconds}]);
    })
  }catch(error){
    customLogger(null,null,'error',[{type:'outdated_notifications'},{message:'Error when sending notifications about outdated services'},{test:error.stack},{interval:interval_seconds}]);
  }
  





}

const sendOutdatedNotification = async (data) => {

  return new Promise(resolve=>{
    if(process.env.NODE_ENV!=='test-docker'&& process.env.NODE_ENV!=='test'){
      var currentDate = new Date();
      readHTMLFile(path.join(__dirname, '../html/outdated_notif.hbs'), function(err, html) {
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
          username:data.username,
          tenant:data.tenant,
          url:process.env.REACT_BASE+'/'+ data.tenant
        }
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: data.tenant.toUpperCase()+" Check-in Notifications <noreply@faai.grnet.gr>",
          to : data.email,
          subject : 'Service Configuration Update Required',
          html : htmlToSend
        };
        return transporter.sendMail(mailOptions, function (error, response) {
          if (error) {
            resolve(false);
            customLogger(null,null,'error',[{type:'email_log'},{message:'Email not sent'},{template:"outdated_notif"},{error:error},{...data}]);
          }
          else {
            resolve(true);
            customLogger(null,null,'info',[{type:'email_log'},{message:'Email sent'},{template:"outdated_notif"},{...data}]);
          }
        });
      });
    }
    else{
      resolve(true);
    }

  });

}



module.exports = {
  outdatedNotificationsWorker
}
