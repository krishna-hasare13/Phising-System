const dns = require('dns');

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function normalizeBody(req) {
  let body = req.body;

  // Some Windows shell/curl setups may send JSON as a string.
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      throw badRequest('Invalid JSON body');
    }
  }

  if (!body || typeof body !== 'object') {
    throw badRequest('Invalid JSON body');
  }

  return body;
}

function parseUrlAndValidate(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw badRequest('URL is required');
  }

  const trimmed = urlStr.trim();
  if (trimmed.length > 2048) {
    throw badRequest('URL is too long');
  }

  let u;
  try {
    u = new URL(trimmed);
  } catch {
    throw badRequest('Invalid URL');
  }

  if (!['http:', 'https:'].includes(u.protocol)) {
    throw badRequest('Only http/https URLs are allowed');
  }

  // Basic SSRF-ish protections:
  // - block localhost and private ranges (best-effort)
  // - NOTE: fully correct SSRF protection requires DNS/IP resolution + allowlists.

  const hostname = u.hostname;
  const lowered = hostname.toLowerCase();

  const blockedHosts = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
  ];
  if (blockedHosts.includes(lowered)) {
    throw badRequest('URL is not allowed');
  }

  // If hostname is an IP literal, block common private ranges.
  const ipV4 = lowered.match(/^\d{1,3}(\.\d{1,3}){3}$/);
  if (ipV4) {
    const parts = lowered.split('.').map((x) => Number(x));
    const [a, b] = parts;

    const isPrivate =
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 169; // placeholder, more granular below

    const isLinkLocal = lowered.startsWith('169.254.');

    if (isPrivate || isLinkLocal) {
      throw badRequest('URL is not allowed');
    }
  }

  return u.toString();
}

function truncateText(text, maxLen = 5000) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen);
}

module.exports = {
  normalizeBody,
  parseUrlAndValidate,
  truncateText,
  badRequest,
};

