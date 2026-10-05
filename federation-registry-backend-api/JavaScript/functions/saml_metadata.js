'use-strict';
var convert = require('xml-js');
var { addressRefusal } = require('./url_guard.js');

// Everything the registry understands about a SAML metadata document, apart from the route so it
// can be tested without a database, a session or a web server.

// Raised for a metadata url the registry will not use.
//
// The message travels in the response body, never res.statusMessage: http/2 has no reason phrase,
// so a browser sees an empty statusText and the user would see nothing at all.
class MetadataInfoError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'MetadataInfoError';
    this.status = status || 400;
  }
}

// The answer for a failed metadata request, or null for the route's last resort. The distinction
// that matters is refused (400, the address is inside our network) versus unreachable (404);
// answering "no response" to a refusal sends the user hunting a fault in a url that is fine.
// Statuses follow swagger.json.
function refuseMetadataRequest(err) {
  const refused = addressRefusal(err);
  if (refused) {
    return { status: refused.status || 400, message: refused.message };
  }
  if (err instanceof MetadataInfoError) {
    return { status: err.status, message: err.message };
  }
  if (err && err.code === 'ECONNABORTED') {
    return { status: 404, message: 'The metadata url took too long to answer.' };
  }
  // axios reports an over-long body under the same ERR_BAD_RESPONSE as a bad status, so only the
  // message tells them apart.
  if (err && String(err.message || '').indexOf('maxContentLength size of') === 0) {
    return { status: 404, message: 'The metadata url answered with more data than a metadata document should hold.' };
  }
  return null;
}

// ---------------------------------------------------------------- xml-js in compact mode
//
// Names keep whatever namespace prefix the document used, so elements are matched on the part
// after the colon.

function localPart(tag) {
  return String(tag).slice(String(tag).lastIndexOf(':') + 1);
}

function textOf(node) {
  if (typeof node === 'string') {
    const text = node.trim();
    return text === '' ? undefined : text;
  }
  if (node && typeof node === 'object') {
    return textOf(node._text);
  }
  return undefined;
}

function attributesOf(element) {
  return (element && element._attributes) || {};
}

function languageOf(element) {
  const attributes = attributesOf(element);
  return attributes['xml:lang'] || attributes.lang || '';
}

// Walks the whole subtree - a mdui display name sits several levels below the descriptor. Depth is
// capped so a document cannot hang the server; _* and ?* are xml-js bookkeeping, not elements.
function childElements(node, name, depth) {
  const found = [];
  if (!node || typeof node !== 'object' || depth > 8) {
    return found;
  }
  Object.keys(node).forEach((key) => {
    if (key.startsWith('_') || key.startsWith('?')) {
      return;
    }
    const entries = Array.isArray(node[key]) ? node[key] : [node[key]];
    entries.forEach((entry) => {
      if (localPart(key) === name) {
        found.push(entry);
      }
      found.push.apply(found, childElements(entry, name, depth + 1));
    });
  });
  return found;
}

// These repeat once per language and the registry stores one value: unlabelled, then English,
// then the first.
function selectByLanguage(elements) {
  const usable = elements.filter((element) => textOf(element));
  if (usable.length === 0) {
    return undefined;
  }
  const neutral = usable.find((element) => languageOf(element) === '');
  const chosen = neutral
    || usable.find((element) => languageOf(element).toLowerCase().indexOf('en') === 0)
    || usable[0];
  return textOf(chosen);
}

function textDeep(descriptor, name) {
  return selectByLanguage(childElements(descriptor, name, 0));
}

// The document's own prefix for the metadata namespace. The walk stops at the descriptor: a
// trailing top-level comment (metadatatool and aggregators emit one) read as the prefix would make
// a prefixed document look unprefixed and the descriptor would go unfound.
function extractNamespace(xml) {
  for (const attribute of Object.keys(xml || {})) {
    const match = /^(.*):EntityDescriptor/.exec(attribute);
    if (match && match[1]) {
      return match[1] + ":";
    }
  }
  return "";
}

// The one AttributeConsumingService to read, with the attributes it asks for. Services publish one
// per language with the same list in each, so only the first asking-for-anything is read and
// duplicates are dropped - the form's table is keyed by friendly name and cannot show a row twice.
function chosenService(descriptor) {
  const consuming = childElements(descriptor, 'AttributeConsumingService', 0);
  for (let i = 0; i < consuming.length; i++) {
    const requested = childElements(consuming[i], 'RequestedAttribute', 0);
    if (requested.length === 0) {
      continue;
    }
    const seen = {};
    const collected = [];
    requested.forEach((attribute) => {
      const values = attributesOf(attribute);
      const key = (values.Name || '') + ' ' + (values.FriendlyName || '');
      if (seen[key]) {
        return;
      }
      seen[key] = true;
      collected.push({
        friendly_name: values.FriendlyName,
        name: values.Name,
        // Serialised as the string "true"/"false" - a truthy check was true for both.
        required: values.isRequired === 'true' || values.isRequired === '1',
        name_format: values.NameFormat
      });
    });
    return { element: consuming[i], requested_attributes: collected };
  }
  // None asks for anything; the first still carries the service's name, if any does.
  return { element: consuming[0], requested_attributes: [] };
}

