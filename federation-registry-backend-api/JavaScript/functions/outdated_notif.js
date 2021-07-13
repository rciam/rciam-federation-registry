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


  fs.readFile(filePath,'UTF-8').then(date=>{
    let time_passed_sec = Infinity;
    try{
      if(date){
        date = parseInt(date);
        time_passed_sec = (Date.now() - date)/1000
      }
    }
    catch(err){
      console.log(err);
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
  }).catch(err=>{
    console.log(err);
  })





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
          from: "noreply@faai.grnet.gr",
          to : 'koza-sparrow@hotmail.com',
          subject : 'Service Configuration Depricated',
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



module.exports = {
  outdatedNotificationsWorker
}
