
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
  let messages = [];
  axios.get(process.env.EXPRESS+'/getPending',options)
  .then(function (response) {
    // handle success
    let updateData = [];
    if(response.data.services){
      response.data.services.forEach((service) => {
        updateData.push({id:service.json.id,state:'waiting-deployment'});
        messages.push({"attributes":{},"data": Buffer.from(JSON.stringify(service.json)).toString("base64")});
      });
      if(messages.length>0){
        data={"messages":messages};
        axios.post(publish_url,data, options).then((res) => {
          if(res.status===200){
            axios.put(process.env.EXPRESS+'/updateState',updateData,options).then((res)=>{
              if(res){
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
    data[i].state = 'error';
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
