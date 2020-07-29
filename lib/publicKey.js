var Amino = require('./amino.js');
/**
 * Lib helps to work with lambda publicKey.
 *
 * @module lib/publicKey
 */
const bech32 = require('bech32');
/**
 * @const PREFIX address prefix.
 *
 * @type    {String}
 * @default
 */
const PREFIX = 'lambdapub';
Amino.RegisterConcrete(null, 'tendermint/PubKeySecp256k1');
/**
 * Get lambda (bech32) public key.
 *
 * @param  {Buffer} publicKey Public key
 * @return {String}           Bech32 address
 */
exports.getPublicKey = function getAddress(publicKey) {
  var PubKeyAmino = Amino.MarshalBinary('tendermint/PubKeySecp256k1', publicKey);
  const words = bech32.toWords(PubKeyAmino);
  return bech32.encode(PREFIX, words);
};
/**
 * Get bytes from public key (bech32).
 *
 * @param  {String} publicKeybech32
 * @return {Buffer}
 */
function getBytes(publicKeybech32) {
  const decoded = bech32.decode(publicKeybech32);

  var publicKeyAmino = Buffer.from(bech32.fromWords(decoded.words));
  var publicKey = Amino.unMarshalBinary('tendermint/PubKeySecp256k1', publicKeyAmino);
  return publicKey;
}
exports.getBytes = getBytes;
