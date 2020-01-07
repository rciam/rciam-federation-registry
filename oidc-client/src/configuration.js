const configuration = {
  client_id: '966c3bcf-0a24-4874-80f0-822ef8c7a5be',
  redirect_uri: 'http://localhost:3000/authentication/callback',
  response_type: 'code',
  post_logout_redirect_uri: 'http://localhost:3000/home',
  scope: 'openid profile email offline_access',
  authority: 'https://aai-dev.egi.eu/oidc/',
  silent_redirect_uri: 'http://localhost:3000/authentication/silent_callback',
  automaticSilentRenew: true,
  loadUserInfo: true,
  triggerAuthFlow: true,
  client_secret:"OvjiRGL-Aqs9b8PU4zBe-6Nl_DcgthtI4EzrpWhyXuR8W5Ty1uf8liaAbaaf_Gra18LnHaK52aSzFUMHTuwQ4w",
  metadata: {
    issuer:'https://aai-dev.egi.eu/oidc/',
    authorization_endpoint:'https://aai-dev.egi.eu/oidc/authorize',
    end_session_endpoint:'https://aai-dev.egi.eu/oidc/saml/logout',
    token_endpoint:'https://aai-dev.egi.eu/oidc/token',
    userinfo_endpoint:'https://aai-dev.egi.eu/oidc/userinfo',

  }

};

export default configuration;
