'use-strict';
var chai = require('chai');
var expect = chai.expect;
const { parseMetadataDocument, MetadataInfoError, refuseMetadataRequest } = require('../functions/saml_metadata.js');
const { UnsafeUrlError } = require('../functions/url_guard.js');

// What the registry understands about a metadata document, without a web server, a session or a
// database. The documents carry a namespace prefix, as real ones do.

const MAIL = 'urn:oid:0.9.2342.19200300.100.1.3';
const SN = 'urn:oid:2.5.4.4';
const UNKNOWN = 'urn:example:attribute-def:nope';

// A tenant offering mail and sn, which is what an attribute table could render.
const offered = [
  { friendly_name: 'mail', name: MAIL },
  { friendly_name: 'sn', name: SN }
];

// An entity descriptor; leaveSpRole makes an IdP one, null entityId a descriptor without an id.
const descriptor = (role, entity_id) => '<?xml version="1.0"?>'
  + '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"'
  + (entity_id === null ? '' : ' entityID="https://sp.example.org/shibboleth"') + '>'
  + '<md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">'
  + role + '</md:SPSSODescriptor></md:EntityDescriptor>';

const idpDescriptor = () => '<?xml version="1.0"?>'
  + '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.example.org/saml/metadata">'
  + '<md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"></md:IDPSSODescriptor>'
  + '</md:EntityDescriptor>';

const consuming = (attributes) => '<md:AttributeConsumingService index="0">'
  + '<md:ServiceName xml:lang="en">Example</md:ServiceName>' + attributes + '</md:AttributeConsumingService>';

const requested = (name, friendly, required) => '<md:RequestedAttribute Name="' + name + '"'
  + (friendly ? ' FriendlyName="' + friendly + '"' : '')
  + (required === undefined ? '' : ' isRequired="' + required + '"')
  + ' NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>';

// A document asking for exactly these attributes.
const askingFor = (attributes, entity_id) => descriptor(consuming(attributes), entity_id);

