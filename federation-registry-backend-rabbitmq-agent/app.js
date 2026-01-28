const axios = require("axios");
var config = require("./config");
var amqp = require("amqplib");
const ResultMessageBatchClass = require("./ResultMessageBatch");

const rabbitConnUrl =
  "amqp://" +
  config.rabbitmq_user +
  ":" +
  config.rabbitmq_pass +
  "@" +
  config.rabbitmq_host +
  "/" +
  config.rabbitmq_vhost;
let connection;
let publishChannel;
let consumeChannel;

let queueNames = {};
let setStateArray = [];
let setStateTask;
let ResultMessageBatch = new ResultMessageBatchClass();
let sendResultTask;
let sendResultTaskRunning = false;

const options = {
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": config.express_key,
  },
};

const publishResultsOptions = {
  headers: {
    "Content-Type": "application/json",
    authorization: config.ams_auth_key,
  },
};

async function ensureQueueExists(queueName, channel) {
  await channel.assertQueue(queueName, { durable: true });
}

async function setupRabbitMQChannels() {
  connection = await amqp.connect(rabbitConnUrl);

  publishChannel = await connection.createChannel();
  consumeChannel = await connection.createChannel();

  await ensureQueueExists(
    config.rabbitmq_update_status_q,
    consumeChannel
  );
  const callback = async function callback(msg) {
    if (msg === null) return;
    try {
      ResultMessageBatch.addMessage(msg.content.toString());
      consumeChannel.ack(msg);
      if (!sendResultTaskRunning) {
        sendResultTask = setInterval(() => {
          sendResult();
        }, 1500);
        sendResultTaskRunning = true;
      }
    } catch (err) {
      console.error("Error:", err);
      consumeChannel.nack(msg, false, false);
    }
  };
  consumeChannel.consume(config.rabbitmq_update_status_q, callback);
}

(async () => {
  let currentDelay = 2000;  // 2 seconds
  const maxDelay = 30000;   // 30 seconds

  while (true) {
    try {
      await setupRabbitMQChannels();

      const response = await axios.get(
        config.express_url + "/agent/get_agents",
        options
      );
      const agents = response.data.agents;

      let tenants = [];
      for (let i = 0; i < agents.length; i++) {
        let agent = agents[i];
        let currentQ =
          config.env +
          "_" +
          agent.tenant +
          "_" +
          agent.entity_type +
          "_" +
          agent.type +
          "_" +
          agent.integration_environment;

        await ensureQueueExists(currentQ, publishChannel);

        if (!tenants.includes(agent.tenant)) {
          tenants.push(agent.tenant);
          queueNames[agent.tenant] = {};
        }
        if (!queueNames[agent.tenant][agent.entity_type]) {
          queueNames[agent.tenant][agent.entity_type] = {};
        }
        if (
          !queueNames[agent.tenant][agent.entity_type][agent.entity_protocol]
        ) {
          queueNames[agent.tenant][agent.entity_type][
            agent.entity_protocol
          ] = {};
        }
        if (
          !queueNames[agent.tenant][agent.entity_type][agent.entity_protocol][
            agent.integration_environment
          ]
        ) {
          queueNames[agent.tenant][agent.entity_type][agent.entity_protocol][
            agent.integration_environment
          ] = [];
        }
        queueNames[agent.tenant][agent.entity_type][agent.entity_protocol][
          agent.integration_environment
        ] = currentQ;
      }

      console.log("App initialization successful.");
      setInterval(run, 10000);
      break;

    } catch (err) {
      console.error(`Error initializing app: ${err.message}`);
      
      if (connection) {
        try {
          await connection.close(); 
        } catch (closeErr) {
           // Ignore close errors
        }
      }

      console.log(`Retrying in ${currentDelay / 1000} seconds...`);
      
      await sleep(currentDelay);

      currentDelay = Math.min(currentDelay * 2, maxDelay);
    }
  }
})();

async function sendResult() {
  axios
    .post(
      config.express_url + "/ams/ingest",
      ResultMessageBatch.toJSON(),
      publishResultsOptions
    )
    .then((res) => {
      if (res.status != 200) {
        console.log("Could not send result, trying again...");
      } else {
        ResultMessageBatch.clear();
        clearInterval(sendResultTask);
        sendResultTaskRunning = false;
      }
    })
    .catch((err) => {
      console.log("Could not upload result, trying again...");
    });
}

async function setServiceState() {
  axios
    .put(
      config.express_url + "/agent/set_services_state",
      setStateArray,
      options
    )
    .then((res) => {
      if (res.status != 200) {
        console.log("Could not set state trying again...");
      } else {
        setStateArray = [];
        clearInterval(setStateTask);
      }
    })
    .catch((err) => {
      console.log("Could not set state trying again...");
    });
}

async function run() {
  if (setStateArray.length !== 0) {
    return;
  }
  // check if config hasn't changed
  axios
    .get(config.express_url + "/agent/get_new_configurations", options)
    .then(async function (response) {
      if (response.data.services && response.data.services.length > 0) {
        handleSuccess(response);
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
}

async function handleSuccess(response) {
  let service;
  // fix format of the data
  for (let index = 0; index < response.data.services.length; index++) {
    service = response.data.services[index];
    if (
      service.json.post_logout_redirect_uris &&
      service.json.post_logout_redirect_uris.length > 0
    ) {
      service.json.redirect_uris = [
        ...service.json.redirect_uris,
        ...service.json.post_logout_redirect_uris,
      ];
    }
    for (var propName in service.json) {
      if (
        service.json[propName] === null ||
        service.json[propName] === undefined
      ) {
        delete service.json[propName];
      }
    }
    if (service.json.jwks) {
      try {
        service.json.jwks = JSON.parse(service.json.jwks);
      } catch (err) {
        console.log(err);
      }
    }
    let msg = [service.json];

    // Updated by Jan Pavlíček (xpavli95@stud.fit.vutbr.cz) to use merged propagation environment from the configuration when
    // merging of integration environments is enabled
    let propagation_integration_environment =
      service.json.integration_environment;
    if (
      "merge_environments_on_deploy" in config &&
      config.merge_environments_on_deploy
    ) {
      propagation_integration_environment =
        config.merged_integration_environment_name;
    }

    setStateArray.push({
      id: service.json.id,
      state: "waiting-deployment",
      protocol: service.json.protocol,
      tenant: service.json.tenant,
      integration_environment: service.json.integration_environment,
    });

    publishChannel.sendToQueue(
      queueNames[service.json.tenant].service[service.json.protocol][
        propagation_integration_environment
      ],
      Buffer.from(JSON.stringify(msg))
    );

    let log = {
      topic:
        queueNames[service.json.tenant].service[service.json.protocol][
          propagation_integration_environment
        ],
      tenant: service.json.tenant,
      service_id: service.json.id,
      external_id: service.json.external_id,
      integration_environment: service.json.integration_environment,
      deployment_type: service.json.deployment_type,
      protocol: service.json.protocol,
    };
    console.log("Successfully Pushed Message to RabbitMQ");
  }
  if (setStateArray.length > 0) {
    setStateTask = setInterval(function () {
      setServiceState(setStateArray);
    }, 1500);
  }
}