// The name and description the metadata gives this service: the AttributeConsumingService's own
// first, then an mdui DisplayName/Description (what the consent page shows, the same text the form
// field wants), then anywhere else in the document.
function descriptiveFields(descriptor, service) {
  const take = (name, uiName) => selectByLanguage(childElements(service, name, 0))
    || textDeep(descriptor, uiName)
    || textDeep(descriptor, name);
  return {
    service_name: take('ServiceName', 'DisplayName'),
    service_description: take('ServiceDescription', 'Description')
  };
}

// ---------------------------------------------------------------- what the registry takes from it

// The requested attributes, split by whether this tenant offers them (matched on Name, the
// attribute's identity). A nameless attribute cannot be stored (NOT NULL, 512 cap) so it goes to the
// unsupported list, where the user hears about it, rather than failing on submit.
//
// Supported ones are handed over under the TENANT's friendly_name, not the document's: the table is
// keyed by it and the schema accepts nothing outside the tenant's list, so a document label would
// fail validation with no row to unset. The rename never duplicates or drops a row.
function partitionAttributes(requested, offered) {
  const supported = [];
  const taken = {};
  const unmatched = [];
  requested.forEach((attribute) => {
    const tenantAttribute = typeof attribute.name === 'string'
      && attribute.name.length > 0
      && attribute.name.length <= 512
      && !!attribute.friendly_name
      && offered.find((x) => x.name === attribute.name);
    if (tenantAttribute) {
      if (taken[tenantAttribute.friendly_name]) {
        return;
      }
      taken[tenantAttribute.friendly_name] = true;
      supported.push(Object.assign({}, attribute, { friendly_name: tenantAttribute.friendly_name }));
    }
    else {
      unmatched.push(attribute);
    }
  });
  return { supported_attributes: supported, unsupported_attributes: unmatched };
}

// Warnings about a document that was read: reported, not thrown. The code lets the form drop the
// attribute ones when the tenant has no attribute table.
function collectWarnings(parsed) {
  const warnings = [];
  if (parsed.supported_attributes.length === 0 && !parsed.entity_id) {
    warnings.push({ code: 'nothing_found', text: 'Could not find an Entity Id or any Requested Attributes from this Metadata Url.' });
  }
  else if (parsed.supported_attributes.length === 0) {
    warnings.push({ code: 'no_attributes', text: 'Could not find any Requested Attributes from this Metadata Url.' });
  }
  else if (!parsed.entity_id) {
    warnings.push({ code: 'no_entity_id', text: 'Could not find an Entity Id from this Metadata Url.' });
  }
  if (parsed.unsupported_attributes.length > 0 && parsed.supported_attributes.length > 0) {
    const names = parsed.unsupported_attributes.map(a => a.friendly_name || a.name).join(', ');
    warnings.push({
      code: 'unsupported_attributes',
      text: names + (parsed.unsupported_attributes.length > 1 ? ' are' : ' is')
        + ' not supported by this federation and ' + (parsed.unsupported_attributes.length > 1 ? 'were' : 'was') + ' left out.'
    });
  }
  return warnings;
}

// Reads a metadata document and answers only the fields the registry has somewhere to put: ACS url,
// name id format, key descriptors and contacts have no column and no form field, and the
// organisation is left to the user because filling it creates an ROR organisation record.
function parseMetadataDocument(document, offered_attributes) {
  let result;
  try {
    result = convert.xml2js(document, { compact: true, spaces: 4 });
  }
  catch (err) {
    throw new MetadataInfoError('Could not load XML from Metadata Url.', 404);
  }
  if (!result || typeof result !== 'object') {
    throw new MetadataInfoError('Could not load XML from Metadata Url.', 404);
  }

  const ns = extractNamespace(result);
  if (!Object.prototype.hasOwnProperty.call(result, ns + 'EntityDescriptor')) {
    throw new MetadataInfoError('XML contained in the metadata is not Valid.', 404);
  }
  const descriptor = result[ns + 'EntityDescriptor'];

  // Saying "no attributes found" for an IdP would send the user hunting a fault they do not have.
  if (childElements(descriptor, 'SPSSODescriptor', 0).length === 0) {
    if (childElements(descriptor, 'IDPSSODescriptor', 0).length > 0) {
      throw new MetadataInfoError('The metadata describe an identity provider and not a service.', 404);
    }
    throw new MetadataInfoError('XML contained in the metadata is not Valid.', 404);
  }

  let entity_id;
  try {
    entity_id = descriptor['_attributes'].entityID;
  }
  catch (err) { }

  const service = chosenService(descriptor);
  const partitioned = partitionAttributes(service.requested_attributes, offered_attributes || []);
  const parsed = Object.assign({
    entity_id: entity_id,
    supported_attributes: partitioned.supported_attributes,
    unsupported_attributes: partitioned.unsupported_attributes
  }, descriptiveFields(descriptor, service.element));
  parsed.warnings = collectWarnings(parsed);
  return parsed;
}

module.exports = {
  parseMetadataDocument,
  MetadataInfoError,
  refuseMetadataRequest,
  // Exported for the tests.
  childElements: childElements,
  selectByLanguage: selectByLanguage,
  extractNamespace: extractNamespace
};
