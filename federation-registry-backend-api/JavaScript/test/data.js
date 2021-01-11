const create = {
  oidc:{
     service_name:"Test Oidc Service",
     service_description:"This is a test service",
     redirect_uris: ["https://redirecturi1.com"],
     logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
     policy_uri:"https://policyuri.com",
     integration_environment:"demo",
     protocol:"oidc",
     contacts:[ {
         "email": "mymail@gmail.com",
         "type": "admin"
       }],
     metadata_url:null,
     entity_id:null,
     client_id:"testCreate",
     allow_introspection:false,
     code_challenge_method:"plain",
     device_code_validity_seconds:28800,
     access_token_validity_seconds:3600,
     refresh_token_validity_seconds:28800,
     client_secret:"secret",
     reuse_refresh_tokens:true,
     clear_access_tokens_on_refresh:true,
     id_token_timeout_seconds:1000,
     scope: [
       "openid",
       "profile",
       "email",
       "eduperson_entitlement",
       "eduperson_scoped_affiliation",
       "eduperson_unique_id"
     ],
     grant_types: [
       "authorization_code"
     ],
     generate_client_secret:false
   },
   saml:{
     service_name:"Test Saml Service",
     service_description:"This is a test service",
     redirect_uris: null,
     logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
     policy_uri:"https://policyuri.com",
     integration_environment:"demo",
     protocol:"saml",
     contacts:[ {
         "email": "mymail@gmail.com",
         "type": "admin"
       }],
     metadata_url:'https://metadata.com',
     entity_id:"https://entity_id.com",
     client_id:null,
     allow_introspection:null,
     code_challenge_method:null,
     device_code_validity_seconds:null,
     access_token_validity_seconds:null,
     refresh_token_validity_seconds:null,
     client_secret:null,
     reuse_refresh_tokens:null,
     clear_access_tokens_on_refresh:null,
     id_token_timeout_seconds:null,
     scope:null,
     grant_types:null,
     generate_client_secret:null
   }
}

const edit = {
 oidc:{

   service_name:"Test Oidc Service ",
   service_description:"This is a test service edit",
   redirect_uris: ["https://redirecturi1edit.com","https://redirecturi1edit.com"],
   logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"https://policyuriedit.com",
   integration_environment:"demo",
   protocol:"oidc",
   contacts:[{
       "email": "uricommail@gmail.com",
       "type": "admin"
     },
     {
       "email": "ctuitcommail@gmail.com",
       "type": "admin"
     }
   ],
   metadata_url:"",
   entity_id:"",
   client_id:"testCreate2",
   allow_introspection:false,
   code_challenge_method:"plain",
   device_code_validity_seconds:"28800",
   access_token_validity_seconds:"3600",
   refresh_token_validity_seconds:"28800",
   client_secret:"secret",
   reuse_refresh_tokens:true,
   clear_access_tokens_on_refresh:true,
   id_token_timeout_seconds:"1000",
   scope: [
     "openid",
     "profile",
     "eduperson_entitlement",
     "eduperson_scoped_affiliation",
     "microscope"
   ],
   grant_types: [
     "authorization_code",
     "refresh_token","client_credentials"
   ],
   generate_client_secret:false
 },
 saml:{

   service_name:"Test Saml Service edit",
   service_description:"This is a test service edit",
   redirect_uris:null,
   logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"https://policyuriedit.com",
   integration_environment:"demo",
   protocol:"saml",
   contacts:[{
       "email": "uricommail@gmail.com",
       "type": "admin"
     },
     {
       "email": "ctuitcommail@gmail.com",
       "type": "admin"
     }
   ],
   metadata_url:'https://metadataedit.com',
   entity_id:"https://entity_id_edit.com",
   client_id:null,
   allow_introspection:null,
   code_challenge_method:null,
   device_code_validity_seconds:null,
   access_token_validity_seconds:null,
   refresh_token_validity_seconds:null,
   client_secret:null,
   reuse_refresh_tokens:null,
   clear_access_tokens_on_refresh:null,
   id_token_timeout_seconds:null,
   scope:null,
   grant_types:null,
   generate_client_secret:null
 }
}

