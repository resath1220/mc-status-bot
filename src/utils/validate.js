// Conservative hostname/IPv4 pattern — good enough to reject junk input
// before it's ever handed to a network call. We never shell out or build
// commands from this input, so this is a UX guard, not a security boundary
// against the network layer itself.
const HOSTNAME_RE = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*$/;
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isValidIPv4(host) {
  const m = host.match(IPV4_RE);
  if (!m) return false;
  return m.slice(1, 5).every((octet) => Number(octet) >= 0 && Number(octet) <= 255);
}

function isValidHost(host) {
  if (typeof host !== 'string') return false;
  const h = host.trim();
  if (!h || h.length > 253) return false;
  if (isValidIPv4(h)) return true;
  return HOSTNAME_RE.test(h);
}

function isValidPort(port) {
  const n = Number(port);
  return Number.isInteger(n) && n > 0 && n <= 65535;
}

function sanitizeName(name, maxLen = 32) {
  if (typeof name !== 'string') return '';
  return name.replace(/[`*_~|]/g, '').trim().slice(0, maxLen);
}

module.exports = { isValidHost, isValidPort, sanitizeName };
