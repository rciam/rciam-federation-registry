import { validateRedirectUri } from "./redirectUriValidation.js";

// Create React App's Jest configuration does not transform the ESM-only
// @hyperjump/uri package. Keep its generic URI parsing out of these policy
// tests; the production build exercises the real dependency.
jest.mock("@hyperjump/uri", () => ({
  isAbsoluteUri: () => true,
  parseAbsoluteUri: (value) => {
    const uri = new URL(value);
    return {
      scheme: uri.protocol.slice(0, -1),
      authority: uri.host,
      host: uri.hostname,
      path: uri.pathname,
      query: uri.search.slice(1),
      userinfo: uri.username || uri.password,
    };
  },
}));

const WEB_OPTIONS = {
  applicationType: "WEB",
  isTestEnvironment: false,
};

const ENABLED_WEB_OPTIONS = {
  ...WEB_OPTIONS,
  validateOidcParameters: true,
};

describe("OIDC redirect URI validation", () => {
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

  test.each(forbiddenParameters)(
    "rejects the reserved %s response parameter",
    (parameter) => {
      expect(
        validateRedirectUri(
          `https://client.example/callback?${parameter}=value`,
          ENABLED_WEB_OPTIONS,
        ),
      ).toBe(
        `Uri can't contain reserved OIDC response parameter '${parameter}'`,
      );
    },
  );

  test("matches reserved parameter names case-insensitively", () => {
    expect(
      validateRedirectUri(
        "https://client.example/callback?STATE=value",
        ENABLED_WEB_OPTIONS,
      ),
    ).toBe("Uri can't contain reserved OIDC response parameter 'STATE'");
  });

  test("rejects percent-encoded reserved parameter names", () => {
    expect(
      validateRedirectUri(
        "https://client.example/callback?st%61te=value",
        ENABLED_WEB_OPTIONS,
      ),
    ).toBe("Uri can't contain reserved OIDC response parameter 'state'");
  });

  test("allows reserved words outside parameter names", () => {
    expect(
      validateRedirectUri(
        "https://client.example/state?continue=code%3Dvalue",
        WEB_OPTIONS,
      ),
    ).toBeNull();
  });

  test("allows reserved response parameters by default", () => {
    expect(
      validateRedirectUri(
        "https://client.example/callback?state=value",
        WEB_OPTIONS,
      ),
    ).toBeNull();
  });

  test("continues to reject URI fragments", () => {
    expect(
      validateRedirectUri(
        "https://client.example/callback#state=value",
        WEB_OPTIONS,
      ),
    ).toBe("Uri can't contain fragments");
  });
});
