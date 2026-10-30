// @hyperjump/uri is ESM-only, while the backend is still CommonJS. Cache the
// dynamic import so every validation request shares the same module-loading
// promise instead of importing the package again for every submitted URI.
let uriLibraryPromise;
const loadUriLibrary = () => {
  if (!uriLibraryPromise) {
    uriLibraryPromise = import("@hyperjump/uri");
  }
  return uriLibraryPromise;
};

// Preserve the historical exception that allows a bare private address in a
// tenant-configured test environment. These deliberately remain policy regexes:
// a bare address is not an RFC 3986 absolute URI, so the URI library cannot
// represent this registry-specific compatibility exception.
const PRIVATE_IPV4 = /^(10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:[0-9]{1,3}\.)[0-9]{1,3}|192\.168\.(?:[0-9]{1,3}\.)[0-9]{1,3})$/;
const PRIVATE_IPV6 = /^(::1|fe80::(?:[0-9a-fA-F]{1,4})(?::[0-9a-fA-F]{1,4}){0,6}|fc[0-9a-fA-F]{2}::(?:[0-9a-fA-F]{1,4})(?::[0-9a-fA-F]{1,4}){0,6})$/;

// Mirrors Keycloak's protection against raw, encoded, and double-encoded
// parent-directory segments. This is an application security policy rather
// than generic URI syntax, so it remains after RFC validation. Applying it to
// the parsed raw path avoids rejecting harmless query data containing `/../`.
const UNSAFE_PATH =
  /(?:^|\/|%2f|%5c|\\)(?:%2e|%252e|\.){2}(?:\/|%2f|%5c|\\|;|%3b|%09|%0a|%0d|%00|$)/i;

/**
 * Validate one OIDC redirect or post-logout redirect URI.
 *
 * Hyperjump owns generic RFC 3986 absolute-URI recognition. This helper then
 * applies registry policy that RFC 3986 intentionally does not cover, such as
 * the web/native scheme rules, test-environment exception, and unsafe path
 * rejection. The submitted value is never normalized or serialized, ensuring
 * the exact string accepted here is the one retained for deployment.
 *
 * Required fields, array shape, uniqueness, grant applicability, and tenant
 * lookup remain with the surrounding Express validators.
 *
 * @param {*} value Exact value supplied by the caller.
 * @param {object} options Validation context.
 * @param {string} options.applicationType `WEB` or the existing native type.
 * @param {boolean} options.isTestEnvironment Whether the tenant marks the
 *   selected integration environment as a test environment.
 * @returns {Promise<string|null>} A user-facing validation reason, or null
 *   when the submitted value is valid.
 */
const validateRedirectUri = async (
  value,
  { applicationType, isTestEnvironment } = {},
) => {
  if (typeof value !== "string") {
    return "Uri must be a string";
  }

  // This is the only intentional exception to the absolute-URI requirement.
  // Anchoring prevents a path, query, or punctuation from entering this branch.
  if (
    isTestEnvironment &&
    (PRIVATE_IPV4.test(value) || PRIVATE_IPV6.test(value))
  ) {
    return null;
  }

  // RFC 6749 gives fragments a specific prohibition. Check the submitted text
  // first so both a populated fragment and an empty trailing `#` receive the
  // useful policy message instead of Hyperjump's generic syntax message.
  if (value.includes("#")) {
    return "Uri can't contain fragments";
  }

  const { isAbsoluteUri, parseAbsoluteUri } = await loadUriLibrary();

  // isAbsoluteUri enforces the RFC 3986 grammar, including a required scheme,
  // valid component characters, and complete percent escapes. Unlike WHATWG
  // URL parsing, it rejects bad input rather than silently trimming or encoding
  // it (notably the trailing quote that caused the deployment failure).
  if (!isAbsoluteUri(value)) {
    return "Uri must be a valid absolute URI";
  }

  // Parsing is safe after validation and returns the original component text.
  // Do not compose these components back into a URI: doing so would normalize
  // the user's value and could make validation differ from stored deployment.
  const uri = parseAbsoluteUri(value);

  if (value.includes("*")) {
    return "Uri can't contain wildcard character '*'";
  }
  if (UNSAFE_PATH.test(uri.path)) {
    return "Uri can't contain parent-directory traversal";
  }

  // Match the previous username/password check: reject non-empty userinfo while
  // retaining the historical handling of a syntactically empty userinfo field.
  if (uri.userinfo) {
    return "Uri can't contain user information";
  }

  const scheme = uri.scheme.toLowerCase();

  // Preserve the registry's application/environment scheme policy. RFC 3986
  // permits hostless absolute URIs, so web callbacks additionally require an
  // explicit authority and host. Host comparison is case-insensitive, as it was
  // with the previous WHATWG URL implementation.
  if (applicationType === "WEB") {
    if (isTestEnvironment) {
      if (scheme !== "http" && scheme !== "https") {
        return "Uri must be a url starting with http(s):// ";
      }
    } else if (
      scheme !== "https" &&
      !(scheme === "http" && uri.host?.toLowerCase() === "localhost")
    ) {
      return "Uri must be a secure url starting with https://";
    }

    if (uri.authority === undefined || !uri.host) {
      return "Uri must include an authority and host";
    }
  } else {
    // Native clients retain RFC-valid custom schemes, except schemes capable of
    // executing script or embedding data directly in a browser context.
    if (scheme === "javascript") {
      return "Uri can't be of schema 'javascript:'";
    }
    if (scheme === "data") {
      return "Uri can't be of schema 'data:'";
    }
  }

  return null;
};

module.exports = {
  validateRedirectUri,
};
