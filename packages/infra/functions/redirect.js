import cf from 'cloudfront';

const kvsHandle = cf.kvs();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event) {
  const request = event.request;
  const uri = request.uri;

  // Pass-through paths required by email, federation, and identity protocols
  if (
    uri.startsWith('/.well-known/') ||
    uri === '/keybase.txt' ||
    uri === '/robots.txt'
  ) {
    return request;
  }

  // All other paths 301 redirect to target domain
  try {
    const targetDomain = await kvsHandle.get('targetDomain');
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: targetDomain + uri },
        'cache-control': { value: 'public, max-age=86400' },
      },
    };
  } catch {
    return {
      statusCode: 500,
      statusDescription: 'Internal Server Error',
    };
  }
}
