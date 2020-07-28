const bech32 = require('bech32');
const Ripemd160 = require('ripemd160');
const crypto = require('crypto');
/**
 * @const lambda bech32 address prefix.
 *
 * @type    {String}
 * @default
 */
const PREFIX = 'lambda';
const PREFIXDev = 'lambdavaloper';
/**
 * Get lambda  address (bech32) from public key.
 *
 * @param  {Buffer} publicKey Public key
 * @return {String}           Bech32 address
 */
exports.getAddress = function getAddress(publicKey) {
  const hash = crypto.createHash('sha256')
    .update(publicKey)
    .digest();
  const address = new Ripemd160().update(hash).digest();
  const words = bech32.toWords(address);
  return bech32.encode(PREFIX, words);
};