const postServices = [
    {
      "policy_uri":"https://www.policy_uri.com",
      "integration_environment":"demo",
      "protocol":"oidc",
      "client_id":"clqweient1",
      "contacts":[ {
          "email": "mymail@gmail.com",
          "type": "admin"
        }],
      "allow_introspection":false,
      "code_challenge_method":"plain",
      "device_code_validity_seconds":28800,
      "access_token_validity_seconds":3600,
      "refresh_token_validity_seconds":28800,
      "client_secret":"secret",
      "reuse_refresh_tokens":true,
      "clear_access_tokens_on_refresh":true,
      "id_token_timeout_seconds":1000,
      "scope": [
        "openid",
        "profile",
        "email",
        "eduperson_entitlement",
        "eduperson_scoped_affiliation",
        "eduperson_unique_id"
      ],
      "grant_types": [
        "authorization_code"
      ],
      "generate_client_secret":false
    },
    {
      "extra_field":"with value",
      "external_id":3,
      "service_name":"Oidc 2",
      "client_id": "testtest",
      "service_description":"Sample description",
      "logo_uri":"https://www.freelogodesign.org/Content/img/logo-samples/flooop.png",
      "policy_uri":"https://www.policy_uri.com",
      "integration_environment":"demo",
      "protocol":"oidc",
      "reuse_refresh_tokens":true,
      "clear_access_tokens_on_refresh":true,
      "id_token_timeout_seconds":1000,
      "scope": [
        "openid",
        "profile",
        "email",
        "eduperson_entitlement",
        "eduperson_scoped_affiliation",
        "eduperson_unique_id"
      ],
      "generate_client_secret":false
    },
    {
      "extra_field":"with value",
      "external_id":3,
      "service_name":"Saml 1",
      "service_description":"Sample description",
      "metadata_url":"https://asdfasdf.com",
      "logo_uri":"https://www.freelogodesign.org/Content/img/logo-samples/flooop.png",
      "policy_uri":"https://www.policy_uri.com",
      "integration_environment":"demo",
      "protocol":"saml",
      "contacts":null
    },
    {
      "protocol":"oidc",
      "integration_environment":"demo",
      "client_id":"test_12"
    },
    {
      "protocol":"saml",
      "integration_environment":"development",
      "entity_id":"https://entity_id_test_asd.com",
      "metadata_url":"https://hello_this_should_be_unique.com"
    },
    {
      "protocol":"saml",
      "integration_environment":"development",
      "metadata_url":"https://hello_this_should_be_unique_2.com"
    }
]

const validationRequests = {
 oidc_types: {
   type:3,
   service_name: 1,
   service_description:2,
   redirect_uris: "string",
   logo_uri:"http://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"http://policyuri.com",
   integration_environment:1,
   protocol:"oidc",
   contacts:"string",
   metadata_url:null,
   entity_id:null,
   client_id:1,
   allow_introspection:"string",
   code_challenge_method:1,
   device_code_validity_seconds:"string",
   access_token_validity_seconds:"string",
   refresh_token_validity_seconds:"string",
   client_secret:1,
   reuse_refresh_tokens:"string",
   clear_access_tokens_on_refresh:"string",
   id_token_timeout_seconds:"string",
   scope: "string",
   grant_types:"string",
   generate_client_secret:"string"
 },
 oidc_values: {
   type:"string",
   service_name: "stringasdasd",
   service_description:"str",
   redirect_uris: ["string","string"],
   logo_uri:"string",
   policy_uri:"string",
   integration_environment:"string",
   protocol:"oidc",
   contacts:["string","string"],
   metadata_url:null,
   entity_id:null,
   client_id:"str",
   allow_introspection:true,
   code_challenge_method:"string",
   device_code_validity_seconds:123,
   access_token_validity_seconds:123,
   refresh_token_validity_seconds:12312,
   client_secret:"str",
   reuse_refresh_tokens:true,
   clear_access_tokens_on_refresh:true,
   id_token_timeout_seconds:123123,
   scope: ["string","string"],
   grant_types:["string","string"],
   generate_client_secret:false
 },
 saml_types: {
   type:'create',
   service_name:"Test Saml Service edit",
   service_description:"This is a test service edit",
   redirect_uris:null,
   logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"https://policyuriedit.com",
   integration_environment:"demo",
   protocol:"saml",
   contacts:[{
       "email": "uricommail@gmail.com",
       "type": "admin"
     },
     {
       "email": "ctuitcommail@gmail.com",
       "type": "admin"
     }
   ],
   metadata_url:1,
   entity_id:1,
   client_id:null,
   allow_introspection:null,
   code_challenge_method:null,
   device_code_validity_seconds:null,
   access_token_validity_seconds:null,
   refresh_token_validity_seconds:null,
   client_secret:null,
   reuse_refresh_tokens:null,
   clear_access_tokens_on_refresh:null,
   id_token_timeout_seconds:null,
   scope:null,
   grant_types:null,
   generate_client_secret:null
 },
 saml_values: {
   type:'create',
   service_name:"Test Saml Service edit",
   service_description:"This is a test service edit",
   redirect_uris:null,
   logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"https://policyuriedit.com",
   integration_environment:"demo",
   protocol:"saml",
   contacts:[{
       "email": "uricommail@gmail.com",
       "type": "admin"
     },
     {
       "email": "ctuitcommail@gmail.com",
       "type": "admin"
     }
   ],
   metadata_url:"string",
   entity_id:"string",
   client_id:null,
   allow_introspection:null,
   code_challenge_method:null,
   device_code_validity_seconds:null,
   access_token_validity_seconds:null,
   refresh_token_validity_seconds:null,
   client_secret:null,
   reuse_refresh_tokens:null,
   clear_access_tokens_on_refresh:null,
   id_token_timeout_seconds:null,
   scope:null,
   grant_types:null,
   generate_client_secret:null
 }
}

