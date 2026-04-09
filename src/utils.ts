export function validateAndSanitizeUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== 'https:') {
    throw new Error('Security Error: Must be https protocol');
  }
  
  const forbiddenHosts = ['localhost', '127.0.0.1', '169.254.169.254', '0.0.0.0'];
  if (forbiddenHosts.includes(url.hostname)) {
    throw new Error('Security Error: Invalid host');
  }
  
  return url;
}