describe('# SAML metadata', function () {

  describe('refuses what is not the metadata of a service', function () {
    const refused = [
      ['a body that is not xml', 'this is not xml, it is a json {"a":1}'],
      ['an empty body', ''],
      ['an html page, which is what a captive portal answers', '<html><body>Sign in</body></html>'],
      ['xml with no entity descriptor', '<md:EntitiesDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntitiesDescriptor>'],
      ['a descriptor holding no role', '<?xml version="1.0"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://sp.example.org/shibboleth"><md:Extensions/></md:EntityDescriptor>']
    ];
    refused.forEach(([name, body]) => {
      it('refuses ' + name, function () {
        expect(() => parseMetadataDocument(body, offered)).to.throw(MetadataInfoError);
      });
    });

    it('refuses an identity provider by name rather than as malformed', function () {
      expect(() => parseMetadataDocument(idpDescriptor(), offered)).to.throw(/identity provider/);
    });

    it('refuses with 404, so the form does not report a client error', function () {
      try {
        parseMetadataDocument('<nothing/>', offered);
        expect.fail('should have refused the document');
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(MetadataInfoError);
        expect(err.status).to.equal(404);
      }
    });

    it('accepts a service that also publishes an IdP role', function () {
      const both = descriptor('') + '<md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"></md:IDPSSODescriptor>';
      const body = '<?xml version="1.0"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://both.example.org/metadata">'
        + both + '</md:EntityDescriptor>';
      expect(() => parseMetadataDocument(body, offered)).to.not.throw();
    });

    it('refuses when given no document at all', function () {
      [undefined, null, 42, {}].forEach((body) => {
        expect(() => parseMetadataDocument(body, offered)).to.throw(MetadataInfoError);
      });
    });
  });

  describe('reads the fields the registry stores', function () {
    it('takes the entity id', function () {
      expect(parseMetadataDocument(descriptor(''), offered).entity_id).to.equal('https://sp.example.org/shibboleth');
    });

    it('tolerates a descriptor without an entity id', function () {
      const parsed = parseMetadataDocument(descriptor(consuming(requested(MAIL, 'mail', 'true')), null), offered);
      expect(parsed.entity_id).to.equal(undefined);
      expect(parsed.warnings.map(w => w.code)).to.deep.equal(['no_entity_id']);
    });

    it('takes the service name from the service that was read, not from a same-named element elsewhere', function () {
      // the ServiceName inside AttributeConsumingService names the service, so it wins
      const inner = '<md:ServiceName xml:lang="en">The other one</md:ServiceName>'
        + consuming(requested(MAIL, 'mail', 'true'));
      expect(parseMetadataDocument(descriptor(inner), offered).service_name).to.equal('Example');
    });

    it('falls back to a mdui display name, which is what a service asks to be called on the consent page', function () {
      const inner = '<init:DiscoveryAndRegistrationProtocol xmlns:init="urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol">'
        + '<mdui:UIInfo xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui">'
        + '<mdui:DisplayName xml:lang="en">Displayed name</mdui:DisplayName>'
        + '<mdui:Description xml:lang="en">Displayed description</mdui:Description>'
        + '</mdui:UIInfo></init:DiscoveryAndRegistrationProtocol>';
      const parsed = parseMetadataDocument(descriptor(inner), offered);
      expect(parsed.service_name).to.equal('Displayed name');
      expect(parsed.service_description).to.equal('Displayed description');
    });

    it('falls back to a name the publisher put somewhere the registry did not expect', function () {
      const inner = '<md:Extensions><wrapper><md:ServiceName xml:lang="en">Buried name</md:ServiceName></wrapper></md:Extensions>';
      expect(parseMetadataDocument(descriptor(inner), offered).service_name).to.equal('Buried name');
    });

    it('answers undefined rather than inventing a name', function () {
      const unnamed = descriptor('<md:AttributeConsumingService index="0">'
        + requested(MAIL, 'mail', 'true') + '</md:AttributeConsumingService>');
      const parsed = parseMetadataDocument(unnamed, offered);
      expect(parsed.service_name).to.equal(undefined);
      expect(parsed.service_description).to.equal(undefined);
      // the attributes were found regardless
      expect(parsed.supported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
    });

    it('prefers an unlabelled value, then English, when a document gives several', function () {
      const english = descriptor('<md:ServiceName xml:lang="cs">Příklad</md:ServiceName><md:ServiceName xml:lang="en">Example</md:ServiceName>');
      expect(parseMetadataDocument(english, offered).service_name).to.equal('Example');
      const unlabelled = descriptor('<md:ServiceName xml:lang="cs">Příklad</md:ServiceName><md:ServiceName>Plain</md:ServiceName>');
      expect(parseMetadataDocument(unlabelled, offered).service_name).to.equal('Plain');
      const onlyCzech = descriptor('<md:ServiceName xml:lang="cs">Příklad</md:ServiceName>');
      expect(parseMetadataDocument(onlyCzech, offered).service_name).to.equal('Příklad');
    });

    it('works with whatever namespace prefix the document chose', function () {
      const prefixed = '<?xml version="1.0"?><fed:EntityDescriptor xmlns:fed="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://sp.example.org/shibboleth">'
        + '<fed:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">'
        + '<fed:ServiceName xml:lang="en">Example service</fed:ServiceName>'
        + '<fed:AttributeConsumingService index="0">'
        + '<fed:RequestedAttribute Name="' + MAIL + '" FriendlyName="mail" isRequired="true"/>'
        + '</fed:AttributeConsumingService></fed:SPSSODescriptor></fed:EntityDescriptor>';
      const parsed = parseMetadataDocument(prefixed, offered);
      expect(parsed.entity_id).to.equal('https://sp.example.org/shibboleth');
      expect(parsed.service_name).to.equal('Example service');
      expect(parsed.supported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
    });

    it('works with no namespace prefix at all', function () {
      const bare = '<?xml version="1.0"?><EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://sp.example.org/shibboleth">'
        + '<SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"></SPSSODescriptor></EntityDescriptor>';
      expect(parseMetadataDocument(bare, offered).entity_id).to.equal('https://sp.example.org/shibboleth');
    });

    it('still reads a prefixed document that carries something after the descriptor', function () {
      // The prefix has to be read off the descriptor and the search stop there: reading on lets a
      // trailing comment sibling stand in for it, and a valid prefixed document is refused.
      const trailing = descriptor(consuming(requested(MAIL, 'mail')))
        + '\n<!-- generated by metadatatool -->';
      const parsed = parseMetadataDocument(trailing, offered);
      expect(parsed.entity_id).to.equal('https://sp.example.org/shibboleth');
      expect(parsed.supported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
    });
  });

  describe('reads the requested attributes', function () {
    it('keeps the four fields the service table stores', function () {
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail', 'true')), offered);
      expect(parsed.supported_attributes).to.deep.equal([{
        friendly_name: 'mail',
        name: MAIL,
        required: true,
        name_format: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri'
      }]);
    });

    it('reads isRequired="false" as not required', function () {
      // taking the attribute itself for a boolean, as this used to, gave true here
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail', 'false')), offered);
      expect(parsed.supported_attributes[0].required).to.equal(false);
    });

    it('treats an attribute without isRequired as not required', function () {
      expect(parseMetadataDocument(askingFor(requested(MAIL, 'mail')), offered).supported_attributes[0].required).to.equal(false);
    });

    it('separates what this tenant offers from what it does not', function () {
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail', 'true') + requested(UNKNOWN, 'nope', 'true')), offered);
      expect(parsed.supported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
      expect(parsed.unsupported_attributes.map(a => a.friendly_name)).to.deep.equal(['nope']);
    });

    it('counts every attribute as unsupported for a tenant that offers none', function () {
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail', 'true')), []);
      expect(parsed.supported_attributes).to.deep.equal([]);
      expect(parsed.unsupported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
    });

    it('will not offer an attribute the form could not submit', function () {
      // neither name nor friendly_name can be written if missing, and name is capped at 512
      const cases = [
        ['no name', '<md:RequestedAttribute FriendlyName="mail"/>'],
        ['no friendly name', '<md:RequestedAttribute Name="' + MAIL + '"/>'],
        ['a name longer than the column', '<md:RequestedAttribute Name="' + 'a'.repeat(600) + '" FriendlyName="mail"/>']
      ];
      cases.forEach(([name, attribute]) => {
        const parsed = parseMetadataDocument(descriptor(consuming(attribute)), offered);
        expect(parsed.supported_attributes, name).to.deep.equal([]);
        expect(parsed.unsupported_attributes, name).to.have.length(1);
      });
    });

    it('reads one AttributeConsumingService and not all of them', function () {
      // one per language, same list in each; reading them all would double the attributes
      const two = descriptor(consuming(requested(MAIL, 'mail', 'true'))
        + '<md:AttributeConsumingService index="1"><md:ServiceName xml:lang="cs">Příklad</md:ServiceName>'
        + requested(MAIL, 'mail', 'true') + requested(SN, 'sn', 'false') + '</md:AttributeConsumingService>');
      expect(parseMetadataDocument(two, offered).supported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
    });

    it('skips an AttributeConsumingService that asks for nothing', function () {
      const emptyFirst = descriptor('<md:AttributeConsumingService index="0"><md:ServiceName xml:lang="en">Example</md:ServiceName></md:AttributeConsumingService>'
        + consuming(requested(SN, 'sn', 'true')));
      expect(parseMetadataDocument(emptyFirst, offered).supported_attributes.map(a => a.friendly_name)).to.deep.equal(['sn']);
    });

    it('drops an attribute repeated inside the service it read', function () {
      const doubled = askingFor(requested(MAIL, 'mail', 'true') + requested(MAIL, 'mail', 'true'));
      expect(parseMetadataDocument(doubled, offered).supported_attributes).to.have.length(1);
    });

    it('offers an attribute the tenant has under the tenant\'s own name', function () {
      // Another federation's label for the same uri. The tenant's label is the only one its form can
      // hold, so the entry has to arrive renamed.
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'ema_il', 'true')), offered);
      expect(parsed.supported_attributes).to.deep.equal([{
        friendly_name: 'mail',
        name: MAIL,
        required: true,
        name_format: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri'
      }]);
      expect(parsed.unsupported_attributes).to.deep.equal([]);
    });

    it('hands over one row for a document naming one attribute twice', function () {
      // renaming onto the tenant's label can collide two entries; the table keys rows by friendly name
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail') + requested(MAIL, 'ema_il')), offered);
      expect(parsed.supported_attributes.map((a) => a.friendly_name)).to.deep.equal(['mail']);
    });
  });

  describe('says what a readable document is missing', function () {
    const codes = (body) => parseMetadataDocument(body, offered).warnings.map(w => w.code);

    it('says nothing when the document has an entity id and an offered attribute', function () {
      expect(codes(askingFor(requested(MAIL, 'mail', 'true')))).to.deep.equal([]);
    });

    it('says when it found neither an entity id nor attributes', function () {
      expect(codes(descriptor('', null))).to.deep.equal(['nothing_found']);
    });

    it('says when it found none of the attributes this tenant offers', function () {
      expect(codes(askingFor(requested(UNKNOWN, 'nope', 'true')))).to.deep.equal(['no_attributes']);
      expect(codes(askingFor(''))).to.deep.equal(['no_attributes']);
    });

    it('says when it found no entity id', function () {
      expect(codes(askingFor(requested(MAIL, 'mail', 'true'), null))).to.deep.equal(['no_entity_id']);
    });

    it('names the attributes it left out', function () {
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail', 'true')
        + requested(UNKNOWN, 'nope', 'true') + requested('urn:example:other', 'nope2', 'true')), offered);
      const warning = parsed.warnings.find(w => w.code === 'unsupported_attributes');
      expect(warning.text).to.contain('nope');
      expect(warning.text).to.contain('nope2');
      expect(warning.text).to.contain(' are not supported');
    });

    it('says is not supported for a single attribute left out', function () {
      const parsed = parseMetadataDocument(askingFor(requested(MAIL, 'mail', 'true') + requested(UNKNOWN, 'nope', 'true')), offered);
      expect(parsed.warnings.find(w => w.code === 'unsupported_attributes').text).to.contain(' is not supported');
    });

    it('does not report one shortfall twice', function () {
      // only unsupported attributes is already the "no attributes" case
      expect(codes(askingFor(requested(UNKNOWN, 'nope', 'true')))).to.deep.equal(['no_attributes']);
    });

    it('says nothing about the entity id when the attributes say enough', function () {
      expect(codes(askingFor(requested(MAIL, 'mail', 'true'), null))).to.deep.equal(['no_entity_id']);
    });

    it('gives every warning a code the form can decide on', function () {
      [descriptor('', null), askingFor(requested(UNKNOWN, 'nope', 'true')), askingFor(requested(MAIL, 'mail') + requested(UNKNOWN, 'nope'))]
        .forEach((body) => parseMetadataDocument(body, offered).warnings.forEach((warning) => {
          expect(warning).to.have.property('code').that.is.a('string');
          expect(warning).to.have.property('text').that.is.a('string').and.is.not.empty;
        }));
    });
  });

  describe('survives documents that are well formed but unhelpful', function () {
    it('handles a descriptor whose only child is an empty element', function () {
      expect(parseMetadataDocument(descriptor('<md:Extensions/>'), offered).supported_attributes).to.deep.equal([]);
    });

    it('caps how deep it walks, so a document cannot hang the server', function () {
      let inner = consuming(requested(MAIL, 'mail', 'true'));
      for (let i = 0; i < 40; i++) {
        inner = '<wrapper>' + inner + '</wrapper>';
      }
      // depth is capped; what matters is returning rather than recursing until the process dies
      expect(() => parseMetadataDocument(descriptor(inner), offered)).to.not.throw();
    });

    it('reads past a signature and a key descriptor it ignores', function () {
      const signed = descriptor('<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:SignedInfo><ds:SignatureValue>abc</ds:SignatureValue></ds:SignedInfo></ds:Signature>'
        + '<md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDlong</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor>'
        + consuming(requested(MAIL, 'mail', 'true')));
      const parsed = parseMetadataDocument(signed, offered);
      expect(parsed.entity_id).to.equal('https://sp.example.org/shibboleth');
      expect(parsed.supported_attributes.map(a => a.friendly_name)).to.deep.equal(['mail']);
    });

    it('reports only the fields the registry can store', function () {
      // endpoints, name id format, certificates and contacts have no column and no field
      const rich = descriptor('<md:AssertionConsumerService index="0" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://sp.example.org/acs"/>'
        + '<md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://sp.example.org/slo"/>'
        + '<md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:transient</md:NameIDFormat>'
        + '<md:Organization><md:OrganizationName xml:lang="en">Example Org</md:OrganizationName></md:Organization>'
        + '<md:ContactPerson contactType="technical"><md:EmailAddress>tech@example.org</md:EmailAddress></md:ContactPerson>'
        + consuming(requested(MAIL, 'mail', 'true')));
      const parsed = parseMetadataDocument(rich, offered);
      expect(Object.keys(parsed).sort()).to.deep.equal(
        ['entity_id', 'service_description', 'service_name', 'supported_attributes', 'unsupported_attributes', 'warnings']);
      // the ServiceName inside AttributeConsumingService names the service
      expect(parsed.service_name).to.equal('Example');
    });

    it('answers the same shape whatever the document held', function () {
      const parsed = parseMetadataDocument(descriptor(''), offered);
      expect(parsed.supported_attributes).to.be.an('array');
      expect(parsed.unsupported_attributes).to.be.an('array');
      expect(parsed.warnings).to.be.an('array');
    });
  });

  // The two lists are the whole of what the form is handed. Everything below goes through
  // parseMetadataDocument, as the route calls it, rather than partitionAttributes on its own.
  describe('keeps the two lists apart the way the form reads them', function () {

    // The registry's global list, rather than a fixture: what the endpoint offers and what the form's
    // attribute table renders are both that list narrowed by the tenant, and that agreement is what
    // is worth holding here. Reproduced because neither narrowing is exported.
    const globalList = require('../tenant_config/requested_attributes.json');
    const tenantOffers = (supported) => globalList.filter((x) => supported.includes(x.friendly_name));

    // A tenant offering three, which leaves plenty of real attributes unoffered - the interesting cases.
    const offeredForTenant = tenantOffers(['mail', 'sn', 'eduPersonEntitlement']);
    const offeredNames = offeredForTenant.map((x) => x.friendly_name);

    const ENTITLEMENT = 'urn:oid:1.3.6.1.4.1.5923.1.1.1.7';
    // Real attributes of the global list that this tenant does not offer.
    const DISPLAYNAME = 'urn:oid:2.16.840.1.113730.3.1.241';
    const GIVENNAME = 'urn:oid:2.5.4.42';

    // One document asking for all of them. Each entry is told apart by its FriendlyName, or its Name
    // where it has none, so the assertions below can be driven off this list.
    const entries = [
      // Offered by the tenant under another federation's label, and alone in this document asking for
      // it: the one case where the rename is what puts a holdable name into the answer.
      { name: MAIL, friendly: 'ema_il', offered: true, renamedTo: 'mail' },
      { name: SN, friendly: 'sn', offered: true },
      { name: ENTITLEMENT, friendly: 'eduPersonEntitlement', offered: true },
      { name: DISPLAYNAME, friendly: 'displayName', offered: false },
      { name: GIVENNAME, friendly: 'givenName', offered: false },
      // Not in the global list at all.
      { name: UNKNOWN, friendly: 'nope', offered: false },
      // unusable by the table: no friendly name to key a row, no name to match
      { nameless: true, friendly: 'orphan', offered: false },
      { name: GIVENNAME, offered: false }
    ];

    // no Name attribute at all, which is not the same as an empty one
    const asXml = (e) => e.nameless
      ? '<md:RequestedAttribute FriendlyName="' + e.friendly + '" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>'
      : requested(e.name, e.friendly, 'true');

    const parsed = parseMetadataDocument(
      askingFor(entries.map(asXml).join('')),
      offeredForTenant
    );

    const supportedNames = () => parsed.supported_attributes.map((a) => a.friendly_name);
    const supportedUris = () => parsed.supported_attributes.map((a) => a.name);
    const unsupportedNames = () => parsed.unsupported_attributes.map((a) => a.friendly_name);

    // (c) Nothing outside the tenant's list: the form's schema rejects such a friendly name, and a
    // rejected selection has no row of its own to unset, so the user could not act on it.
    it('offers nothing whose friendly name the tenant does not have', function () {
      expect(supportedNames()).to.be.an('array');
      supportedNames().forEach((name) => {
        expect(offeredNames, 'supported friendly name ' + name).to.include(name);
      });
      // and named by something, a blank passing the form as an empty selection
      supportedNames().forEach((name) => {
        expect(name).to.be.a('string').and.not.empty;
      });
    });

    // (a) and (b) together, driven off the list above so a new entry is reported, not skipped.
    it('names every unoffered attribute as unsupported, and offers nothing for it', function () {
      const leftOut = entries.filter((e) => !e.offered);
      expect(leftOut.length, 'the mixed document has to actually hold unoffered attributes').to.be.above(2);
      leftOut.forEach((e) => {
        const label = e.friendly || '(no friendly name)';
        if (e.friendly) {
          // (a) told to the user, among the unsupported ones.
          expect(unsupportedNames(), 'unsupported entry for ' + label).to.include(label);
        }
        // (b) and nothing half way: not in the offered list under either label, nor its uri in a row.
        expect(supportedNames(), label + ' must not be offered under any label').to.not.include(label);
        if (e.name) {
          expect(supportedUris(), label + ' must not be offered under its uri either').to.not.include(e.name);
        }
      });
    });

    it('offers every attribute the tenant does offer, under the tenant\'s own label', function () {
      // offering nothing would satisfy (c) too, so what is taken has to be named
      offeredForTenant.forEach((e) => {
        expect(supportedNames(), 'offered ' + e.friendly_name).to.include(e.friendly_name);
      });
      entries.filter((e) => e.renamedTo).forEach((e) => {
        expect(supportedNames()).to.include(e.renamedTo);
        expect(supportedNames()).to.not.include(e.friendly);
      });
    });

    it('places each entry of the document in exactly one of the two lists', function () {
      // The partition, so nothing is named as left out and selected at once. Counted against the
      // document's entries, so an entry falling out of both lists shows as a shortfall.
      expect(supportedNames()).to.have.members(
        ['mail', 'sn', 'eduPersonEntitlement'],
        'the attributes this tenant can select, mail arriving under the tenant\'s label');
      expect(supportedNames().filter((n, i, all) => all.indexOf(n) !== i)).to.deep.equal([],
        'no attribute offered twice, the table keying its rows by friendly name');
      expect(parsed.supported_attributes.length + parsed.unsupported_attributes.length)
        .to.equal(entries.length, 'every entry of the document accounted for once, and only once');
      // three offered against the tenant's three - says its list was read at all
      expect(parsed.supported_attributes).to.have.length(offeredForTenant.length);
      expect(offeredNames.filter((n) => !supportedNames().includes(n))).to.deep.equal([],
        'nothing the tenant offers and the document asks for went unoffered');
    });

    it('holds the same line for a tenant that offers nothing and for one that offers everything', function () {
      // Both ends of the narrowing, each against its own offered list. At the top the property decides
      // nothing, so it is asserted by what is handed over - holding (c) by offering nothing would pass.
      const asks = askingFor(entries.map((e) => e.nameless
        ? '<md:RequestedAttribute FriendlyName="' + e.friendly + '"/>'
        : requested(e.name, e.friendly)).join(''));
      const nothing = parseMetadataDocument(asks, tenantOffers([]));
      expect(nothing.supported_attributes).to.deep.equal([],
        'a tenant that offers nothing has no attribute its form could select');
      expect(nothing.unsupported_attributes).to.have.length(entries.length);

      const everything = tenantOffers(globalList.map((x) => x.friendly_name));
      const allNames = everything.map((x) => x.friendly_name);
      const answer = parseMetadataDocument(asks, everything);
      const names = answer.supported_attributes.map((a) => a.friendly_name);
      // everything the registry knows, the renamed entry merged onto the tenant's label
      expect(names).to.have.members(['mail', 'sn', 'eduPersonEntitlement', 'displayName', 'givenName']);
      names.forEach((n) => expect(allNames).to.include(n));
      // left out at both ends: the same three the table cannot hold
      expect(answer.unsupported_attributes.map((a) => a.friendly_name || '(no friendly name)'))
        .to.have.members(['nope', 'orphan', '(no friendly name)']);
      answer.unsupported_attributes.forEach((a) => {
        if (a.friendly_name) {
          expect(names, a.friendly_name + ' in both lists').to.not.include(a.friendly_name);
        }
      });
    });
  });

  // What the endpoint answers when the document did not arrive. The route itself sits behind
  // authenticate, which needs a database, so this is as far as it can be tested without one.
  describe('says why a request for a document was refused', function () {

    // swagger promises 400 for a non-public address and 404 for an unreadable document
    it('answers 400, and the reason, for an address the guard refused', function () {
      const refusal = new UnsafeUrlError('The metadata url has to point at a publicly reachable host.', 400);
      const answered = refuseMetadataRequest(refusal);
      expect(answered.status).to.equal(400);
      expect(answered.message).to.equal('The metadata url has to point at a publicly reachable host.');
    });

    it('answers the same for a name that resolved to an address it must not reach', function () {
      // the only answer that says "inside the network" rather than "your host is down"
      const refusal = new UnsafeUrlError('The host of the metadata url resolves to an address this server must not reach.', 400);
      const answered = refuseMetadataRequest(refusal);
      expect(answered.status).to.equal(400);
      expect(answered.message).to.contain('must not reach');
    });

    it('answers it through the axios wrapping as well', function () {
      // axios rebuilds what the lookup hands it; this is the shape it really arrives in
      const refusal = new UnsafeUrlError('The host of the metadata url resolves to an address this server must not reach.', 400);
      const asAxiosRebuilt = Object.assign(new Error(refusal.message), {
        isAxiosError: true, code: 'ECONNABORTED', status: undefined, cause: refusal
      });
      const answered = refuseMetadataRequest(asAxiosRebuilt);
      expect(answered.status).to.equal(400);
      expect(answered.message).to.equal(refusal.message);
      // without the check this falls to the catch-all and answers a plain 404
      expect(refuseMetadataRequest(Object.assign(new Error('timeout of 2000ms exceeded'), { code: 'ECONNABORTED' })))
        .to.eql({ status: 404, message: 'The metadata url took too long to answer.' });
    });

    it('says what the endpoint said about a document it could not use', function () {
      const raised = new MetadataInfoError('The metadata describe an identity provider and not a service.', 404);
      expect(refuseMetadataRequest(raised)).to.eql({
        status: 404, message: 'The metadata describe an identity provider and not a service.'
      });
    });

    it('says so when the document was bigger than a document should be', function () {
      const tooLarge = Object.assign(new Error('maxContentLength size of 2097152 exceeded'), { code: 'ERR_BAD_RESPONSE' });
      expect(refuseMetadataRequest(tooLarge).status).to.equal(404);
      expect(refuseMetadataRequest(tooLarge).message).to.contain('more data than a metadata document should hold');
    });

    it('leaves what it cannot explain for the route to log', function () {
      expect(refuseMetadataRequest(new TypeError('x is not a function'))).to.equal(null);
      expect(refuseMetadataRequest(undefined)).to.equal(null);
    });
  });
});
