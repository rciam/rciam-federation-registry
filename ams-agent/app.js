
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
let tenants = [];
let agents = {};

var intervalID;
axios.get(process.env.EXPRESS+'/agent/get_agents',options)
.then(function (response) {
   response.data.agents.forEach(agent => {
     if(!tenants.includes(agent.tenant)){
       tenants.push(agent.tenant);
       agents[agent.tenant] = {};
     }
     if(!agents[agent.tenant][agent.entity_type]){
       agents[agent.tenant][agent.entity_type] = {};
     }
     if(!agents[agent.tenant][agent.entity_type][agent.entity_protocol]){
       agents[agent.tenant][agent.entity_type][agent.entity_protocol] = [];
     }
     agents[agent.tenant][agent.entity_type][agent.entity_protocol] = process.env.AMS + '/projects/' + process.env.PROJECT + "/topics/"+ agent.tenant+"_"+ agent.entity_type + "_" + agent.entity_protocol+":publish?key=" +process.env.TOKEN;
   });
   var intervalID = setInterval(run, 10000);
}).catch(err=> {console.log(err)})


function run() {
  axios.get(process.env.EXPRESS+'/agent/get_new_configurations',options)
  .then(function (response) {
	// handle success
    if(response.data.services){
        response.data.services.forEach((service) => {
          for (var propName in service.json) {
            if (service.json[propName] === null || service.json[propName] === undefined) {
              delete service.json[propName];
            }
          }
          let messages = [{"attributes":{},"data": Buffer.from(JSON.stringify(service.json)).toString("base64")}];

          axios.post(agents[service.json.tenant].service[service.json.protocol],{"messages":messages}, options).then((res) => {
            if(res.status===200){
              axios.put(process.env.EXPRESS+'/agent/set_services_state',[{id:service.json.id,state:'waiting-deployment'}],options).then((res)=>{
                if(res.status===200){
                  if(res.success===false){
                   console.log(res.error);
                  }
                }
              }).catch(err=>{console.log(err)});
            }
          }).catch(err => {console.log(err)});

        });
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
