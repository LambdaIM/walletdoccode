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