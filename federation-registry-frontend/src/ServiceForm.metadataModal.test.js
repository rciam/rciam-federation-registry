// The guard in MetadataProposalModal deciding which document a form keeps offering fields for. A
// shown react-bootstrap Modal renders into a portal on document.body, hence the assertions there.
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { MetadataProposalModal } from './ServiceForm.js';

const MAIL = {
  friendly_name: 'mail',
  name: 'urn:oid:0.9.2342.19200300.100.1.3',
  required: true,
  name_format: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri'
};

const METADATA_URL = 'https://sp.example.org/metadata.xml';
const OTHER_URL = 'https://other.example.org/metadata.xml';

const readAnswer = (over) => Object.assign({
  entity_id: 'https://sp.example.org/shibboleth',
  service_name: 'Example service',
  service_description: 'An example service provider',
  supported_attributes: [MAIL],
  unsupported_attributes: [],
  warnings: [],
  metadata_url: METADATA_URL
}, over || {});

const holding = (over) => Object.assign({
  entity_id: '',
  service_name: '',
  service_description: '',
  requested_attributes: [],
  protocol: 'saml',
  metadata_url: METADATA_URL
}, over || {});

let containers = [];

function render(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  act(() => {
    ReactDOM.render(<MetadataProposalModal {...props} />, container);
  });
  const titles = [...document.querySelectorAll('.modal-title')].map((node) => node.textContent);
  return {
    titles: titles,
    text: document.body.textContent,
    // Either question the modal can ask: fields to fill, or fields held differently.
    asks: titles.length > 0
  };
}

afterEach(() => {
  containers.forEach((container) => {
    act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
    container.remove();
  });
  containers = [];
  document.body.innerHTML = '';
});

describe('# MetadataProposalModal', () => {

  const offered = (over) => Object.assign({
    metadata: readAnswer(),
    values: holding(),
    disabled: false,
    attributesEnabled: true,
    url: METADATA_URL,
    dismissed: null,
    setValues: jest.fn(),
    onDismiss: jest.fn()
  }, over || {});

  it('asks about the document the adopted url names, that url being the one the form holds', () => {
    const answer = render(offered());
    expect(answer.asks).toBe(true);
    expect(answer.text).toContain('values the form does not hold yet');
    // The question is about this document rather than about whatever was read before it.
    expect(answer.text).toContain('Example service');
  });

  it('mounts nothing for a form that has adopted no document', () => {
    // A form naming an address it never took anything from asks nothing.
    const answer = render(offered({ url: null }));
    expect(answer.asks).toBe(false);
    expect(answer.titles).toEqual([]);
  });

  it('mounts nothing once the form names another url than the adopted one', () => {
    // The url typed over: the document read for the previous address is still held, but no longer
    // offered. This is what keeps one service's document from filling another service's form.
    const answer = render(offered({ values: holding({ metadata_url: OTHER_URL }) }));
    expect(answer.asks).toBe(false);
    expect(answer.titles).toEqual([]);
  });

  it('mounts nothing for a url the user turned down', () => {
    const answer = render(offered({ dismissed: METADATA_URL }));
    expect(answer.asks).toBe(false);
    expect(answer.titles).toEqual([]);
  });

  it('asks again for a document turned down only as another one', () => {
    // Dismissal is keyed by url, so turning one document down says nothing about a different one.
    const answer = render(offered({ dismissed: OTHER_URL }));
    expect(answer.asks).toBe(true);
  });

  it('mounts nothing while the form is disabled', () => {
    // A submitted or read only form writes nothing, so asking would offer an answer it cannot take.
    const answer = render(offered({ disabled: true }));
    expect(answer.asks).toBe(false);
  });

  it('mounts nothing for a document with nothing left to offer, the guard having passed', () => {
    // All four conditions hold, so it is the empty proposal that answers: the form holds what the
    // document says.
    const answer = render(offered({
      values: holding({
        entity_id: 'https://sp.example.org/shibboleth',
        service_name: 'Example service',
        service_description: 'An example service provider',
        requested_attributes: [MAIL]
      })
    }));
    expect(answer.asks).toBe(false);
    expect(answer.titles).toEqual([]);
  });

  it('writes every offered field in one go when the question is answered yes', () => {
    const setValues = jest.fn();
    render(offered({ setValues: setValues }));
    const yes = [...document.querySelectorAll('button')].find((node) => node.textContent === 'Yes');
    expect(yes).toBeTruthy();
    act(() => {
      yes.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(setValues).toHaveBeenCalledTimes(1);
    const written = setValues.mock.calls[0][0];
    expect(written.service_name).toEqual('Example service');
    expect(written.entity_id).toEqual('https://sp.example.org/shibboleth');
    expect(written.metadata_url).toEqual(METADATA_URL);
  });

});
