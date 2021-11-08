const create = {
  oidc:{
     service_name:"Test Oidc Service",
     service_description:"This is a test service",
     redirect_uris: ["https://redirecturi1.com"],
     logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
     policy_uri:"https://policyuri.com",
     website_url:"",
     integration_environment:"development",
     protocol:"oidc",
     contacts:[ {
         "email": "mymail@gmail.com",
         "type": "technical"
       },{
         "email": "mymail@gmail.com",
         "type": "security"
       },
       {
        "email": "mymail@gmail.com",
        "type": "support"
      },
      {
        "email": "mymail@gmail.com",
        "type": "admin"
      }
      ],
     metadata_url:null,
     country:"gr",
     token_endpoint_auth_method:"private_key_jwt",
     token_endpoint_auth_signing_alg:"HS256",
     jwks:{"keys":[]},
     jwks_uri:"",
     entity_id:null,
     client_id:"testCreate",
     allow_introspection:false,
     code_challenge_method:"plain",
     device_code_validity_seconds:800,
     access_token_validity_seconds:3600,
     refresh_token_validity_seconds:800,
     client_secret:"secret",
     reuse_refresh_token:true,
     clear_access_tokens_on_refresh:true,
     id_token_timeout_seconds:1000,
     aup_uri:"https://test.com",
     organization_id:1,
     scope: [
       "openid",
       "profile",
       "email",
       "eduperson_entitlement",
       "eduperson_scoped_affiliation",
       "eduperson_unique_id"
     ],
     grant_types: [
       "client_credentials"
     ],
     generate_client_secret:false,
     egi_policy:true,
     dpcoco:false
   },
   saml:{
     service_name:"Test Saml Service",
     service_description:"This is a test service",
     redirect_uris: null,
     logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
     policy_uri:"https://policyuri.com",
     website_url:"",
     integration_environment:"development",
     protocol:"saml",
     country:"gr",
     contacts:[{
      "email": "mymail@gmail.com",
      "type": "technical"
    },{
      "email": "mymail@gmail.com",
      "type": "security"
    },
    {
     "email": "mymail@gmail.com",
     "type": "support"
   },
   {
     "email": "mymail@gmail.com",
     "type": "admin"
   }],
     metadata_url:'https://metadata.com',
     entity_id:"https://entity_id.com",
     aup_uri:"https://test.com",
     organization_id:1,
     client_id:null,
     allow_introspection:null,
     code_challenge_method:null,
     device_code_validity_seconds:null,
     access_token_validity_seconds:null,
     refresh_token_validity_seconds:null,
     client_secret:null,
     reuse_refresh_token:null,
     clear_access_tokens_on_refresh:null,
     id_token_timeout_seconds:null,
     scope:null,
     grant_types:null,
     generate_client_secret:null
   }
}

