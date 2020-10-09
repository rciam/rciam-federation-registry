
const axios = require('axios');
const base64 = require('base-64');
var envPath = __dirname + "/.env";
require('dotenv').config({path:envPath});
const options = {
  headers:{
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.KEY
}};
const publish_url_oidc = process.env.AMS + '/projects/' + process.env.PROJECT + "/topics/egi-oidc:publish?key=" +process.env.TOKEN;
const publish_url_saml = process.env.AMS + '/projects/' + process.env.PROJECT + "/topics/egi-saml:publish?key=" +process.env.TOKEN;

var intervalID;


function run() {
  let messages = {
    egi: {
      saml: [],
      oidc: []
    }
  };
  axios.get(process.env.EXPRESS+'/ams/get_new_configurations',options)
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
      if(messages.egi.oidc.length>0){

        data={"messages":messages.egi.oidc};
        console.log(data);
        axios.post(publish_url_oidc,data, options).then((res) => {
          if(res.status===200){
            console.log('success1');
            axios.put(process.env.EXPRESS+'/agent/set_services_state',updateData.egi.oidc,options).then((res)=>{
              if(res.status===200){
                console.log('success2');
                if(res.success===false){
                 console.log(res.error);
                }
              }
            });
          }
        });
      }
      if(messages.egi.saml.length>0){
        data={"messages":messages.egi.saml};
        console.log(data);
        axios.post(publish_url_saml,data, options).then((res) => {
          if(res.status===200){
            console.log('success1');
            axios.put(process.env.EXPRESS+'/agent/set_services_state',updateData.egi.saml,options).then((res)=>{
              if(res.status===200){
                console.log('success2');
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


function stopClock() {
    clearInterval(intervalID);
}

// var intervalFake = setInterval(checkConsumer,10000);
var intervalID = setInterval(run, 10000);
