// Guards for urls the api fetches on behalf of a user: a request parameter aimed at the server's
// own network is a server side request forgery primitive.
//
// A name cannot be trusted by its spelling - nip.io and sslip.io hand out "127.0.0.1.nip.io" to
// anyone - so every hop is checked as a url (assertSafeFetchUrl) and again as the address it
// resolves to (createSafeLookup). Pinning the resolved address is not optional: axios resolves
// once more when it connects, and that second answer is the one the socket would reach.

const dns = require('dns').promises;
const net = require('net');

const refusedAddressCode = 'ERR_UNSAFE_ADDRESS';

class UnsafeUrlError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'UnsafeUrlError';
    this.code = refusedAddressCode;
    this.status = status || 400;
  }
}

// Everything outside these ranges counts as public.
const privateIpv4 = [
  ['0.0.0.0/8', 0x00000000, 8],   // this network
  ['10.0.0.0/8', 0x0a000000, 8],  // private
  ['100.64.0.0/10', 0x64400000, 10], // carrier grade nat
  ['127.0.0.0/8', 0x7f000000, 8], // loopback
  ['169.254.0.0/16', 0xa9fe0000, 16], // link local, holds 169.254.169.254
  ['172.16.0.0/12', 0xac100000, 12], // private
  ['192.0.0.0/24', 0xc0000000, 24],  // ietf protocol assignments
  ['192.0.2.0/24', 0xc0000200, 24],  // documentation
  ['192.88.99.0/24', 0xc0586300, 24], // legacy 6to4 relay
  ['192.168.0.0/16', 0xc0a80000, 16], // private
  ['198.18.0.0/15', 0xc6120000, 15],  // benchmarking
  ['198.51.100.0/24', 0xc6336400, 24], // documentation
  ['203.0.113.0/24', 0xcb007100, 24],  // documentation
  ['224.0.0.0/4', 0xe0000000, 4],      // multicast
  ['240.0.0.0/4', 0xf0000000, 4]       // reserved, incl. 255.255.255.255
];

function to32(groups) {
  return groups.reduce((value, group) => value * 65536 + group, 0) >>> 0;
}

function parseIpv4(host) {
  const parts = host.split('.');
  if (parts.length !== 4) {
    return null;
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    value = value * 256 + Number(part);
  }
  return value;
}

function isPrivateIpv4(value) {
  if (value === null) {
    return true;
  }
  return privateIpv4.some(([, base, bits]) => {
    const mask = bits === 32 ? 0xffffffff : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (base & mask);
  });
}

// Expands to the eight 16 bit groups, so that the IPv4 address carried by the transition
// mechanisms can be read off. Null when unparsable.
function parseIpv6(host) {
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  const zone = host.indexOf('%');
  if (zone !== -1) {
    host = host.slice(0, zone);
  }
  // A trailing dotted quad stands for the last two groups, as in ::ffff:1.2.3.4.
  const lastColon = host.lastIndexOf(':');
  let tail = [];
  if (lastColon !== -1 && host.indexOf('.', lastColon) !== -1) {
    const value = parseIpv4(host.slice(lastColon + 1));
    if (value === null) {
      return null;
    }
    tail = [value >>> 16, value & 0xffff];
    host = host.slice(0, lastColon + 1) + '0';
  }
  const halves = host.split('::');
  if (halves.length > 2) {
    return null;
  }
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const rest = halves.length === 2 ? (halves[1] === '' ? [] : halves[1].split(':')) : [];
  // Without an elision the groups have to fill the address exactly.
  if (halves.length === 1 && head.length + tail.length !== 8) {
    return null;
  }
  const missing = 8 - head.length - rest.length - tail.length;
  if (missing < 0) {
    return null;
  }
  const groups = [...head, ...new Array(missing).fill('0'), ...rest, ...tail.map(String)];
  const numbers = [];
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      return null;
    }
    numbers.push(parseInt(group, 16));
  }
  return numbers.length === 8 ? numbers : null;
}