const edit = {
 oidc:{
   "service_name":"Test Oidc Service",
   "service_description":"This is a test service edit",
   "redirect_uris":[
      "https://redirecturi1edit.com",
      "https://redirecturi1edit.com"
   ],
   "logo_uri":"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   "policy_uri":"https://policyuriedit.com",
   "website_url":"",
   "integration_environment":"development",
   "protocol":"oidc",
   "contacts":[{
    "email": "mymail@gmail.com",
    "type": "technical"
  },{
    "email": "mymail@gmail.com",
    "type": "security"
  },
  {
   "email": "mymail@gmail.com",
   "type": "support"
 },
 {
   "email": "mymail@gmail.com",
   "type": "admin"
 }
   ],
   "country":"Gr",
   "token_endpoint_auth_method":"private_key_jwt",
   "token_endpoint_auth_signing_alg":"HS256",
   "jwks":"",
   "jwks_uri":"https://test.com",
   "metadata_url":"",
   "aup_uri":"https://test.com",
   "organization_id":1,
   "entity_id":"",
   "client_id":"testCreate2",
   "allow_introspection":false,
   "code_challenge_method":"plain",
   "device_code_validity_seconds":"800",
   "access_token_validity_seconds":"3600",
   "refresh_token_validity_seconds":"800",
   "client_secret":"secret",
   "reuse_refresh_token":true,
   "clear_access_tokens_on_refresh":true,
   "id_token_timeout_seconds":"1000",
   "scope":[
      "openid",
      "profile",
      "eduperson_entitlement",
      "eduperson_scoped_affiliation",
      "microscope"
   ],
   "grant_types":[
      "client_credentials"
   ],
   "generate_client_secret":false,
   "egi_policy":true,
   "dpcoco":false
},
 saml:{

   service_name:"Test Saml Service edit",
   service_description:"This is a test service edit",
   redirect_uris:null,
   logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"https://policyuriedit.com",
   website_url:"",
   integration_environment:"development",
   protocol:"saml",
   contacts:[{
    "email": "mymail@gmail.com",
    "type": "technical"
  },{
    "email": "mymail@gmail.com",
    "type": "security"
  },
  {
   "email": "mymail@gmail.com",
   "type": "support"
 },
 {
   "email": "mymail@gmail.com",
   "type": "admin"
 }
   ],
   metadata_url:'https://metadataedit.com',
   entity_id:"https://entity_id_edit.com",
   aup_uri:"https://test.com",
   organization_id:1,
   client_id:null,
   country:"gr",
   allow_introspection:null,
   code_challenge_method:null,
   device_code_validity_seconds:null,
   access_token_validity_seconds:null,
   refresh_token_validity_seconds:null,
   client_secret:null,
   reuse_refresh_token:null,
   clear_access_tokens_on_refresh:null,
   id_token_timeout_seconds:null,
   scope:null,
   grant_types:null,
   generate_client_secret:null
 }
}

const postServices = [
  {
    "policy_uri": "https://www.policy_uri.com",
    "website_url":"",
    "integration_environment": "development",
    "protocol": "oidc",
    "client_id": "clqweient1",
    "contacts": [ {
      "email": "mymail@gmail.com",
      "type": "technical"
    },{
      "email": "mymail@gmail.com",
      "type": "security"
    }],
    "allow_introspection": null,
    "code_challenge_method": "plain",
    "device_code_validity_seconds": 800,
    "access_token_validity_seconds": 3600,
    "refresh_token_validity_seconds": 800,
    "client_secret": "secret",
    "country": "GR",
    "token_endpoint_auth_method": "private_key_jwt",
    "token_endpoint_auth_signing_alg": "HS256",
    "jwks": {"keys":[]},
    "jwks_uri": "",
    "aup_uri":"",
    "organization_id":null,
    "reuse_refresh_token": true,
    "clear_access_tokens_on_refresh": true,
    "id_token_timeout_seconds": 1000,
    "scope": [
      "openid",
      "profile",
      "email",
      "eduperson_entitlement",
      "eduperson_scoped_affiliation",
      "eduperson_unique_id"
    ],
    "grant_types": [ "client_credentials" ],
    "generate_client_secret": false,
    "tenant": "egi",
    "external_id": null,
    "service_name": null,
    "service_description": null,
    "logo_uri": null,
    "entity_id": null,
    "metadata_url": null,
    "redirect_uris": null,
    "egi_policy":true,
    "dpcoco":false
  },
  {
    "extra_field": "with value",
    "external_id": 3,
    "service_name": "Oidc 2",
    "client_id": "testtest",
    "service_description": "Sample description",
    "logo_uri": "https://www.freelogodesign.org/Content/img/logo-samples/flooop.png",
    "policy_uri": "https://www.policy_uri.com",
    "website_url":"",
    "integration_environment": "development",
    "protocol": "oidc",
    "country": "GR",
    "token_endpoint_auth_method": "private_key_jwt",
    "token_endpoint_auth_signing_alg": "HS256",
    "jwks": "",
    "aup_uri":"https://test.com",
    "organization_id":1,
    "jwks_uri": "https://test.com",
    "reuse_refresh_token": true,
    "clear_access_tokens_on_refresh": true,
    "id_token_timeout_seconds": 1000,
    "scope": [
      "openid",
      "profile",
      "email",
      "eduperson_entitlement",
      "eduperson_scoped_affiliation",
      "eduperson_unique_id",
    ],
    "generate_client_secret": false,
    "tenant": "egi",
    "egi_policy":true,
    "dpcoco":false
  },
  {
    "extra_field": "with value",
    "external_id": 3,
    "service_name": "Saml 1",
    "country": "GR",
    "service_description": "Sample description",
    "metadata_url": "https://asdfasdf.com",
    "logo_uri": "https://www.freelogodesign.org/Content/img/logo-samples/flooop.png",
    "policy_uri": "https://www.policy_uri.com",
    "website_url":"",
    "integration_environment": "development",
    "protocol": "saml",
    "contacts": null,
    "tenant": "egi",

  },
  {
    "protocol": "oidc",
    "country": "GR",
    "integration_environment": "development",
    "client_id": "test_12",
    "tenant": "egi"
  },
  {
    "protocol": "saml",
    "integration_environment": "development",
    "country": "GR",
    "entity_id": "https://entity_id_test_asd.com",
    "metadata_url": "https://hello_this_should_be_unique.com",
    "tenant": "egi"
  },
  {
    "protocol": "saml",
    "country": "gr",
    "integration_environment": "development",
    "metadata_url": "https://hello_this_should_be_unique_2.com",
    "tenant": "egi"
  }
]