const agents = {
 post: {
   "agents": [
       {
           "type": "ssp",
           "entity_type": "service",
           "hostname": "https://snf-ssp-2.grnet.gr",
           "entity_protocol": "oidc"
       },
       {
           "type": "ssp",
           "entity_type": "idp",
           "hostname": "https://snf-ssp-1.grnet.gr",
           "entity_protocol": "oidc"
       },
       {
           "type": "ssp",
           "entity_type": "idp",
           "hostname": "https://snf-ssp-2.grnet.gr",
           "entity_protocol": "oidc"
       },
       {
           "type": "ssp",
           "entity_type": "service",
           "hostname": "https://snf-ssp-new-1.grnet.gr",
           "entity_protocol": "oidc"
       },
       {
           "type": "mitreid",
           "entity_type": "service",
           "hostname": "https://snf-mitre-put-2.grnet.gr",
           "entity_protocol": "oidc"
       }
   ]
 },
 put: {
   "type": "mitreid",
   "entity_type": "service",
   "hostname": "https://snf-mitre-put-10.grnet.gr",
   "entity_protocol": "oidc"
 }
}
const validationResponses = {
 create: {
   null: [
     { protocol: 'Required Field' },
     { service_name: 'Required Field' },
     { logo_uri: 'Required Field' },
     { policy_uri: 'Required Field' },
     { service_description: 'Required Field' },
     { contacts: 'Required Field' },
     { integration_environment: 'Required Field' }
   ],
   oidc_null: [
     { service_name: 'Required Field' },
     { redirect_uris: 'Required Field' },
     { logo_uri: 'Required Field' },
     { policy_uri: 'Required Field' },
     { service_description: 'Required Field' },
     { contacts: 'Required Field' },
     { scope: 'Required Field' },
     { grant_types: 'Required Field' },
     { id_token_timeout_seconds: 'Required Field' },
     { access_token_validity_seconds: 'Required Field' },
     { refresh_token_validity_seconds: 'Required Field' },
     { device_code_validity_seconds: 'Required Field' },
     { code_challenge_method: 'Required Field' },
     { allow_introspection: 'Required Field' },
     { generate_client_secret: 'Required Field' },
     { reuse_refresh_tokens: 'Required Field' },
     { integration_environment: 'Required Field' },
     { clear_access_tokens_on_refresh: 'Required Field' }
   ],
   saml_null: [
     { service_name: 'Required Field' },
     { logo_uri: 'Required Field' },
     { policy_uri: 'Required Field' },
     { service_description: 'Required Field' },
     { contacts: 'Required Field' },
     { integration_environment: 'Required Field' },
     { metadata_url: 'Required Field' }
   ],
   oidc_types: [
     { type: 'Must be a string' },
     { service_name: 'Must be a string' },
     { client_id: 'Must be a string' },
     { redirect_uris: 'Must be an array' },
     { service_description: 'Must be a string' },
     { contacts: 'Must be an array' },
     { scope: 'Must be an array' },
     { grant_types: 'Must be an array' },
     { id_token_timeout_seconds: 'Must be an integer in specified range' },
     { access_token_validity_seconds: 'Must be an integer in specified range'},
     { refresh_token_validity_seconds: 'Must be an integer in specified range'},
     { device_code_validity_seconds: 'Must be an integer in specified range'},
     { code_challenge_method: 'Must be a string' },
     { allow_introspection: 'Must be a boolean' },
     { generate_client_secret: 'Must be a boolean' },
     { reuse_refresh_tokens: 'Must be a boolean' },
     { integration_environment: 'Must be a string' },
     { clear_access_tokens_on_refresh: 'Must be a boolean' }
   ],
   saml_types: [
     { entity_id: 'Must be a string' },
     { metadata_url: 'Must be a string' }
   ],
   oidc_values: [
     { type: 'Invalid value' },
     { client_id: 'Invalid value' },
     { redirect_uris: 'Must be secure url' },
     { logo_uri: 'Must be a url' },
     { policy_uri: 'Must be a url' },
     { contacts: 'Invalid value' },
     { grant_types: 'Invalid value' },
     { code_challenge_method: 'Invalid value' },
     { integration_environment: 'Invalid value' }
   ],
   saml_values: [ { entity_id: 'Must be a url' }, { metadata_url: 'Must be a url' } ]




 }

}

const users = {
 egi: {
   admin_user:{
     sub: "test_egi_admin_user",
     edu_person_entitlement:['urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu']
   },
   manager_user:{
     sub: "test_egi_manager_user",
     edu_person_entitlement:['fake_entitlement']
   },
   end_user: {
     sub: "test_egi_end_user",
     edu_person_entitlement: []
   }
 },
 eosc: {
   admin_user: {
     sub: "test_eosc_admin_user",
     edu_person_entitlement :['urn:mace:egi.eu:group:service-integration.aai.eosc.eu:role=member#aai.eosc.eu']
   },
   manager_user:{
     sub: "test_eosc_manager_user",
     edu_person_entitlement : ['fake_entitlement']
   },
   end_user: {
     sub: "test_eosc_end_user",
     edu_person_entitlement : []
   }
 }
}

module.exports = {create,edit,users,validationResponses,validationRequests,agents,postServices};
