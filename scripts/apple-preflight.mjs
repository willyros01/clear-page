import { createPrivateKey, sign } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const appId = '6833284199';
const bundleId = 'io.github.willyros01.clearpage';
function report(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + '\n');
}
async function main() {
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8', 'APPLE_TEAM_ID']) {
    if (!process.env[name]?.trim()) throw new Error('Missing required secret: ' + name);
  }
  let key;
  try {
    key = createPrivateKey(process.env.ASC_KEY_P8.trim());
  } catch {
    throw new Error('P8 could not be parsed. Save the complete original PEM private key including BEGIN and END lines.');
  }
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') {
    throw new Error('P8 is not an Apple-compatible P-256 private key.');
  }
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: 'ES256', kid: process.env.ASC_KEY_ID.trim(), typ: 'JWT' }) + '.' +
    encode({ iss: process.env.ASC_ISSUER_ID.trim(), iat: now, exp: now + 300,
      aud: 'appstoreconnect-v1', scope: ['GET /v1/apps/' + appId] });
  const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  let response;
  try {
    response = await fetch('https://api.appstoreconnect.apple.com/v1/apps/' + appId, {
      headers: { Authorization: 'Bearer ' + unsigned + '.' + signature },
      redirect: 'error', signal: AbortSignal.timeout(30000)
    });
  } catch {
    throw new Error('Apple API connection failed or timed out; no credential details logged.');
  }
  if (!response.ok) throw new Error('Apple rejected the app lookup (HTTP ' + response.status + '). Check key status, issuer, key ID and app permissions.');
  const body = await response.json();
  if (body.data?.id !== appId || body.data?.attributes?.bundleId !== bundleId) {
    throw new Error('Apple app identity did not match Clear Page.');
  }
  report('PASS: Apple authenticated the P8 key and confirmed access to Clear Page (' + appId + ').');
  report('This read-only check does not verify signing certificates, provisioning, archive export or TestFlight upload.');
}
main().catch(error => {
  report('FAIL: ' + error.message);
  process.exitCode = 1;
});
