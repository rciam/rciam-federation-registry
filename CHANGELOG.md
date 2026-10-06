# Changelog

All notable changes in Federation Registry will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


# [2.3.0] 06/10/2026

## Added

- Configurable OIDC service-type profiles, including default profiles for advanced clients, machine-to-machine clients, and resource servers.
- A dedicated Policy tab in the service form.
- Tab-level error indicators in the service form.
- Configurable frontend language selection and Czech translations.
- Locally hosted frontend fonts.
- Graceful backend shutdown on `SIGTERM` and `SIGINT`.

## Changed

- Service-form fields are now shown or hidden according to the selected protocol, grant types, scopes, and authentication capabilities.
- Frontend and backend validation now account for field applicability, including grant types, redirect URIs, post-logout redirect URIs, token endpoint authentication, PKCE, and offline access.
- Backend logging now uses a unified structured logging API with timestamps and single-line JSON output.
- Backend test setup now supports resetting an isolated test database.

## Fixed

- Corrected the bundled Latin font subsets.
- Improved service-type selection and form state handling.
- Based ID token timeout applicability on the presence of the `openid` scope.
- Display validation errors for invalid values loaded from existing services.
- Wait for petition transactions to commit before returning success, preventing immediate availability checks from missing newly created OIDC and SAML petitions.
- Updated `pg-monitor` to prevent spurious connection errors.

## Tenant Configuration Changes

- Added `service_type_settings` for configuring the default service type and the order in which service types are displayed.
- Added `service_types` for defining each tenant's available service-type profiles, field defaults, allowed values, visibility, and editability.
- Moved token-lifetime defaults into each field's `form.more_info.<field>.default` configuration, alongside its validation limits. This applies to access-token, refresh-token, device-code, and ID-token lifetimes where configured.
- Moved policy-related fields to the new `policy` tab and added `user_facing` metadata where applicable.
- Existing tenant configuration files must be extended with the appropriate settings for that tenant; do not replace them wholesale with `tenant_config/default.json`.

## Database Changes

- Added `service_type` columns to approved service and service petition details.
- Existing approved services and service petitions must be assigned the `advanced` service type during the database upgrade.

```sql
ALTER TABLE service_details
ADD COLUMN service_type VARCHAR(256);

ALTER TABLE service_petition_details
ADD COLUMN service_type VARCHAR(256);

UPDATE service_details
SET service_type = 'advanced'
WHERE service_type IS NULL;

UPDATE service_petition_details
SET service_type = 'advanced'
WHERE service_type IS NULL;
```

### Optional Database Cleanup

Existing registered services may contain token-lifetime values that are no longer applicable under the updated form rules. Operators may optionally clear `device_code_validity_seconds` when the Device Authorization Grant is not enabled and `id_token_timeout_seconds` when the `openid` scope is not requested.

This cleanup only updates the service configuration stored in Federation Registry. It does not immediately modify an already deployed service; the deployed configuration will be synchronized the next time that service is updated. The stale values have no functional effect while their corresponding grant type or scope is disabled, so this cleanup is recommended only to avoid confusion for service owners.

```sql
UPDATE service_details_oidc AS oidc
SET device_code_validity_seconds = NULL
WHERE oidc.device_code_validity_seconds IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM service_oidc_grant_types AS grant_type
    WHERE grant_type.owner_id = oidc.id
      AND grant_type.value =
        'urn:ietf:params:oauth:grant-type:device_code'
  );

UPDATE service_details_oidc AS oidc
SET id_token_timeout_seconds = NULL
WHERE oidc.id_token_timeout_seconds IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM service_oidc_scopes AS scope
    WHERE scope.owner_id = oidc.id
      AND scope.value = 'openid'
  );
```

# [2.2.0] 10/07/2026

## Added

- Display requester and reviewer information in service petition history when available.
- Support for displaying reviewer metadata based on user permissions.

## Changed

- Increased `server.keepAliveTimeout` to 3700 seconds.
- Disabled the `X-Powered-By` response header.
- Enabled Express router case-sensitive and strict routing.
- Refactored `ams_auth_key` configuration name for improved clarity.

