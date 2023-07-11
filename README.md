# Introduction

The federation registry provides a secure web interface through which service operators can register and manage their
OpenID Connect and SAML based service. A federation registry instance can serve multiple tenants and supports different
AAI proxy technologies([Keycloak](https://www.keycloak.org/), [SimpleSAMLphp](https://simplesamlphp.org/), [SATOSA](https://daasi.de/en/satosa-a-modular-proxy/)
(TODO), [MITREid Connect](https://github.com/mitreid-connect/)). Services can be managed through the portal and are
deployed by sending configuration messages to [deployment agents](https://github.com/rciam/rciam-federation-registry-agent)
that run in parallel with this project. Messages are exchanged using [ARGO Messaging Service](https://grnet.gr/en/services/computing-and-storage-services/argo-messaging-service/).

Federation registry is consisted of three node.js projects:

- federation-registry-frontend: A front-end portal created with ReactJS
- federation-registry-backend-api: An API created with Express.js
- federation-registry-backend-ams-agent: An agent that uses the api and communicates with ams

**Usefull Links**
- [Documentation](https://federation.rciam.grnet.gr/)
- [Swagger Documentation](https://federation.rciam.grnet.gr/swagger-ui/dist/)
- [Ansible Role](https://github.com/rciam/rciam-deploy)
- [Deployment Agents](https://github.com/rciam/rciam-federation-registry-agent)

## Running the project

The deployment process has been automated with the use of [Ansible](https://www.ansible.com/). You can find the Ansible role in [this repository](https://github.com/rciam/rciam-deploy/tree/master).     

### Dependencies

Federation registry requires [Nodejs](https://nodejs.org/en/) and a [PostgreSQL](https://www.postgresql.org/) database
to run.
Versions used in project development:

- node v14.19.3
- PostgreSQL 12.4

### Database

A PostgreSQL database should be created using the schema described in **_db_schema.sql_**

### Configuration


If we need to set the project to communicate with deployment agents we will need the following from the ams setup:

- the base url of the ams installation
- the project name
- a user token with access to the publish topics
- a verification hash for the push endpoint
- an authorization key for the push endpoint


##### 1) Initialise/Configure Tenant
&NewLine;
a) Setup the tenants configuration file.
```
federation-registry-backend-api/JavaScript/config.json
```

b) Initialise tenant in the database.  An example of an initialisation script can be seen in the **setup_tenant.sql** file
- **Authentication:** Configure the Issuer that will be used for authentication providing also the Client Id and Client Secret.
- **User Roles:**  Configure the user roles and the entitlements that grant them and associate the with [role actions](#role-actions).  (The use of the example roles is recommended) 
- **Deployment Agents:** Configure the deployment agents that will be connected to the Federation Registry instance.

\*Note: If you are running federation registry in a development instance consider using a [mock deployer](https://github.com/rciam/rciam-federation-registry-agent/tree/mock-deployer). 


##### 1) Backend API
&NewLine;
**Configure Environment File**
`federation-registry-backend-api/JavaScript/.env`

```shell
EXPRESS_BASE = base_api_url
AMS_AGENT_KEY=authentication_key_for_ams_agent
AMS_AUTH_KEY=authorization_key_for_push_subscription
AMS_VER_HASH = verification_hash_used_to_activate_push_subscription
ADMIN_AUTH_KEY = authorization_key_for_administrative_routes
CORS = external_urls_allowed
TOKEN_KEY = token_used_for_encription
```

**Configure Database File**
`federation-registry-backend-api/db-config/db-config.json`

```json
{
  "database": "federation_registry_db",
  "host": "localhost",
  "password": "postgres",
  "port": 5432,
  "user": "postgres"
}
```

##### 2) Front End
&NewLine;
For the frontend we need to configure where the backend api is located:
`federation-registry-frontend/src/config.json`

```json
{
  "host": {
    "tenant1":"http://localhost:5000/",
    "tenant2":"http://localhost:5000/"
  },
  "basename": "/",
}

```

##### **3) AMS Agent**
&NewLine;
Ams Agent is responsible for
- Creating the necessary Topics and Subscriptions in the AMS.
- Pushing Deployment messages from the Federation Registry to the AMS. 
To configure the ams we must set the environmental variables:

```shell
AMS_PROJECT=ams-project
AMS_BASE_URL=ams-url
AMS_USER_TOKEN= user-token
AMS_ADMIN_TOKEN= admin-user-token
EXPRESS_URL=base-url-api
EXPRESS_KEY=authentication_key_for_ams_agent
ENV=installation_environment
```

### Installing Node Modules

Install node modules for all three node projects:

```shell
$ cd federation-registry-backend-api
$ npm install
$ cd ../federation-registry-frontend
$ npm install
$ cd ../federation-registry-backend-ams-agent
$ npm install
```

### Run the project

To run the federation-registry-backend-api:

```shell
$ cd federation-registry-backend-api/JavaScript
$ node index.js
```

To run the federation-registry-frontend:

```shell
$ cd federation-registry-frontend
$ npm start
```

To run the federation-registry-backend-ams-agent:

```shell
$ cd federation-registry-backend-ams-agent
$ node app.js
```

### Role Actions

Each user role is associated with a set of actions. Here is a list of the supported actions. 

##### Simple Actions 
- **get_user**: User can has access to it's own personal information.
- **get_own_services**: User can get a list of their services.
- **get_own_service**: User can view their own services.
- **get_own_petitions**: User can view requests for their services.
- **get_own_petition**: User can view requests for services owned by them.
- **add_own_petition**: User can create new requests.
- **update_own_petition**: User can update requests for services they own.
- **delete_own_petition**: User can cancel requests for their services.
- **review_own_petition**: User can review requests for services they own in a testing environment. 
##### Admin Actions
- **get_service**: User can view any service.
- **get_services**: User can get a list of all services and requests.
- **get_petition**: User has access to all requests.
- **get_petitions**: Allows User to see all available requests.
- **review_petition**: Allows User to review a request.
- **review_notification**: User gets a notification when new requests are submitted.
- **review_restricted**: User can review a request in a restricted environment.
- **send_notifications**: Allows Users to send notifications to service owners. 
- **invite_to_group**: User can manage owners of any service.
- **error_action**: User can troubleshoot deployment errors 
- **manage_tags**: User can add tags to any service.
- **view_groups**: User can view any group. 
- **view_errors**: User has access to the deployment errors.
- **export_services**: User can export services.


