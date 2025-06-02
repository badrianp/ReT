export function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const parsed = Object.fromEntries(new URLSearchParams(body));
      resolve(parsed);
    });
    req.on('error', (err) => {
      console.error("Error in parseRequestBody:\n", err);
      reject(err);
    });
  });
}