function isPrivateIpv6(groups) {
  const zero = (from, to) => groups.slice(from, to).every((group) => group === 0);
  const low = to32(groups.slice(6, 8));
  const top = groups[0];

  // ::/96, ::ffff:0:0/96 and 64:ff9b::/96 carry an IPv4 address in their low 32 bits, which is
  // the one reached: this turns ::1 into 0.0.0.1 and ::ffff:7f00:1 into 127.0.0.1.
  const embedsIpv4 =
    zero(0, 6) ||
    (zero(0, 5) && groups[5] === 0xffff) ||
    (top === 0x0064 && groups[1] === 0xff9b && zero(2, 6));
  if (embedsIpv4) {
    return isPrivateIpv4(low);
  }
  // 2002::/16 (6to4) carries the IPv4 address in groups 1 and 2.
  if (top === 0x2002) {
    return isPrivateIpv4(to32(groups.slice(1, 3)));
  }
  // 2001::/32 (Teredo) carries the client address in the low 32 bits, bitwise complemented.
  if (top === 0x2001 && groups[1] === 0x0000) {
    return isPrivateIpv4((~low) >>> 0);
  }
  if ((top & 0xfe00) === 0xfc00) {
    return true; // fc00::/7 unique local
  }
  if ((top & 0xffc0) === 0xfe80) {
    return true; // fe80::/10 link-local
  }
  if ((top & 0xffc0) === 0xfec0) {
    return true; // fec0::/10 site-local, deprecated but still routed inside a site
  }
  if ((top & 0xff00) === 0xff00) {
    return true; // ff00::/8 multicast
  }
  if (top === 0x0100 && zero(1, 4)) {
    return true; // 100::/64 discard-only
  }
  if (top === 0x2001 && groups[1] === 0x0db8) {
    return true; // 2001:db8::/32 documentation
  }
  // 64:ff9b:1::/48, the site-local NAT64 (the well-known /96 above is global by its carried address).
  if (top === 0x0064 && groups[1] === 0xff9b && groups[2] === 0x0001) {
    return true;
  }
  // 2001:10::/28 and 2001:20::/28, IETF reserved and ORCHIDv2: no global route.
  if (top === 0x2001 && ((groups[1] & 0xfff0) === 0x0010 || (groups[1] & 0xfff0) === 0x0020)) {
    return true;
  }
  if (top === 0x3ffe) {
    return true; // 3ffe::/16 retired 6bone, still routed in some networks
  }
  return false;
}

function isPrivateHost(hostname) {
  if (typeof hostname !== 'string') {
    return true;
  }
  // Brackets and trailing dots are what the url parser hands over and net.isIPv* rejects; without
  // normalising them an unrecognised shape would fall through as "public".
  let host = hostname.trim().toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  // Every trailing dot: "127.0.0.1.." is a shape none of the checks below recognises.
  while (host.endsWith('.')) {
    host = host.slice(0, -1);
  }
  if (host === '' || host.split('.').some((label) => label === '')) {
    // Not a host anyone can look up, and resolvers disagree on what it means.
    return true;
  }
  if (net.isIPv4(host)) {
    return isPrivateIpv4(parseIpv4(host));
  }
  if (net.isIPv6(host)) {
    const groups = parseIpv6(host);
    return groups === null ? true : isPrivateIpv6(groups);
  }
  // Loopback names from the node image's /etc/hosts that the suffix test below misses.
  if (['ip6-localhost', 'ip6-loopback', 'localhost4', 'localhost6'].includes(host)) {
    return true;
  }
  if (host.indexOf('.') === -1) {
    // A bare label is whatever the local search list says - on the compose network it is literally
    // "database" - and no metadata url is ever a bare name. Refused, so the answer does not depend
    // on where the registry runs.
    return true;
  }
  // Last label only, so "localhost.example.com" stays a public name; localdomain is in because
  // "localhost.localdomain" is loopback.
  if (/\.(localhost|local|localdomain|internal|home|lan)$/.test(host)) {
    return true;
  }
  // A real name: its address is the resolver's business, judged in createSafeLookup.
  return false;
}

// Brackets and trailing dots off, lowercased - the same shape the checks above use.
function cleanHost(hostname) {
  let host = String(hostname).trim().toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }
  while (host.endsWith('.')) {
    host = host.slice(0, -1);
  }
  return host;
}

