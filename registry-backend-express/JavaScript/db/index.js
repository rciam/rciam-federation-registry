const promise = require('bluebird'); // best promise library today
const pgPromise = require('pg-promise'); // pg-promise core library
const dbConfig = require('../../db-config/db-config.json'); // db connection details
const {Diagnostics} = require('./diagnostics'); // optional diagnostics
const {ServiceContacts,ServiceDetailsProtocol,ServiceDetails,UserInfo,UserEduPersonEntitlement,ServiceMultiValued,ServicePetitionDetails,Service} = require('./repos');
const testdbConfig = require('../../db-config/test-db-config.json');
const dockerTestdbConfig = require('../../db-config/docker-test-db-config.json');
let config;
// pg-promise initialization options:
const initOptions = {

    // Use a custom promise library, instead of the default ES6 Promise:
    promiseLib: promise,

    // Extending the database protocol with our custom repositories;
    // API: http://vitaly-t.github.io/pg-promise/global.html#event:extend
    extend(obj, dc) {
        // Database Context (dc) is mainly useful when extending multiple databases with different access API-s.
        obj.service_contacts = new ServiceContacts(obj,pgp);
        obj.service_details_protocol = new ServiceDetailsProtocol(obj,pgp);
        obj.user_info = new UserInfo(obj,pgp);
        obj.service_details = new ServiceDetails(obj,pgp);
        obj.user_edu_person_entitlement = new UserEduPersonEntitlement(obj,pgp);
        obj.service_multi_valued = new ServiceMultiValued(obj,pgp);
        obj.service_petition_details = new ServicePetitionDetails(obj,pgp);
        obj.service = new Service(obj,pgp);
        // Do not use 'require()' here, because this event occurs for every task and transaction being executed,
        // which should be as fast as possible.

    }
};

// Initializing the library:

const pgp = pgPromise(initOptions);

// Creating the database instance:

if(process.env.NODE_ENV==='test'){
  config = testdbConfig;

}
else if(process.env.NODE_ENV==='test-docker'){
  config = dockerTestdbConfig;
}
else{
  config = dbConfig;
}
const db = pgp(config);

// Initializing optional diagnostics:
Diagnostics.init(initOptions);

// Alternatively, you can get access to pgp via db.$config.pgp
// See: https://vitaly-t.github.io/pg-promise/Database.html#$config
module.exports = {db, pgp};
