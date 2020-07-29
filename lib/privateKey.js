'use strict';

/**
 * Lib helps to work with lambda privateKey.
 *
 * @module lib/privateKey
 */
'use strict';



const crypto = require('crypto');


var bufferTo = require('buffer-to-uint8array');
var toBuffer = require('typedarray-to-buffer');

var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const bcrypt = require('@jswebfans/bcryptjs');



var encryptSymmetric = function (data, prefix, key) {
  prefix = nacl.util.decodeUTF8(prefix);
  var nonceLength = 24 - prefix.length;
  var randomNonce = new Uint8Array(nacl.randomBytes(nacl.secretbox.nonceLength));
  var shortNonce = randomNonce.subarray(0, nonceLength);
  var nonce = new Uint8Array(24);
  nonce.set(prefix);
  nonce.set(shortNonce, prefix.length);
  var box = nacl.secretbox(data, nonce, key);
  var result = new Uint8Array(nonceLength + box.length);
  result.set(shortNonce);
  result.set(box, nonceLength);

  return result;
};

var decryptSymmetric = function (data, prefix, key) {
  try {
    prefix = nacl.util.decodeUTF8(prefix);
    var nonceLength = 24 - prefix.length;
    var shortNonce = data.subarray(0, nonceLength);
    var nonce = new Uint8Array(24);
    nonce.set(prefix);
    nonce.set(shortNonce, prefix.length);
    var result = nacl.secretbox.open(data.subarray(nonceLength), nonce, key);
  } catch (err) {
    return;
  }
  return result;
};



/**
 * @const prefixFor address prefix.
 *
 * @type    {String}
 * @default
 */

const prefixFor = Buffer.from('22222');// 长度固定的前缀
const saltRounds = 12;

/**
 * Get Cosmos address (bech32) from public key.
 *
 * @param  {Buffer} publicKey Public key
 * @return {String}           Bech32 address
 */
exports.ExportprivateKey = function encodePrivateKey(privatekey, password) {
  var usersalt = crypto.randomBytes(16);

  var salt = bcrypt.genSaltSync(saltRounds, '', usersalt);

  var hash = bcrypt.hashSync(password, salt);

  const hashs = crypto.createHash('sha256');
  hashs.update(Buffer.from(hash));
  const userkey = hashs.digest('hex');

  var userkeyF8 = bufferTo(Buffer.from(userkey, 'hex'));
  var haveprefixPrivateKey = Buffer.concat([prefixFor, privatekey], prefixFor.length + privatekey.length);
  var praviteFB = bufferTo(haveprefixPrivateKey);
  var cryptoResult = encryptSymmetric(praviteFB, '', userkeyF8);
  var Key = toBuffer(cryptoResult);
  return {
    salt: usersalt,
    privateKey: Key
  };
};

exports.importPrivateKey = function decodePrivateKey(privatekey, usersalt, password) {
  var salt = bcrypt.genSaltSync(saltRounds, '', usersalt);
  var hash = bcrypt.hashSync(password, salt);

  const hashs = crypto.createHash('sha256');
  hashs.update(Buffer.from(hash));
  const userkey = hashs.digest('hex');

  var userkeyF8 = bufferTo(Buffer.from(userkey, 'hex'));
  var privatekeyF8 = bufferTo(privatekey);

  var seed = decryptSymmetric(privatekeyF8, '', userkeyF8);
  if (seed == null || seed.length == 0) {
    throw new Error('Password error')
  }

  var privateKey = toBuffer(seed).slice(5);
  return privateKey;
};