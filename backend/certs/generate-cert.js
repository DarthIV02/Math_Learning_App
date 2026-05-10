const selfsigned = require('selfsigned');
const fs = require('fs');

async function main() {
  const attrs = [{ name: 'commonName', value: '172.24.220.6' }];

  const pems = await selfsigned.generate(attrs, {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
  });

  console.log(Object.keys(pems));

  fs.writeFileSync('./key.pem', pems.privateKey || pems.private);
  fs.writeFileSync('./cert.pem', pems.cert);

  console.log('Certificates generated.');
}

main().catch(console.error);