// The one address of a name this server may connect to, or why it may not. Every answer has to be
// public: one private among them is enough to be aimed at.
async function publicAddress(hostname) {
  const host = cleanHost(hostname);
  if (net.isIPv4(host) || net.isIPv6(host)) {
    // assertSafeFetchUrl has already judged the literal.
    return { address: host, family: net.isIPv4(host) ? 4 : 6 };
  }
  if (isPrivateHost(host)) {
    throw new UnsafeUrlError('The metadata url has to point at a publicly reachable host.', 400);
  }
  let answers;
  try {
    // dns.lookup and not dns.resolve4/6: the same question the socket asks, /etc/hosts included.
    answers = await dns.lookup(host, { all: true, verbatim: true });
  }
  catch (err) {
    // 404, not 400: an unresolvable name leads nowhere, it is not a refusal.
    throw new UnsafeUrlError('The host of the metadata url could not be resolved.', 404);
  }
  if (!answers || answers.length === 0) {
    throw new UnsafeUrlError('The host of the metadata url could not be resolved.', 404);
  }
  const refused = answers.find((answer) => isPrivateHost(answer.address));
  if (refused) {
    // The name looks ordinary; it is the address behind it that is refused.
    throw new UnsafeUrlError('The host of the metadata url resolves to an address this server must not reach.', 400);
  }
  return { address: answers[0].address, family: answers[0].family };
}

// The lookup to hand axios, so the address connected to is the address that was vetted - an
// unpinned axios resolves again at connect time and DNS rebinding rides through the gap.
// Whatever host the socket asks about is judged, so an internal HTTP_PROXY has to stay out of
// this path: its own address would be judged, and refused.
function createSafeLookup() {
  return function safeLookup(hostname, options, callback) {
    // Handles the (hostname, options, callback) call and the older two-argument shape.
    const asked = typeof options === 'function' ? {} : options;
    const done = typeof options === 'function' ? options : callback;
    if (typeof hostname !== 'string' || typeof done !== 'function') {
      // Fail the request rather than answer for a call this lookup does not know.
      throw new UnsafeUrlError('The metadata url could not be resolved to a checked address.');
    }
    publicAddress(hostname).then((vetted) => {
      // Only the vetted address is ever handed back, in the shape node asked for.
      if (asked && asked.all === true) {
        done(null, [{ address: vetted.address, family: vetted.family }]);
      }
      else {
        done(null, vetted.address, vetted.family);
      }
    }, (err) => {
      done(err instanceof UnsafeUrlError ? err : new UnsafeUrlError('The host of the metadata url could not be resolved.', 404));
    });
  };
}

// The refusal an error amounts to, or null. "Could not get there" and "will not get there" are
// different answers for the user. Recognised by code, not class, because axios rebuilds whatever
// the lookup throws into an error of its own.
function addressRefusal(err) {
  if (!err) {
    return null;
  }
  if (err instanceof UnsafeUrlError || err.code === refusedAddressCode) {
    return err;
  }
  if (err.cause && (err.cause instanceof UnsafeUrlError || err.cause.code === refusedAddressCode)) {
    return err.cause;
  }
  return null;
}

// Returns the parsed url, or throws UnsafeUrlError when it must not be fetched.
function assertSafeFetchUrl(raw) {
  let parsed;
  try {
    // No base on purpose: "evil.com/metadata" must fail to parse, not read as a path.
    parsed = new URL(raw);
  } catch (err) {
    throw new UnsafeUrlError('The metadata url is not a valid url.', 400);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeUrlError('The metadata url has to be an http or https url.', 400);
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError('The metadata url must not contain credentials.', 400);
  }
  // The URL parser canonicalises 0177.0.0.1 / 2130706433 / 0x7f000001 / 127.1 to dotted form, so
  // judging parsed.hostname rather than the raw string is enough.
  if (isPrivateHost(parsed.hostname)) {
    throw new UnsafeUrlError('The metadata url has to point at a publicly reachable host.', 400);
  }
  return parsed;
}

module.exports = {
  assertSafeFetchUrl,
  createSafeLookup,
  isPrivateHost,
  addressRefusal,
  UnsafeUrlError,
  // publicAddress is exported for the tests.
  publicAddress
};
