// Template placeholder replaced by CDK at synthesis time
var TARGET_DOMAIN = '__TARGET_DOMAIN__';

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Pass-through paths required by email, federation, and identity protocols
  if (uri.startsWith('/.well-known/') || uri === '/keybase.txt' || uri === '/robots.txt') {
    return request;
  }

  // All other paths 301 redirect to target domain
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: TARGET_DOMAIN + uri },
      'cache-control': { value: 'public, max-age=86400' },
    },
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handler };
}