## Fixed

- RabbitMQ agent small fixes.
- Minor fixes to service petition history and review workflow.

## [2.1.1] 18/06/2026

## Fixed

- id_token_hint error when accessing a protected resource after logout with failed redirect

## [2.1.0]

### Added

- Support for tenant-specific configuration of contact types included in deployment messages.

### Changed

- Deployment messages now include only the contact types configured for the tenant.

## [2.0.1]

### Fixed

- Duplicate Service Intgration Notifications BUG

## [2.0.0]

### Added

- Support for RabbitMQ as a deployment message queue.
- Support for configurable email transport settings.
- Support for configurable footer logo and logo link.
- Support for deployment queue sharing across integration environments.
- Support for service collision checks across integration environments.
- Support for moving services between integration environments when deployment merging is enabled.
- Extended deployment error schema with `proxy_deploy_success` and `solved` fields.

### Fixed

- Fixed race condition when loading footer logo configuration.
- Fixed SAML service collision validation using `client_id` instead of `entityId`.
- Removed hardcoded notification sender email address.
- Removed hardcoded footer content and use configuration-defined content only.

### Security

- Updated backend, frontend and AMS agent dependencies.
- Added support for Node.js 22.

### Database Changes

- Added `proxy_deploy_success` column to `service_errors`.
- Added `solved` column to `service_errors`.

```sql
ALTER TABLE service_errors
ADD COLUMN proxy_deploy_success BOOLEAN;

ALTER TABLE service_errors
ADD COLUMN solved BOOLEAN;
```

## [1.7.0]

### Added

- Access Token Validation Model support for OIDC clients.
- Adaptive access token lifetime validation based on the selected validation model.
- Configurable minimum and maximum token lifetime limits for both access and refresh tokens.
- Support for specifying refresh token lifetimes in days.

### Changed

- Updated the [default tenant configuration](https://github.com/rciam/rciam-federation-registry/blob/master/federation-registry-backend-api/JavaScript/tenant_config/default.json) to align with the [AARC-G081 recommendations on Token Lifetimes](https://aarc-community.org/guidelines/aarc-g081/).

### Database Changes

- Added `access_token_validation_model` column to `service_details_oidc` and `service_petition_details_oidc` tables.

```sql
ALTER TABLE service_details_oidc
ADD COLUMN access_token_validation_model VARCHAR(256);

ALTER TABLE service_petition_details_oidc
ADD COLUMN access_token_validation_model VARCHAR(256);
```

## [1.6.0]

### Security

- Fixed improper access control affecting administrative endpoints.
- Enforced admin authorization on `GET /tenants` to prevent exposure of tenant configuration details.
- Enforced admin authorization on `/tenants/:tenant/agents` CRUD endpoints to prevent unauthorized access to deployer configuration.

## [1.5.2]

### Fixed

- Improved use of openid-client callback flow

## [1.5.1]

### Fixed

- Fixed Organizations Bug when field is active but not required
- Increased Token size in initialization script

## [1.5.0]

### Added

- Extended Owners group View to include (Name, Sub)

### Fixed

- Hide internal reviewer comments from simple users

## [1.4.2]

### Fixed

- Allow for no scopes when no grant types are selected

## [1.4.1]

### Fixed

- Bug when editing petitions for multivalued fields
- Errors on review page with no grant types
- Indications on multivalued fields on review page

## [1.4.0]

### Added

- Added Code of Conduct, Contributing and codemeta files

### Changed

- Update order of OIDC fields to improve user experience
- Update validation to allow for no Grant Types services (resource servers)

### Fixed

- Update notifications having wrong details
- Added sanitization for string service fields

## [1.3.6]

### Fixed

- Fixed Bug Showing Review Button to End Users
- Fixed Admin filters not showing

## [1.3.5]

### Fixed

- Fixed Bug for Deregistation Review Prompt Modal

## [1.3.4]

### Fixed

- Added Review prompt after submitting deregistration requests

## [1.3.3]

### Fixed

- Update Values for immediate Review after editing a reconfiguration request
- Copy Service is also available for instances with only one environment
