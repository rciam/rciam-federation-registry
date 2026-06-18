# Changelog

All notable changes in Federation Registry will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
