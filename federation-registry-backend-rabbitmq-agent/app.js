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
let isReconnecting = false;
let isShuttingDown = false;
let runIntervalTask = null;

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

async function createConnection() {
  console.log("Attempting to connect to RabbitMQ...");
  connection = await amqp.connect(rabbitConnUrl);

  connection.on("error", (err) => {
    console.error("[AMQP] Connection error:", err.message);
    scheduleRestart();
  });
  connection.on("close", () => {
    console.error("[AMQP] Connection closed.");
    if(!isShuttingDown){
      scheduleRestart();
    }
  });
}

async function createChannel() {
  const channel = await connection.createChannel();
  channel.on("error", (err) => {
    console.error("[AMQP] Publish channel error:", err.message);
  });
  channel.on("close", () => {
    console.error("[AMQP] Publish channel closed! Restarting...");
    scheduleRestart();
  });
  return channel;
}

async function setupRabbitMQChannels() {
  await createConnection();

  publishChannel = await createChannel();
  consumeChannel = await createChannel();

  await ensureQueueExists(config.rabbitmq_update_status_q, consumeChannel);
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
  console.log("RabbitMQ Connected & Channels Ready.");
}

async function setupQueues() {
  const response = await axios.get(
    config.express_url + "/agent/get_agents",
    options,
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
    if (!queueNames[agent.tenant][agent.entity_type][agent.entity_protocol]) {
      queueNames[agent.tenant][agent.entity_type][agent.entity_protocol] = {};
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
}

function scheduleRestart() {
  if (runIntervalTask) {
    clearInterval(runIntervalTask);
    runIntervalTask = null;
  }

  if (connection) {
    try { connection.close(); } catch (e) {}
  }

  console.log("[AMQP] Retrying in 5 seconds...");
  setTimeout(() => {
    isReconnecting = false;
    startApp();
  }, 5000);
}

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  if (runIntervalTask) clearInterval(runIntervalTask);
  if (sendResultTask) clearInterval(sendResultTask);
  if (setStateTask) clearInterval(setStateTask);

  if (connection) {
    try {
      console.log("[AMQP] Closing connection...");
      await connection.close();
      console.log("[AMQP] Connection closed successfully.");
    } catch (err) {
      console.error("[AMQP] Error closing connection:", err.message);
    }
  }

  console.log("All's done!");
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

async function startApp(){
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    await setupRabbitMQChannels();
    await setupQueues();

    if (runIntervalTask) clearInterval(runIntervalTask);
    runIntervalTask = setInterval(run, 10000);

    isReconnecting = false;

    console.log("App initialization successful.");
  } catch (err) {
    console.error("[AMQP] Startup failed:", err.message);
    scheduleRestart();
  }

}

startApp();

async function sendResult() {
  axios
    .post(
      config.express_url + "/ams/ingest",
      ResultMessageBatch.toJSON(),
      publishResultsOptions,
    )
    .then((res) => {
      if (res.status != 200) {
        console.log("Could not send result to fedreg, trying again...");
      } else {
        ResultMessageBatch.clear();
        clearInterval(sendResultTask);
        sendResultTaskRunning = false;
      }
    })
    .catch((err) => {
      console.log("Could not upload result to fedreg, trying again...");
      console.error("Error:", err);
    });
}

async function setServiceState() {
  axios
    .put(
      config.express_url + "/agent/set_services_state",
      setStateArray,
      options,
    )
    .then((res) => {
      if (res.status != 200) {
        console.log("Could not set service state trying again...");
      } else {
        setStateArray = [];
        clearInterval(setStateTask);
      }
    })
    .catch((err) => {
      console.log("Could not set service state trying again...");
      console.error("Error:", err);
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
    if (service.merge_environments_on_deploy) {
      propagation_integration_environment = service.merged_integration_environment_name;
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
      Buffer.from(JSON.stringify(msg)),
      { persistent: true },
    );

    const msgDetails = {
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
    console.debug(msgDetails);
    console.log("Successfully Pushed Message to RabbitMQ");
  }
  if (setStateArray.length > 0) {
    setStateTask = setInterval(function () {
      setServiceState(setStateArray);
    }, 1500);
  }
}
