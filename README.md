The EGI CheckIn Service provides a secure web interface through which service operators can register their OpenID Connect and SAML based services. Simple users create requests to register reconfigure or delete services which are then reviewed from an administrator.



This project is consisted of three parts
* service-react-client: A front-end portal created with Reactjs using Formik and React-Bootstrap
* registry-backend-express: A back-end server that connects Reactjs with a PostgreSQL Database created with express.js using pg-promise
* ams-agent: A node project pulling pending requests from express backend and posting them at AMS.




### Environment Configuration
* service-react-client: Locate package.json and modify proxy property to find express backend
* registry-backend-express: Locate .env inside Javascript folder and configure it accordingly
* ams-agent: Configure .env

### Installing & Running

1. For the front-end portal
* `cd service-react-client`
* `yarn install`
* `sudo yarn start`


2. For the back-end server
* `cd registry-backend-express`
* `npm install`
* `cd JavaScript`
* `node index.js`

3. For the ams-agent
* `cd ams-agent`
* `npm install`
* `node app.js`

4. For the backend server connection with the database a PostgresSQL database must be created using the oidc_db.sql file located in the root folder

The connection details are declared in rciam-federation-registry/registry-backend-express/db-config.json and might need to be modified.

 ```
 {
   "host": "localhost",
   "port": 5432,
   "database": "service_registry",
   "user": "postgres",
   "password":"postgres"
 }
```