const validationRequests = {
 oidc_types: {
   type:"create",
   service_name: 1,
   service_description:2,
   redirect_uris: "string",
   logo_uri:"http://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"http://policyuri.com",
   website_url:"",
   integration_environment:1,
   protocol:"oidc",
   country:"gr",
   token_endpoint_auth_method:"private_key_jwt",
   token_endpoint_auth_signing_alg:"HS256",
   jwks:"",
   jwks_uri:"https://test.com",
   contacts:"string",
   metadata_url:null,
   entity_id:null,
   client_id:1,
   aup_uri:"https://test.com",
   organization_id:1,
   allow_introspection:"string",
   code_challenge_method:1,
   device_code_validity_seconds:"string",
   access_token_validity_seconds:"string",
   refresh_token_validity_seconds:"string",
   client_secret:1,
   reuse_refresh_token:"string",
   clear_access_tokens_on_refresh:"string",
   id_token_timeout_seconds:"string",
   scope: "string",
   grant_types:"string",
   generate_client_secret:"string",
   egi_policy:true,
   dpcoco:false
 },
 oidc_values: {
   type:"create",
   service_name: "stringasdasd",
   service_description:"str",
   redirect_uris: ["string","string"],
   logo_uri:"string",
   policy_uri:"string",
   website_url:"",
   integration_environment:"string",
   protocol:"oidc",
   country:"gr",
   token_endpoint_auth_method:"private_key_jwt",
   token_endpoint_auth_signing_alg:"HS256",
   jwks:"",
   jwks_uri:"https://test.com",
   contacts:["string","string"],
   metadata_url:null,
   aup_uri:"https://test.com",
   organization_id:1,
   entity_id:null,
   client_id:"str",
   allow_introspection:true,
   code_challenge_method:"string",
   device_code_validity_seconds:123,
   access_token_validity_seconds:123,
   refresh_token_validity_seconds:12312,
   client_secret:"str",
   reuse_refresh_token:true,
   clear_access_tokens_on_refresh:true,
   id_token_timeout_seconds:123123,
   scope: ["string","string"],
   grant_types:["string","string"],
   generate_client_secret:false,
   egi_policy:true,
   dpcoco:false
 },
 saml_types: {
   type:'create',
   service_name:"Test Saml Service edit",
   service_description:"This is a test service edit",
   redirect_uris:null,
   logo_uri:"https://cdn.shopify.com/shopifycloud/hatchful-web/assets/6fcc76cfd1c59f44d43a485167fb3139.png",
   policy_uri:"https://policyuriedit.com",
   website_url:"",
   integration_environment:"development",
   protocol:"saml",
   contacts:[{
    "email": "mymail@gmail.com",
    "type": "technical"
  },{
    "email": "mymail@gmail.com",
    "type": "security"
  }],
   metadata_url:1,
   entity_id:1,
   client_id:null,
   aup_uri:"https://test.com",
   organization_id:1,
   allow_introspection:null,
   code_challenge_method:null,
   device_code_validity_seconds:null,
   access_token_validity_seconds:null,
   refresh_token_validity_seconds:null,
   client_secret:null,
   reuse_refresh_token:null,
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
   website_url:"",
   integration_environment:"development",
   protocol:"saml",
   contacts:[{
    "email": "mymail@gmail.com",
    "type": "technical"
  },{
    "email": "mymail@gmail.com",
    "type": "security"
  }],
   metadata_url:"string",
   entity_id:"string",
   client_id:null,
   aup_uri:"https://test.com",
   organization_id:1,
   allow_introspection:null,
   code_challenge_method:null,
   device_code_validity_seconds:null,
   access_token_validity_seconds:null,
   refresh_token_validity_seconds:null,
   client_secret:null,
   reuse_refresh_token:null,
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
           "id":1,
           "type": "ssp",
           "entity_type": "service",
           "hostname": "https://snf-ssp-2.grnet.gr",
           "entity_protocol": "oidc",
           "integration_environment":"demo"
       },
       {
           "id":2,
           "type": "ssp",
           "entity_type": "idp",
           "hostname": "https://snf-ssp-1.grnet.gr",
           "entity_protocol": "oidc",
           "integration_environment":"demo"

       },
       {
           "id":3,
           "type": "ssp",
           "entity_type": "idp",
           "hostname": "https://snf-ssp-2.grnet.gr",
           "entity_protocol": "oidc",
           "integration_environment":"demo"
       },
       {
            "id":4,
           "type": "ssp",
           "entity_type": "service",
           "hostname": "https://snf-ssp-new-1.grnet.gr",
           "entity_protocol": "oidc",
           "integration_environment":"demo"
       },
       {
         "id":5,
           "type": "mitreid",
           "entity_type": "service",
           "hostname": "https://snf-mitre-put-2.grnet.gr",
           "entity_protocol": "oidc",
           "integration_environment":"demo"
       }
   ]
 },
 put: {
   "type": "mitreid",
   "entity_type": "service",
   "hostname": "https://snf-mitre-put-10.grnet.gr",
   "entity_protocol": "oidc",
   "integration_environment":"demo"
 }
}
const validationResponses = {
 create: {
   null:
    [
      { '[0].service_name': 'Service name missing' },
      { '[0].country': 'Country code missing' },
      { '[0].service_description': 'Service Description missing' },
      { '[0].policy_uri': 'Service Policy Uri missing' },
      { '[0].contacts': 'Service Contacts missing' },
      { '[0].protocol': 'Protocol missing' },
      { '[0].integration_environment': 'Integration Environment missing' }
    ],
   oidc_null: [
     { '[0].service_name': 'Service name missing' },
     { '[0].country': 'Country code missing' },
     { '[0].service_description': 'Service Description missing' },
     { '[0].policy_uri': 'Service Policy Uri missing' },
     { '[0].contacts': 'Service Contacts missing' },
     { '[0].redirect_uris': 'Service redirect_uri missing' },
     { '[0].scope': 'Service redirect_uri missing' },
     { '[0].grant_types': 'Service grant_types missing' },
     {
       '[0].token_endpoint_auth_method': 'Service token_endpoint_auth_method missing'
     },
     { '[0].code_challenge_method': 'Device Code mising' },
     { '[0].allow_introspection': 'Allow introspection mising' },
     { '[0].integration_environment': 'Integration Environment missing' }
    ],
   saml_null: [
     { '[0].service_name': 'Service name missing' },
     { '[0].country': 'Country code missing' },
     { '[0].service_description': 'Service Description missing' },
     { '[0].policy_uri': 'Service Policy Uri missing' },
     { '[0].contacts': 'Service Contacts missing' },
     { '[0].integration_environment': 'Integration Environment missing' },
     { '[0].entity_id': 'Entity id mising' },
     { '[0].metadata_url': 'Metadata url missing' }
   ],
   oidc_types: [
    {'[0].service_name': 'Service name must be a string' },
    {'[0].service_name': 'Service name must be from 4 up to 36 characters'},
    {'[0].service_description': 'Service Description must be a string' },
    {'[0].contacts': 'Service Contacts must be an array' },
    {'[0].client_id': 'client_id must be a string' },
    {'[0].redirect_uris': 'Service redirect_uri must be an array' },
    {'[0].scope': 'Must be an array' },
    {'[0].grant_types': 'grant_types must be an array' },
    {'[0].id_token_timeout_seconds': 'id_token_timeout_seconds must be an integer in specified range [1-3600]'},
    {'[0].access_token_validity_seconds': 'id_token_timeout_seconds must be an integer in specified range [1-11160]'},
    {'[0].refresh_token_validity_seconds': 'Refresh Token Validity Seconds must be an integer in specified range [1-1422000]'},
    {'[0].device_code_validity_seconds': 'Device Code Validity Seconds must be an integer in specified range [1-1800]'},
    {'[0].code_challenge_method': 'Device Code must be a string' },
    {'[0].allow_introspection': 'Allow introspection must be a boolean'},
    {'[0].generate_client_secret': 'Generate client secret must be a boolean'},
    {'[0].reuse_refresh_token': 'Reuse refresh tokens must be a boolean'},
    {'[0].integration_environment': 'Invalid Integration Environment'},
    {'[0].clear_access_tokens_on_refresh': 'Clear access tokens on refresh must be a boolean'}
   ],
   saml_types: [
     { '[0].country': 'Country code missing' },
     { '[0].entity_id': 'Entity id must be a string' },
     { '[0].metadata_url': 'Metadata url must be a string' }
   ],
   oidc_values: [
     { '[0].logo_uri': 'Service Logo must be a url' },
     { '[0].policy_uri': 'Service Policy Uri must be a url' },
     { '[0].contacts': 'Invalid contact' },
     { '[0].client_id': 'client_id must be between 4 and 36 characters' },
     {'[0].redirect_uris': 'Error: Invalid redirect url (string), it must be a url starting with http(s):// at position [0]'},
     { '[0].grant_types': 'Invalid grant_type value' },
     {'[0].id_token_timeout_seconds': 'id_token_timeout_seconds must be an integer in specified range [1-3600]'},
     { '[0].code_challenge_method': 'Device Code invalid value' },
     { '[0].integration_environment': 'Invalid Integration Environment' }

   ],
   saml_values: [
       { '[0].country': 'Country code missing' },
       { '[0].entity_id': 'Entity id must be a url' },
       { '[0].metadata_url': 'Metadata url must be a url' }
]




 }

}

const users = {
 egi: {
   manager_user:{
     sub: "test_egi_manager_user",
     edu_person_entitlement:['urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=approver#aai.egi.eu']
   },
   operator_user:{
     sub: "test_egi_operator_user",
     edu_person_entitlement:['urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu']
   },
   end_user: {
     sub: "test_egi_end_user",
     edu_person_entitlement: []
   }
 },
 eosc: {
   manager_user: {
     sub: "test_eosc_manager_user",
     edu_person_entitlement :['urn:mace:egi.eu:group:service-integration.aai.eosc.eu:role=approver#aai.eosc.eu']
   },
   operator_user:{
     sub: "test_eosc_operator_user",
     edu_person_entitlement : ['urn:mace:egi.eu:group:service-integration.aai.eosc.eu:role=member#aai.eosc.eu']
   },
   end_user: {
     sub: "test_eosc_end_user",
     edu_person_entitlement : []
   }
 }
}

module.exports = {create,edit,users,validationResponses,validationRequests,agents,postServices};
