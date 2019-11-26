This project is consisted of two parts
* A front-end portal created with Reactjs using Formik and React-Bootstrap
* A back-end server that connects Reactjs with a PostgreSQL Database created with express.js using pg-promise

### Installing & Running

1. For the front-end portal
* `cd oidc-client`

* `yarn install`

* `sudo yarn start`

  Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

  The page will reload if you make edits.<br />
You will also see any lint errors in the console.




2. For the back-end server
* `cd oidc-backend`
* `npm install`
* `cd JavaScript`
* `node index.js`

  Runs the server listening at [http://localhost:5000](http://localhost:3000) for http requests.

3. For the backend server connection with the database a PostgresSQL database must be created using the oidc_db.sql file located in the root folder

The connection details are declared in oidc-project/oidc-backend/db-config.json and might need to be modified.

 ```
 {
   "host": "localhost",
   "port": 5432,
   "database": "oidc",
   "user": "postgres",
   "password":"postgres"
 }
```
