const { metadataProposal, metadataWarnings, applyProposal, createReadings, urlReachabilityEnabled } = require('./helpers.js');

// Which fields of the form a metadata document is offered for; metadataProposal answers, it writes
// nothing.

const MAIL = {
  friendly_name: 'mail',
  name: 'urn:oid:0.9.2342.19200300.100.1.3',
  required: true,
  name_format: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri'
};
const SN = {
  friendly_name: 'sn',
  name: 'urn:oid:2.5.4.4',
  required: false,
  name_format: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri'
};

// The answer of the metadata_info endpoint for a document that says something about every field.
const document = (over) => Object.assign({
  entity_id: 'https://sp.example.org/shibboleth',
  service_name: 'Example service',
  service_description: 'An example service provider',
  supported_attributes: [MAIL],
  unsupported_attributes: [],
  warnings: [],
  metadata_url: 'https://sp.example.org/metadata.xml'
}, over || {});

// A form that has only been opened.
const blank = { entity_id: '', service_name: '', service_description: '', requested_attributes: [] };
const holding = (over) => Object.assign({}, blank, over);
const withTable = { attributesEnabled: true };
const names = (fields) => fields.map((entry) => entry.field);

describe('# metadataProposal', () => {

  it('offers every field a document speaks about to a form that holds nothing', () => {
    expect(names(metadataProposal(document(), blank, withTable).fill))
      .toEqual(['entity_id', 'requested_attributes', 'service_name', 'service_description']);
  });

  it('leaves a field the form already holds out of what it offers to fill', () => {
    const proposal = metadataProposal(document(), holding({ service_name: 'My own name' }), withTable);
    expect(names(proposal.fill)).toEqual(['entity_id', 'requested_attributes', 'service_description']);
    expect(names(proposal.replace)).toEqual(['service_name']);
  });

  it('reports what the document states differently, with both values, for the question', () => {
    const replace = metadataProposal(document(), holding({ entity_id: 'https://testing.example.org/shibboleth' }), withTable).replace;
    expect(replace).toHaveLength(1);
    expect(replace[0].held).toEqual('https://testing.example.org/shibboleth');
    expect(replace[0].value).toEqual('https://sp.example.org/shibboleth');
  });

  it('says nothing about a field it has nothing for', () => {
    const quiet = document({ entity_id: undefined, service_name: '', service_description: '   ', supported_attributes: [] });
    const proposal = metadataProposal(quiet, blank, withTable);
    expect(proposal.fill).toEqual([]);
    expect(proposal.replace).toEqual([]);
  });

  it('counts a field holding only spaces as empty', () => {
    expect(names(metadataProposal(document(), holding({ entity_id: '   ' }), withTable).fill)).toContain('entity_id');
  });

  it('offers no attribute list to a tenant that hides the attribute table', () => {
    const hidden = { attributesEnabled: false };
    expect(names(metadataProposal(document(), blank, hidden).fill)).not.toContain('requested_attributes');
    // Nor does it report a difference in a field that form has no place for.
    expect(names(metadataProposal(document(), holding({ requested_attributes: [SN] }), hidden).replace))
      .not.toContain('requested_attributes');
  });

  it('offers nothing when the form already holds exactly what the document says', () => {
    const agreed = holding({
      entity_id: 'https://sp.example.org/shibboleth',
      service_name: 'Example service',
      service_description: 'An example service provider',
      requested_attributes: [MAIL]
    });
    const proposal = metadataProposal(document(), agreed, withTable);
    expect(proposal.fill).toEqual([]);
    expect(proposal.replace).toEqual([]);
  });

  it('does not report an attribute list as different because of its order', () => {
    const document2 = document({ supported_attributes: [MAIL, SN] });
    const proposal = metadataProposal(document2, holding({ requested_attributes: [SN, MAIL] }), withTable);
    expect(proposal.replace).toEqual([]);
  });

  it('reports an attribute list that holds something else', () => {
    const proposal = metadataProposal(document(), holding({ requested_attributes: [SN] }), withTable);
    expect(names(proposal.replace)).toEqual(['requested_attributes']);
  });

  it('does not treat a repeated attribute as the same list', () => {
    // Both hold two entries and the same two names, so only the counts tell them apart.
    const document2 = document({ supported_attributes: [MAIL, MAIL, SN] });
    const proposal = metadataProposal(document2, holding({ requested_attributes: [MAIL, SN, SN] }), withTable);
    expect(names(proposal.replace)).toEqual(['requested_attributes']);
  });

  it('carries the value the form should be given', () => {
    const fill = metadataProposal(document(), blank, withTable).fill;
    expect(fill.find((entry) => entry.field === 'requested_attributes').value).toEqual([MAIL]);
    expect(fill.find((entry) => entry.field === 'service_name').value).toEqual('Example service');
  });

  it('never offers a field to fill and to replace at once', () => {
    [blank, holding({ service_name: 'Mine' }), holding({ entity_id: 'https://other.example.org/eid', requested_attributes: [SN, MAIL] })]
      .forEach((values) => {
        const proposal = metadataProposal(document(), values, withTable);
        const both = names(proposal.fill).filter((field) => names(proposal.replace).includes(field));
        expect(both).toEqual([]);
      });
  });

  it('answers empty rather than throwing on a form or a document with nothing in it', () => {
    expect(metadataProposal({}, {}, {}).fill).toEqual([]);
    expect(metadataProposal({}, {}, withTable).fill).toEqual([]);
  });
});

