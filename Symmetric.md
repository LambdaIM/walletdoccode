### 关键加密算法
1 ed25519

2 bcryptjs
### 代码例子
在lib 的 privateKey.js 文件中

调用
```
var address = require('./lib/address.js')
var privateKey =require('./lib/privateKey.js')

var MnemonicUser = `squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter`
var userWallet = crypto.getKeysFromMnemonic(MnemonicUser);
console.log('privateKey',userWallet.privateKey.toString('hex'))

var data = privateKey.ExportprivateKey(userWallet.privateKey,'123456')

console.log('en salt ',data.salt.toString('hex'))
console.log('en privateKey ',data.privateKey.toString('hex'))
var udata=  privateKey.importPrivateKey(data.privateKey,data.salt,'123456')

console.log('udata',udata.toString('hex'))
```

### encryptSymmetric 、decryptSymmetric

    
decryptSymmetric，decryptSymmetric  是tendermint 中的加密和解密解密用的方法

https://github.com/tendermint/tendermint/blob/3e1516b62427aba1199766fc98943dffe81d7f4b/crypto/xsalsa20symmetric/symmetric

这里参考了社区中用js对decryptSymmetric，decryptSymmetric 的翻译

这里用的加密方法为 ed25519
      

```
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
```
### bcryptjs 的说明

bcryptjs 有两种前缀$2a$ 和 $2b$，这里仅实现了$2a$，所以只支持$2a$

### 格式化公钥
//通过Amino 库处理公钥  这里参考了 社区对amino 一些方法 的js版本的翻译

//https://github.com/tendermint/go-amino

这里在社区翻译 js 版本的Amino
```
'use strict';

const Sha256 = require('sha256');
function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
      bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
  }

/**
 * 处理amino编码（目前支持序列化）
 *
 */
class Amino {
  constructor() {
    this._keyMap = {};
  }

  /**
     */

  GetRegisterInfo(key) {
    const info = this._keyMap[key];
    if (info === undefined) {
      throw new Error('amino not Registered')
    }
    return info;
  }

  /**
     * 注册amino类型
     *
     * @param class field的类型
     * @param key amino前缀
     */
  RegisterConcrete(type, key) {
    this._keyMap[key] = {
      prefix: this._aminoPrefix(key),
      classType: type
    };
  }

  /**
     * 给消息加上amino前缀
     *
     * @param key amino前缀
     * @param message 编码msg
     * @returns { Array }
     */
  MarshalBinary(key, message) {
    let prefixBytes = this._keyMap[key].prefix;
    prefixBytes = Buffer.from(prefixBytes.concat(message.length));
    prefixBytes = Buffer.concat([prefixBytes, message]);
    return prefixBytes;
  }

  unMarshalBinary(key, dataBuffer) {
    const prefixBytes = this._keyMap[key].prefix;
    if (dataBuffer.length < this._keyMap[key].prefix.length + 2) {
      
      throw new Error('amino buffer is wrong')
      return null;
    }
    if (dataBuffer.slice(0, 4).toString('hex') != Buffer.from(prefixBytes).toString('hex')) {
      
      throw new Error('amino prefixBytes is wrong')
      return null;
    }
    var msglength = dataBuffer.slice(4, 5)[0];
    var msgbuffer = dataBuffer.slice(5, dataBuffer.length);
    if (msgbuffer.length != msglength) {
      console.log('msg is wrong');
      throw new Error('amino msg is wrong')
      return null;
    }
    return msgbuffer;
  }

  MarshalJSON(key, message) {
    const pair = {
      type: key,
      value: message
    };
    return pair;
  }

  _aminoPrefix(name) {
    const a = Sha256(name);
    let b = hexToBytes(a);
    while (b[0] === 0) {
      b = b.slice(1, b.length - 1);
    }
    b = b.slice(3, b.length - 1);
    while (b[0] === 0) {
      b = b.slice(1, b.length - 1);
    }
    b = b.slice(0, 4);// 注意和go-amino v0.6.2以前的不一样
    return b;
  }
}

const amino = new Amino();
amino.RegisterConcrete(null, "tendermint/PubKeySecp256k1");
amino.RegisterConcrete(null, "tendermint/SignatureSecp256k1");

module.exports = amino;
```

