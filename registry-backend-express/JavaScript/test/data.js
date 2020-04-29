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
      entity_id:"SamlID",
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
    entity_id:"SamlIDedit",
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


module.exports = {create,edit};