describe('# metadataWarnings', () => {

  const warnings = [
    { code: 'no_attributes', text: 'no attributes' },
    { code: 'unsupported_attributes', text: 'left out' },
    { code: 'no_entity_id', text: 'no entity id' },
    { code: 'nothing_found', text: 'nothing' }
  ];

  it('keeps every warning for a tenant that shows the attribute table', () => {
    expect(metadataWarnings(warnings, true)).toEqual(warnings);
  });

  it('drops the warnings about attributes when the table is hidden', () => {
    expect(metadataWarnings(warnings, false).map((w) => w.code)).toEqual(['no_entity_id', 'nothing_found']);
  });

  it('answers an empty list rather than throwing when there were no warnings', () => {
    expect(metadataWarnings(undefined, true)).toEqual([]);
    expect(metadataWarnings([], false)).toEqual([]);
  });
});


describe('# applyProposal', () => {

  // Accepting has to be one write, not one per field: formik 2.2 validates from the setters, each
  // validation seeing the pre-write values and reporting the other fields as empty.

  it('writes every accepted field, leaving the rest of the form alone', () => {
    const held = holding({ scope: 'openid', metadata_url: 'https://sp.example.org/metadata.xml' });
    const entries = metadataProposal(document(), held, withTable).fill;
    const next = applyProposal(held, entries);
    expect(next.entity_id).toBe('https://sp.example.org/shibboleth');
    expect(next.service_name).toBe('Example service');
    expect(next.service_description).toBe('An example service provider');
    expect(next.requested_attributes).toEqual([MAIL]);
    expect(next.scope).toBe('openid');
    expect(next.metadata_url).toBe('https://sp.example.org/metadata.xml');
  });

  it('answers one object for one entry, so that one validation covers what was written', () => {
    const entries = [{ field: 'entity_id', value: 'https://sp.example.org/shibboleth' }];
    const next = applyProposal(blank, entries);
    expect(Object.keys(next).sort()).toEqual(
      ['entity_id', 'requested_attributes', 'service_description', 'service_name'].sort());
  });

  it('leaves the form it is given untouched', () => {
    const held = holding({ entity_id: 'kept' });
    applyProposal(held, [{ field: 'entity_id', value: 'replaced' }]);
    expect(held.entity_id).toBe('kept');
  });

  it('replaces rather than adds when the same field is named twice', () => {
    const next = applyProposal(blank, [
      { field: 'service_name', value: 'first' }, { field: 'service_name', value: 'second' }]);
    expect(next.service_name).toBe('second');
  });

  it('hands the attribute table entries of its own, since that table edits them in place', () => {
    const found = document();
    const next = applyProposal(blank, [{ field: 'requested_attributes', value: found.supported_attributes }]);
    // What SamlAttributesInput does when the user toggles Required.
    next.requested_attributes[0].required = false;
    next.requested_attributes[0].name = 'edited';
    expect(found.supported_attributes[0].required).toBe(true);
    expect(found.supported_attributes[0].name).toBe(MAIL.name);
  });

  it('answers an empty form when nothing was accepted', () => {
    expect(applyProposal(blank, [])).toEqual(blank);
    expect(applyProposal(undefined, undefined)).toEqual({});
  });
});

