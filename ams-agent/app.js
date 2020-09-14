
const axios = require('axios');
const base64 = require('base-64');
var envPath = __dirname + "/.env";
require('dotenv').config({path:envPath});
const options = {
  headers:{
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.KEY
}};
const publish_url = process.env.AMS + '/projects/' + process.env.PROJECT + "/topics/tasks:publish?key=" +process.env.TOKEN;
const fake_publish_url = process.env.AMS + '/projects/' + process.env.PROJECT + '/topics/updates:publish?key=' +process.env.TOKEN;
const fake_consume_url = process.env.AMS + '/projects/' + process.env.PROJECT + '/subscriptions/mock:pull?key=' +process.env.TOKEN;
var intervalID;


function run() {
  let messages = {
    egi: {
      saml: [],
      oidc: []
    }
  };
  axios.get(process.env.EXPRESS+'/services/pending',options)
  .then(function (response) {
	// handle success
    let data;
    let updateData = {

      egi: {
        saml: [],
        oidc: []
      }
    };
    if(response.data.services){
      response.data.services.forEach((service) => {
        for (var propName in service.json) {
          if (service.json[propName] === null || service.json[propName] === undefined) {
            delete service.json[propName];
          }
        }
        updateData.egi[service.json.protocol].push({id:service.json.id,state:'waiting-deployment'});
        messages.egi[service.json.protocol].push({"attributes":{},"data": Buffer.from(JSON.stringify(service.json)).toString("base64")});
      });
      if(messages.egi.oidc>0){
        data={"messages":messages.egi.oidc};
        axios.post(publish_url_oidc,data, options).then((res) => {
          if(res.status===200){
            axios.put(process.env.EXPRESS+'/services/state',updateData.egi.oidc,options).then((res)=>{
              if(res.status===200){
                fakeThirdParty(updateData);
                if(res.success===false){
                 console.log(res.error);
                }
              }
            });
          }
        });
      }
      if(messages.egi.saml>0){
        data={"messages":messages.egi.saml};
        axios.post(publish_url_saml,data, options).then((res) => {
          if(res.status===200){
            axios.put(process.env.EXPRESS+'/services/state',updateData.egi.saml,options).then((res)=>{
              if(res.status===200){
                fakeThirdParty(updateData);
                if(res.success===false){
                 console.log(res.error);
                }
              }
            });
          }
        });
      }
    }
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
}

function fakeThirdParty(data){
  let messages = [];
  data.forEach((message,i)=>{
    data[i].state = 'deployed';
    messages.push({"attributes":{},"data": Buffer.from(JSON.stringify(data[i])).toString("base64")});
  });
  data={"messages":messages};
  axios.post(fake_publish_url,data, options).then((res) => {
    if(res.status===200){
    }
  });
}
// function checkConsumer(){
//   data = {"MaxMessages":"5"};
//   let response = [];
//   let ackIds = [];
//   axios.post(fake_consume_url,data,options).then((res)=>{
//     console.log(res);
//     if(res.data.receivedMessages.length>0){
//       res.data.receivedMessages.forEach(message=>{
//         ackIds.push(message.message.ackId);
//         response.push(JSON.parse(Buffer.from(message.message.data, 'base64').toString()));
//       })
//     }
//     console.log('we have new stuff');
//     console.log(response);
//   })
//
// }


function stopClock() {
    clearInterval(intervalID);
}

// var intervalFake = setInterval(checkConsumer,10000);
var intervalID = setInterval(run, 10000);
