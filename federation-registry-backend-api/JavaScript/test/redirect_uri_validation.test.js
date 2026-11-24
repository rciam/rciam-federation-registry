"use strict";

const { expect } = require("chai");
const {
  validateRedirectUri,
} = require("../redirectUriValidation.js");

const WEB_OPTIONS = {
  applicationType: "WEB",
  isTestEnvironment: false,
};

describe("OIDC redirect URI validation", function () {
  const forbiddenParameters = [
    "code",
    "id_token",
    "access_token",
    "token_type",
    "expires_in",
    "state",
    "iss",
    "error",
    "error_description",
    "session_state",
    "response",
    "kc_action",
    "kc_action_status",
  ];

  forbiddenParameters.forEach((parameter) => {
    it(`rejects the reserved ${parameter} response parameter`, async function () {
      const error = await validateRedirectUri(
        `https://client.example/callback?${parameter}=value`,
        WEB_OPTIONS,
      );

      expect(error).to.equal(
        `Uri can't contain reserved OIDC response parameter '${parameter}'`,
      );
    });
  });

  it("matches reserved parameter names case-insensitively", async function () {
    const error = await validateRedirectUri(
      "https://client.example/callback?STATE=value",
      WEB_OPTIONS,
    );

    expect(error).to.equal(
      "Uri can't contain reserved OIDC response parameter 'STATE'",
    );
  });

  it("rejects percent-encoded reserved parameter names", async function () {
    const error = await validateRedirectUri(
      "https://client.example/callback?st%61te=value",
      WEB_OPTIONS,
    );

    expect(error).to.equal(
      "Uri can't contain reserved OIDC response parameter 'state'",
    );
  });

  it("allows reserved words outside parameter names", async function () {
    const error = await validateRedirectUri(
      "https://client.example/state?continue=code%3Dvalue",
      WEB_OPTIONS,
    );

    expect(error).to.equal(null);
  });

  it("continues to reject URI fragments", async function () {
    const error = await validateRedirectUri(
      "https://client.example/callback#state=value",
      WEB_OPTIONS,
    );

    expect(error).to.equal("Uri can't contain fragments");
  });
});