describe('# createReadings', () => {

  // Readings go out on a debounce as the url is typed and can answer out of order; a fetch already on
  // the wire is out of reach, so what lands has to be recognised as stale. Same shape as the form:
  // start, answer, write only while current.

  const reading = () => createReadings();

  // Stands in for getMetadata's fetch callback.
  const answer = (readings, token, writes, what) => {
    if (!readings.isCurrent(token)) {
      return false;
    }
    writes.push(what);
    return true;
  };

  it('lets the only reading answer', () => {
    const readings = reading();
    const writes = [];
    expect(answer(readings, readings.start(), writes, 'first')).toBe(true);
    expect(writes).toEqual(['first']);
  });

  it('refuses a superseded reading that answers last', () => {
    const readings = reading();
    const writes = [];
    const slow = readings.start();     // the url typed first, slow host
    const quick = readings.start();    // typed over it, fast host
    expect(answer(readings, quick, writes, 'second')).toBe(true);
    expect(answer(readings, slow, writes, 'first')).toBe(false);
    // The wrong document never reaches the form.
    expect(writes).toEqual(['second']);
  });

  it('refuses every reading but the newest', () => {
    const readings = reading();
    const tokens = [readings.start(), readings.start(), readings.start(), readings.start()];
    expect(readings.isCurrent(tokens[3])).toBe(true);
    tokens.slice(0, 3).forEach((token) => expect(readings.isCurrent(token)).toBe(false));
  });

  it('counts readings of different forms apart', () => {
    // Each form holds its own, so a slow answer on one form is not silenced by typing on another.
    const one = reading();
    const two = reading();
    const token = one.start();
    two.start();
    expect(one.isCurrent(token)).toBe(true);
  });

  it('does not let a number alone decide, only the one this form issued last', () => {
    const readings = reading();
    expect(readings.isCurrent(undefined)).toBe(false);
    expect(readings.isCurrent(null)).toBe(false);
    const token = readings.start();
    expect(readings.isCurrent(token - 1)).toBe(false);
    expect(readings.isCurrent(token)).toBe(true);
  });
});

describe('# urlReachabilityEnabled', () => {

  // Opt in: with a Content-Security-Policy restricting connect-src the check cannot but fail.

  it('is off for a configuration that says nothing', () => {
    expect(urlReachabilityEnabled({})).toBe(false);
  });

  it('is off for the configuration the interface ships with', () => {
    // read from the shipped file, since a fresh build is what was reported
    expect(urlReachabilityEnabled(require('./config.json'))).toBe(false);
  });

  it('is on only when the deployment asks for it', () => {
    expect(urlReachabilityEnabled({ check_url_reachability: true })).toBe(true);
  });

  it('is off when the deployment turns it off', () => {
    expect(urlReachabilityEnabled({ check_url_reachability: false })).toBe(false);
    // Anything but true is off, so a configuration that names something odd does not fetch either.
    expect(urlReachabilityEnabled({ check_url_reachability: 'yes' })).toBe(false);
    expect(urlReachabilityEnabled({ check_url_reachability: undefined })).toBe(false);
  });
});
