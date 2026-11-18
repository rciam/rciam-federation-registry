'use-strict';
var chai = require('chai');
var expect = chai.expect;
const {
  assertSafeFetchUrl, isPrivateHost, publicAddress, createSafeLookup, addressRefusal, UnsafeUrlError
} = require('../functions/url_guard.js');

// The metadata endpoint fetches an address chosen by the caller, so these cases are what stands
// between that endpoint and the internal network the registry runs on.
describe('# Url guard', function () {

  // Neither a name server nor a database is reached: wherever a case cares about what a name resolves
  // to, the resolver is stubbed. The answers are the ones nip.io and sslip.io really hand out.
  const dns = require('dns').promises;
  const realLookup = dns.lookup;
  afterEach(function () {
    dns.lookup = realLookup;
  });
  // answers: one list for every name, or an object of name -> list. An unknown name answers nothing,
  // as an unresolvable name does.
  function stubResolver(answers) {
    const calls = [];
    dns.lookup = function (host, options) {
      calls.push({ host: host, all: !!(options && options.all) });
      const found = Array.isArray(answers) ? answers : answers[host];
      if (!found) {
        return Promise.reject(Object.assign(new Error('queryA ENOTFOUND ' + host), { code: 'ENOTFOUND' }));
      }
      return Promise.resolve(found.map((address) => ({ address: address, family: address.indexOf(':') === -1 ? 4 : 6 })));
    };
    return calls;
  }

  describe('refuses addresses that are not publicly reachable', function () {
    const refused = [
      'http://127.0.0.1/metadata.xml',
      'http://127.0.0.1:8443/metadata.xml',
      'http://10.0.0.5/metadata.xml',
      'http://172.16.9.9/metadata.xml',
      'http://172.31.255.255/metadata.xml',
      'http://192.168.1.1/metadata.xml',
      'http://169.254.169.254/latest/meta-data/',
      'http://169.254.1.1/metadata.xml',
      'http://0.0.0.0/metadata.xml',
      'http://100.64.0.1/metadata.xml',
      'http://224.0.0.1/metadata.xml',
      'http://240.0.0.1/metadata.xml',
      'http://255.255.255.255/metadata.xml',
      'http://192.0.2.1/metadata.xml',
      'http://198.51.100.1/metadata.xml',
      'http://203.0.113.1/metadata.xml',
      // spellings for 127.0.0.1 that the url parser reduces to the dotted form
      'http://0177.0.0.1/metadata.xml',
      'http://2130706433/metadata.xml',
      'http://0x7f000001/metadata.xml',
      'http://127.1/metadata.xml',
      'http://127.0.0.1./metadata.xml',
      // names that resolve locally
      'http://localhost/metadata.xml',
      'http://LOCALHOST:6379/metadata.xml',
      'http://localhost.:8080/metadata.xml',
      'http://registry.local/metadata.xml',
      'http://registry.local./metadata.xml',
      'http://api.internal/metadata.xml',
      // ipv6 loopback, unspecified, and the transition mechanisms that hide an ipv4 address
      'http://[::1]/metadata.xml',
      'http://[0:0:0:0:0:0:0:1]/metadata.xml',
      'http://[::]/metadata.xml',
      'http://[::ffff:127.0.0.1]/metadata.xml',
      'http://[::ffff:7f00:1]/metadata.xml',
      'http://[::127.0.0.1]/metadata.xml',
      'http://[64:ff9b::127.0.0.1]/metadata.xml',
      'http://[2002:7f00:1::]/metadata.xml',
      'http://[2001:0000:4136:e378:8000:63bf:3fff:fdd2]/metadata.xml',
      'http://[fe80::1]/metadata.xml',
      'http://[fc00::1]/metadata.xml',
      'http://[fd12:3456::1]/metadata.xml',
      'http://[ff02::1]/metadata.xml',
      'http://[2001:db8::1]/metadata.xml',
      'http://[::ffff:169.254.169.254]/metadata.xml',
      // other schemes and malformed input
      'file:///etc/passwd',
      'gopher://127.0.0.1:11211/_stats',
      'ftp://127.0.0.1/metadata.xml',
      'data:text/xml,<EntityDescriptor/>',
      '//127.0.0.1/metadata.xml',
      '/metadata.xml',
      'metadata.xml',
      '127.0.0.1',
      'http://',
      'http://[',
      'not a url',
      '',
      // credentials would make a naive reader see the wrong host
      'http://1.1.1.1@internal.invalid/metadata.xml',
      // punycoded digits, which the url parser turns back into 127.0.0.1
      'http://①②⑦.0.0.1/metadata.xml'
    ];
    refused.forEach(function (url) {
      it('refuses ' + url, function () {
        expect(function () { assertSafeFetchUrl(url); }).to.throw(UnsafeUrlError);
      });
    });
  });

  describe('accepts publicly reachable urls', function () {
    const accepted = [
      'https://idp.example.org/metadata.xml',
      'https://idp.example.org:8443/saml/metadata',
      'http://metadata.federation.example.cz/md.xml',
      'https://8.8.8.8/metadata.xml',
      'https://[2606:4700:4700::1111]/metadata.xml',
      'https://[2002:0808:0808::]/metadata.xml',
      'http://172.32.0.1/metadata.xml',
      'http://100.128.0.1/metadata.xml',
      'http://11.0.0.1/metadata.xml',
      'http://localhost.example.com/metadata.xml',
      'http://www.example.com/a?b=c#d'
    ];
    accepted.forEach(function (url) {
      it('accepts ' + url, function () {
        expect(function () { assertSafeFetchUrl(url); }).to.not.throw();
      });
    });

    it('returns the parsed url', function () {
      expect(assertSafeFetchUrl('HTTPS://Idp.Example.Org/md.xml').hostname).to.equal('idp.example.org');
    });
  });

  describe('checks the parts of a url that matter', function () {
    it('only allows http and https', function () {
      expect(function () { assertSafeFetchUrl('ftp://8.8.8.8/md'); }).to.throw(UnsafeUrlError);
    });
    it('rejects credentials in the url', function () {
      expect(function () { assertSafeFetchUrl('https://user:pass@idp.example.org/md'); }).to.throw(UnsafeUrlError);
    });
    it('rejects a url with no scheme rather than reading it as a path', function () {
      expect(function () { assertSafeFetchUrl('idp.example.org/md'); }).to.throw(UnsafeUrlError);
    });
    it('reports a status for the caller to answer with', function () {
      try {
        assertSafeFetchUrl('http://127.0.0.1/md');
        expect.fail('expected the address to be refused');
      }
      catch (err) {
        expect(err.status).to.equal(400);
      }
    });
  });

  describe('isPrivateHost', function () {
    it('treats anything it cannot make sense of as not fetchable', function () {
      [undefined, null, '', ['a'], {}, NaN].forEach(function (value) {
        expect(isPrivateHost(value), JSON.stringify(value)).to.equal(true);
      });
    });
    it('normalises the bracket and trailing dot forms', function () {
      expect(isPrivateHost('[::1]')).to.equal(true);
      expect(isPrivateHost('::1')).to.equal(true);
      expect(isPrivateHost('127.0.0.1.')).to.equal(true);
      expect(isPrivateHost('LOCALHOST')).to.equal(true);
      expect(isPrivateHost('localhost.')).to.equal(true);
      expect(isPrivateHost('registry.local.')).to.equal(true);
      expect(isPrivateHost('a.LOCAL')).to.equal(true);
    });
    it('names of the public internet are the resolver’s business, not this function’s', function () {
      // what a name stands for is decided at connect time, below; here only the name is judged.
      expect(isPrivateHost('idp.example.org')).to.equal(false);
    });
  });

  describe('localhost under its other names, and names of the local network', function () {
    // All resolve locally, and none is caught by a test for "localhost" as the last label -
    // ip6-localhost and ip6-loopback are the node image's /etc/hosts names for ::1, and
    // localhost.localdomain has the word as its first label.
    const refused = [
      'ip6-localhost', 'ip6-loopback', 'localhost4', 'localhost6', 'localhost.localdomain',
      'IP6-LOCALHOST', 'localhost.local.'
    ];
    refused.forEach(function (host) {
      it('refuses ' + host + ', which is loopback', function () {
        expect(isPrivateHost(host)).to.equal(true);
      });
    });
    // A single label is whatever the search list says: on the compose network "database" is postgres.
    ['database', 'redis', 'metadata', 'node', 'local', 'internal', 'home', 'lan'].forEach(function (host) {
      it('refuses the single label ' + host, function () {
        expect(isPrivateHost(host)).to.equal(true);
      });
    });
    // glibc rejects an empty label, a resolver trimming them would read nip.io as an address; neither
    // form is passed on to find out.
    ['127.0.0.1..', 'localhost..', '...', '.example.com', 'a..b', '10..0.1'].forEach(function (host) {
      it('refuses the host with an empty label: ' + host, function () {
        expect(isPrivateHost(host)).to.equal(true);
      });
    });
    it('still asks the resolver about a name that has a public shape', function () {
      expect(isPrivateHost('metadata.example.org')).to.equal(false);
      // A name merely beginning with a keyword is a name of the public internet.
      expect(isPrivateHost('localhost.example.com')).to.equal(false);
    });
  });

  describe('ipv6 ranges that are not publicly routed', function () {
    [
      'http://[fec0::1]/metadata.xml',        // site-local, deprecated but still routed inside a site
      'http://[64:ff9b:1::5]/metadata.xml',   // site local NAT64, not the global 64:ff9b::/96
      'http://[2001:10::5]/metadata.xml',     // IETF reserved
      'http://[2001:2f::1]/metadata.xml',
      'http://[2001:20::5]/metadata.xml',     // ORCHIDv2
      'http://[2001:2f::5]/metadata.xml',
      'http://[3ffe::5]/metadata.xml'         // the retired 6bone range
    ].forEach(function (url) {
      it('refuses ' + url, function () {
        expect(function () { assertSafeFetchUrl(url); }).to.throw(UnsafeUrlError);
      });
    });
    it('still counts a global NAT64 address public through the address it carries', function () {
      // 64:ff9b::/96 is globally reachable; only the private address behind it is a reason to refuse.
      expect(function () { assertSafeFetchUrl('http://[64:ff9b::8.8.8.8]/md'); }).to.not.throw();
      expect(function () { assertSafeFetchUrl('http://[64:ff9b::127.0.0.1]/md'); }).to.throw(UnsafeUrlError);
    });
    it('still counts the addresses just outside those ranges public', function () {
      // One address either side of each refused range, so the arithmetic is pinned and not just the names.
      expect(function () { assertSafeFetchUrl('http://[2001:1::1]/md'); }).to.not.throw();
      expect(function () { assertSafeFetchUrl('http://[2001:30::1]/md'); }).to.not.throw();
      expect(function () { assertSafeFetchUrl('http://[fe7f::1]/md'); }).to.not.throw();
      expect(function () { assertSafeFetchUrl('http://[3fff::1]/md'); }).to.not.throw();
      expect(function () { assertSafeFetchUrl('http://[64:ff9b:2::5]/md'); }).to.not.throw();
    });
    it('refuses the whole of the site local and link local halves of fe80::/9', function () {
      ['fe80::1', 'febf::1', 'fec0::1', 'feff::1'].forEach(function (address) {
        expect(isPrivateHost(address), address).to.equal(true);
      });
    });
  });

  // About the address behind the name, which is what the socket connects to.
  describe('the address a name resolves to', function () {

    it('refuses a name that resolves to loopback, and to anything else not public', async function () {
      const cases = {
        'sp.example.org': ['127.0.0.1'],
        'one.example.org': ['10.0.0.5'],
        'll.example.org': ['169.254.169.254'],
        'v6.example.org': ['::1'],
        'mapped.example.org': ['::ffff:127.0.0.1'],
        'ula.example.org': ['fd12:3456::1']
      };
      for (const name of Object.keys(cases)) {
        stubResolver(cases);
        let refused = null;
        try {
          await publicAddress(name);
        }
        catch (err) {
          refused = err;
        }
        expect(refused, name + ' -> ' + cases[name]).to.be.instanceOf(UnsafeUrlError);
        expect(refused.status, name).to.equal(400);
      }
    });

    it('refuses a name that resolves to a private address as well as a public one', async function () {
      // the resolver may hand out either answer; the private one must win.
      const calls = stubResolver({ 'both.example.org': ['93.184.216.34', '10.0.0.5'] });
      let refused = null;
      try {
        await publicAddress('both.example.org');
      }
      catch (err) {
        refused = err;
      }
      expect(refused).to.be.instanceOf(UnsafeUrlError);
      expect(refused.message).to.contain('an address this server must not reach');
      // asked the way the socket asks, /etc/hosts and search list included.
      expect(calls[0].all).to.equal(true);
    });

    it('answers the public address of a name that has only public ones', async function () {
      stubResolver({ 'sp.example.org': ['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'] });
      const vetted = await publicAddress('sp.example.org');
      expect(vetted.address).to.equal('93.184.216.34');
      expect(vetted.family).to.equal(4);
    });

    it('says so when a name resolves to nothing', async function () {
      stubResolver({});
      let refused = null;
      try {
        await publicAddress('nowhere.example.org');
      }
      catch (err) {
        refused = err;
      }
      expect(refused).to.be.instanceOf(UnsafeUrlError);
      // not a refusal: an unreachable name is 404, like a host that does not answer.
      expect(refused.status).to.equal(404);
    });

    it('does not ask a name server about a name it can already refuse', async function () {
      const calls = stubResolver([]);
      for (const host of ['ip6-localhost', 'localhost.localdomain', 'database', 'registry.internal', 'a..b']) {
        let refused = null;
        try {
          await publicAddress(host);
        }
        catch (err) {
          refused = err;
        }
        expect(refused, host).to.be.instanceOf(UnsafeUrlError);
      }
      expect(calls).to.eql([], 'a name that is refused outright should not be looked up');
    });

    it('answers an address written out without resolving it', async function () {
      const calls = stubResolver([]);
      expect(await publicAddress('8.8.8.8')).to.eql({ address: '8.8.8.8', family: 4 });
      expect(await publicAddress('[2606:4700:4700::1111]')).to.eql({ address: '2606:4700:4700::1111', family: 6 });
      expect(calls).to.eql([]);
    });

    // nip.io and sslip.io answer <address>.nip.io with that address, so pointing inside the network
    // costs an attacker nothing but a string in the form.
    describe('a wildcard name naming an internal address', function () {
      const wildcard = {
        '127.0.0.1.nip.io': ['127.0.0.1'],
        '127-0-0-1.nip.io': ['127.0.0.1'],
        '127.0.0.1.sslip.io': ['127.0.0.1'],
        '169-254-169-254.nip.io': ['169.254.169.254'],
        '10-0-0-7.nip.io': ['10.0.0.7'],
        '0--1.sslip.io': ['::1']
      };

      it('is a name of the public shape, so the name alone cannot refuse it', function () {
        Object.keys(wildcard).forEach(function (host) {
          expect(isPrivateHost(host), host).to.equal(false);
        });
      });

      it('is refused once the address it names is looked up', async function () {
        stubResolver(wildcard);
        for (const host of Object.keys(wildcard)) {
          let refused = null;
          try {
            await publicAddress(host);
          }
          catch (err) {
            refused = err;
          }
          expect(refused, host + ' -> ' + wildcard[host]).to.be.instanceOf(UnsafeUrlError);
          expect(refused.status, host).to.equal(400);
        }
      });

      it('is refused for the url a caller would actually send, end to end', function () {
        // what the route does with the url in the request; the literal checks pass, so resolution
        // has to stop it.
        stubResolver(wildcard);
        const requests = [
          'http://127.0.0.1.nip.io:8080/metadata.xml',
          'http://169-254-169-254.nip.io/latest/meta-data/',
          'https://10-0-0-7.nip.io/metadata.xml'
        ];
        return requests.reduce(function (chain, url) {
          return chain.then(async function () {
            assertSafeFetchUrl(url); // what the route does first, and what does not refuse it
            let refused = null;
            try {
              await publicAddress(new URL(url).hostname);
            }
            catch (err) {
              refused = err;
            }
            expect(refused, url).to.be.instanceOf(UnsafeUrlError);
          });
        }, Promise.resolve());
      });

      it('is refused as the target of a redirect as well', async function () {
        // what the route does with a Location: a hop reached by following a public host is judged
        // exactly as the url in the request was.
        stubResolver(Object.assign({ 'sp.example.org': ['93.184.216.34'] }, wildcard));
        const hops = [
          ['https://sp.example.org/metadata.xml', 'http://127.0.0.1.nip.io/metadata.xml'],
          ['https://sp.example.org/metadata.xml', 'http://10-0-0-7.nip.io/internal'],
          // a relative Location keeps the host that sent it, so it cannot escape by redirecting
          ['http://127-0-0-1.nip.io/a/', '/b?x=1']
        ];
        for (const [from, location] of hops) {
          assertSafeFetchUrl(from); // the shape checks pass on the hop the caller started from
          const next = new URL(location, from).toString();
          assertSafeFetchUrl(next); // and on the target
          let refused = null;
          try {
            await publicAddress(new URL(next).hostname);
          }
          catch (err) {
            refused = err;
          }
          expect(refused, from + ' -> ' + next).to.be.instanceOf(UnsafeUrlError);
          expect(refused.status, from + ' -> ' + next).to.equal(400);
        }
      });
    });
  });

  describe('what the route makes of a refusal', function () {
    // axios rebuilds the error the lookup hands it, class and all; what the route still recognises.
    it('hands the refusal out in a form the caller can classify', async function () {
      stubResolver({ '127.0.0.1.nip.io': ['127.0.0.1'] });
      const lookup = createSafeLookup();
      const arrived = await new Promise(function (resolve) {
        lookup('127.0.0.1.nip.io', { all: true }, function (err) { resolve(err); });
      });
      expect(arrived).to.be.instanceOf(UnsafeUrlError);
      expect(arrived.code).to.equal('ERR_UNSAFE_ADDRESS');
      expect(arrived.status).to.equal(400);
      expect(addressRefusal(arrived)).to.equal(arrived);
    });

    it('survives the way axios rebuilds what a lookup hands it', function () {
      // the code travels, the class does not
      const refusal = new UnsafeUrlError('The host of the metadata url resolves to an address this server must not reach.', 400);
      const asAxiosRebuilt = Object.assign(new Error(refusal.message), {
        isAxiosError: true, code: 'ECONNABORTED', cause: refusal
      });
      const found = addressRefusal(asAxiosRebuilt);
      expect(found).to.equal(refusal);
      expect(found.status).to.equal(400);
    });

    it('is not confused with a host that simply did not answer', function () {
      expect(addressRefusal(Object.assign(new Error('timeout of 2000ms exceeded'), { code: 'ECONNABORTED' }))).to.equal(null);
      expect(addressRefusal(Object.assign(new Error('queryA ENOTFOUND'), { code: 'ENOTFOUND' }))).to.equal(null);
      expect(addressRefusal(undefined)).to.equal(null);
    });

    it('answers the socket with the address that was vetted, in the shape it asked for', async function () {
      stubResolver({ 'sp.example.org': ['93.184.216.34'] });
      const lookup = createSafeLookup();
      const one = await new Promise(function (resolve) {
        lookup('sp.example.org', { hints: 0 }, function (err, address, family) { resolve({ err: err, address: address, family: family }); });
      });
      expect(one.err).to.equal(null);
      expect(one.address).to.equal('93.184.216.34');
      expect(one.family).to.equal(4);
      const all = await new Promise(function (resolve) {
        lookup('sp.example.org', { all: true }, function (err, addresses) { resolve({ err: err, addresses: addresses }); });
      });
      expect(all.err).to.equal(null);
      expect(all.addresses).to.eql([{ address: '93.184.216.34', family: 4 }]);
    });

    it('hands the socket an error rather than an address it did not vet', async function () {
      stubResolver({ '10-0-0-7.nip.io': ['10.0.0.7'] });
      const lookup = createSafeLookup();
      const outcomes = [];
      for (const options of [{ all: true }, { hints: 0 }]) {
        outcomes.push(await new Promise(function (resolve) {
          lookup('10-0-0-7.nip.io', options, function (err, first, second) {
            resolve({ err: err, first: first, second: second });
          });
        }));
      }
      outcomes.forEach(function (outcome) {
        expect(outcome.err).to.be.instanceOf(UnsafeUrlError);
        // nothing that reads as an address went back alongside it
        expect(outcome.first).to.equal(undefined);
        expect(outcome.second).to.equal(undefined);
      });
    });
  });
});
