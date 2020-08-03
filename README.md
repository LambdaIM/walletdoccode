# 钱包说明文档的示例代码
 以示例代码为基础，完善的lambda hdkey  https://github.com/LambdaIM/hdkeydemo
可用于测试和演示

## 1 地址、助记词、加密算法相关
      生成助记词 使用 bip39   钱包和区块链使用长度为256位的助记词 （24个单词）

      生成公钥私钥对 使用bip32  derivePath 为  '44\'/364\'/0\'/0/0'

      钱包生成的地址和链生成的地址保持一致 需要使用相同的 derivePath

例如

在lib目录中 新建文件 crypto.js 
文件内容如下
```
const bip39 = require('bip39');
const bip32 = require('bip32');
const crypto = require('crypto');
const secp256k1 = require('secp256k1');
exports.generateRandomMnemonic = function(strength) {
  return bip39.generateMnemonic(strength);
};
/**
 * Get keys (private/public) from mnemonic and path (bip32/39/44).
 *
 * @param  {String} mnemonic        Mnemonic words.
 * @param  {String} path            BIP44 path.
 * @return {Object.<Buffer,Buffer>} Wallet object contains privateKey/publicKey.
 */
exports.getKeysFromMnemonic = function getKeysFromMnemonic(mnemonic, path = '44\'/364\'/0\'/0/0') {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const master = bip32.fromSeed(seed);
  const wallet = master.derivePath(path);
  return wallet;
};

```
调用
```
var crypto = require('./lib/crypto.js')
//生成助记词
var Mnemonic = crypto.generateRandomMnemonic(256);
//根据助记词生成钱包
var wallet = crypto.getKeysFromMnemonic(Mnemonic)

console.log('Mnemonic:',Mnemonic)
console.log('publicKey:',wallet.publicKey.toString('base64'))
console.log('privateKey:',wallet.privateKey.toString('base64'))
```
输出
```
Mnemonic: apple edit board husband major farm distance abuse pill sing topple gap rotate butter armed profit luxury supply excite topple daughter cereal slogan rubber
publicKey: A/xcU66KAS53tfEUgID2IkiHYRNJ2F/FJlAHCB7dR/HP
privateKey: wAx6t5j4IGl9ZWpwKtseWlxDxpEz7rM+f9BNfaO8h4A=
```



  根据公钥生成地址
 

   生成地址对生成的公钥 进行sha256 加密后，在用Ripemd160 处理， 再用bech32 添加 lambda 对应的前缀

例如  lambda 地址前缀 为lambda：`lambda1z4hs23xwjuudm44nhgcde0zxf5y63su8deuqs3`

在lib 目录中新建文件 address.js

```
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
```
 lambda  其他角色  前缀  

Bech32PrefixAccAddr = lambda                //lambda 地址前缀

Bech32PrefixAccPub = lambdapub              //lambda 公钥前缀 

Bech32PrefixValAddr = lambdavaloper         //lambda 操作地址前缀 

Bech32PrefixValPub = lambdavaloperpub   

Bech32PrefixConsAddr = lambdavalcons

Bech32PrefixConsPub = lambdavalconspub

Bech32PrefixMinerAddr = lambdamineroper      //lambda 矿工操作地址前缀

Bech32PrefixMinerPub = lambdamineroperpub

Bech32PrefixMarketAddr = lambdamarketoper

Bech32PrefixMarketPub = lambdamarketoperpub

调用
```
var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')

var Mnemonic = crypto.generateRandomMnemonic(256);
var wallet = crypto.getKeysFromMnemonic(Mnemonic)

console.log('Mnemonic:',Mnemonic)
console.log('publicKey:',wallet.publicKey.toString('base64'))
console.log('privateKey:',wallet.privateKey.toString('base64'))


var lambdaaddress = address.getAddress(wallet.publicKey)
console.log('address:',lambdaaddress)
```
输出
```
Mnemonic: squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter
publicKey: AmAn+0ZB8BYtfgNjeyY6iuPDTbHZh1BWSU90hDCDy7so
privateKey: q+/iaUJQhM/eyttNigHxTBVHi/vjA+qjBV8xrvilROA=
address: lambda1neqj4tcpvzms097zs0a0vjdntwsun3u7n72sna
```



## 2 数据签名相关
  首先对需要签名的数据进行sha256 计算 ，再对 计算结果和私钥 用 secp256k1 进行计算

在lib目录中  crypto.js  中新增如下的方法

```
const bip39 = require('bip39');
const bip32 = require('bip32');
const crypto = require('crypto');
const secp256k1 = require('secp256k1');

/**
 * Sign bytes with private key by secp256k1 algo.
 *
 * @param  {Buffer} bytes      Bytes to sign.
 * @param  {Buffer} privateKey Private key to sign bytes.
 * @return {Buffer}            Signature bytes.
 * @static
 */
function sign(bytes, privateKey) {
  const hash = crypto.createHash('sha256')
    .update(bytes)
    .digest();
  return secp256k1.sign(hash, privateKey).signature;
}

/**
 * Verify signature by object bytes and public key.
 *
 * @param  {Buffer} bytes     Bytes to verify signature.
 * @param  {Buffer} signature Signature bytes.
 * @param  {Buffer} publicKey Public key to verify signature.
 * @return {Boolean}          Result of verification.
 * @static
 */
function verify(bytes, signature, publicKey) {
  const hash = crypto.createHash('sha256')
    .update(bytes)
    .digest();

  return secp256k1.verify(hash, signature, publicKey);
}
```
调用，我们以上面生成的账户为例子进行签名和校验
Mnemonic: squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter
publicKey: AmAn+0ZB8BYtfgNjeyY6iuPDTbHZh1BWSU90hDCDy7so
privateKey: q+/iaUJQhM/eyttNigHxTBVHi/vjA+qjBV8xrvilROA=
address: lambda1neqj4tcpvzms097zs0a0vjdntwsun3u7n72sna
```
var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')

//转账交易的数据结构 数据的解释说明见下方
var fee={
    "amount":[
        {
            "amount":"2000",
            "denom":"ulamb"
        }],
    "gas":"11132"
};

var msg = [
    {
        "type":"cosmos-sdk/MsgSend",
        "value":{
            "amount":[
                {
                    "amount":"2000000000",
                    "denom":"ulamb"
                }],
            "from_address":"lambda1neqj4tcpvzms097zs0a0vjdntwsun3u7n72sna",
            "to_address":"lambda12rn0wnxt8dajnm0w4ktca65lw9jelpt493d8p4"
        }
    }];

var txSendContent = {
    "account_number":"0", //需要获取
    "chain_id":"lambda-chain-test5.0",
    "fee":fee,
    "memo":"",
    "msgs":msg,
    "sequence":"0" //需要获取
}

var MnemonicUser = `squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter`

var userWallet = crypto.getKeysFromMnemonic(MnemonicUser);

var signtxdata = crypto.sign(Buffer.from(JSON.stringify(txSendContent)),userWallet.privateKey);

console.log('signtxdata',signtxdata.toString('base64'))

var isverify = crypto.verify(Buffer.from(JSON.stringify(txSendContent)),signtxdata,userWallet.publicKey)
console.log('isverify',isverify)

```
输出
```
signtxdata ln6wcZw5kur5H5tYA67zpBfyguP1bfD8rpDwnes0pyc6N5fD5n/GDXNfLUl6Bg0l38Yuiko8jVWD+WAMuXGGng==
isverify true
```

## 3发送交易举例-转账交易
 
 [查看更多交易数据结构说明](http://docs.lambdastorage.com/Wallet-API/) 

 发送交易分为三个部分

### 1拼接交易的数据结构用于签名
不同的交易类型，msgs数组中的对象的结构会有差别

```
{
    "account_number": "1",  //通过用户信息获取
    "chain_id": "lambda-chain-test2.5", //链的版本号 通过最新的区块信息获取 
    "fee": {//手续费
        "amount": [{
            "amount": "101745",
            "denom": "ulamb" 
        }],
        "gas": "40698"  // gas 
    },
    "memo": "", //备注
    "msgs": [{
        "type": "cosmos-sdk/MsgSend", //交易类型
        "value": {
            "amount": [{
                "amount": "1000000",   //交易的数量
                "denom": "ulamb"    //交易的代币类型
            }],
            "from_address": "lambda1prrcl9674j4aqrgrzmys5e28lkcxmntx2gm2zt",  //发送地址
            "to_address": "lambda1hynqrp2f80jqs86gu8nd5wwcnek2wwd3esszg0"   //接受地址
        }
    }],
    "sequence": "125"  //通过获取用户信息接口获取
}
```
手续费部分gas 可以填的大一点例如2000000，amount 表示gas的价格可以填的小一点例如1（1ulamb）

每次发起交易前，均要通过账户信息接口获取最新的sequence、account_number
http://bj1.testnet.lambdastorage.com:13659/auth/accounts/lambda1prrcl9674j4aqrgrzmys5e28lkcxmntx2gm2zt

chain_id 通过node_info 接口获取
http://bj1.testnet.lambdastorage.com:13659/node_info

### 2对拼接好的数据进行签名
例如 对第1步数据结构签名的，结果的base64格式
```
fa9bUlNRA3qa9PEYR2py6CgpQbbqVsuKhJRowMdlf90byj7M/2B1YQsu6EPAk1V/tLkKiNwEadkAKNFUxZngGA==
```
### 3 拼接发送交易的数据
拼接 交易数据需要注意的是 msg、fee、memo 需要和签名的数据中的msgs 、fee、memo 保持一致
```
{
    "tx": {
        "msg": [{
            "type": "cosmos-sdk/MsgSend",
            "value": {
                "amount": [{
                    "amount": "1000000",
                    "denom": "ulamb"
                }],
                "from_address": "lambda1prrcl9674j4aqrgrzmys5e28lkcxmntx2gm2zt",
                "to_address": "lambda1hynqrp2f80jqs86gu8nd5wwcnek2wwd3esszg0"
            }
        }],
        "fee": {
            "amount": [{
                "amount": "101745",
                "denom": "ulamb"
            }],
            "gas": "40698"
        },
        "signatures": [{  
            "signature": //签名的结果
"fa9bUlNRA3qa9PEYR2py6CgpQbbqVsuKhJRowMdlf90byj7M/2B1YQsu6EPAk1V/tLkKiNwEadkAKNFUxZngGA==", //数据签名的base64格式
            "pub_key": {
                "type": "tendermint/PubKeySecp256k1",
                "value": "AjmQ01Z+IoHuKLdPaFzV6IJQB88ahW2qv2rEw2H4B5dq"  //bip32生成的地址的公钥
            }
        }],
        "memo": ""
    },
    "mode": "async"    发送交易的方式async 为异步，block 为同步
}
```
拼接好数据后，通过post的方式发送到/txs接口
调用举例
```
const axios = require('axios');

var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')

var fee={
    "amount":[
        {
            "amount":"2000",
            "denom":"ulamb"
        }],
    "gas":"11132"
};

var msg = [
    {
        "type":"cosmos-sdk/MsgSend",
        "value":{
            "amount":[
                {
                    "amount":"2000000000",
                    "denom":"ulamb"
                }],
            "from_address":"lambda1neqj4tcpvzms097zs0a0vjdntwsun3u7n72sna",
            "to_address":"lambda12rn0wnxt8dajnm0w4ktca65lw9jelpt493d8p4"
        }
    }];

var txSendContent = {
    "account_number":"0", //需要获取
    "chain_id":"lambda-chain-test5.0",
    "fee":fee,
    "memo":"",
    "msgs":msg,
    "sequence":"0" //需要获取
}

var MnemonicUser = `squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter`
var userWallet = crypto.getKeysFromMnemonic(MnemonicUser);

var signtxdata = crypto.sign(Buffer.from(JSON.stringify(txSendContent)),userWallet.privateKey);

console.log('signtxdata',signtxdata.toString('base64'))

var isverify = crypto.verify(Buffer.from(JSON.stringify(txSendContent)),signtxdata,userWallet.publicKey)
console.log('isverify',isverify)


var txsend = {
    "tx": {
        "msg": msg,
        "fee": fee,
        "signatures": [{  
            "signature": signtxdata.toString('base64'), //数据签名的base64格式
            "pub_key": {
                "type": "tendermint/PubKeySecp256k1",
                "value": userWallet.publicKey.toString('base64')  //bip32生成的地址的公钥
            }
        }],
        "memo": ""
    },
    "mode": "block"    //发送交易的方式async 为异步，block 为同步
}

console.log('txsend',JSON.stringify(txsend) )
axios.post('http://bj1.testnet.lambdastorage.com:13659/txs', txsend)
  .then(function (response) {
      console.log('data')
    console.log(response.data);
  })
  .catch(function (error) {
    console.log('error')
    console.log(error);
  });


```
关于常见错误的说明

```
{"codespace":"sdk","code":4,"message":"signature verification failed; verify correct account sequence and chain-id"
```
一般遇到这个错误，说明拼接的签名用的数据结构不对，或者签名的数据和发送的数据不一致造成的

## 4 灵活的预估交易需要gas
[更多交易类型获取gas说明见](http://docs.lambdastorage.com/Wallet-API/) 
不同的交易类型，对应的获取gas的接口不同
以转账交易为例

接口
```
/bank/accounts/${senderAddress}/transfers
类型 post
发送数据类型 json
```
post 数据的格式
base_req 中对象的key是固定，将base_req 和msg中value 对象 合并 后发送数据就行
```
{
    "base_req": {
        "sequence": "208",
        "from": "lambda163q4m634nq8les4nuvdvz49tk6ae**********",
        "account_number": "6",
        "chain_id": "lambda-chain-test4.0",
        "simulate": true,
        "memo": ""
    },
    "amount": [{
        "amount": "1000000",
        "denom": "ulamb"
    }],
    "from_address": "lambda163q4m634nq8les4nuvdvz49tk6ae**********",
    "to_address": "lambda16cheh6j34ncyunwgfkq2940cs8222jka0fsp4k"
}
```
返回结果
```
  {"gas_estimate":"28077"}
```
调用举例

```
const axios = require('axios');

var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')



var fee={
    "amount":[
        {
            "amount":"2000",
            "denom":"ulamb"
        }],
    "gas":"11132"
};

var msg = [
    {
        "type":"cosmos-sdk/MsgSend",
        "value":{
            "amount":[
                {
                    "amount":"2000000000",
                    "denom":"ulamb"
                }],
            "from_address":"lambda1neqj4tcpvzms097zs0a0vjdntwsun3u7n72sna",
            "to_address":"lambda12rn0wnxt8dajnm0w4ktca65lw9jelpt493d8p4"
        }
    }];

var txSendContent = {
    "account_number":"0", //需要获取
    "chain_id":"lambda-chain-test5.0",
    "fee":fee,
    "memo":"",
    "msgs":msg,
    "sequence":"0" //需要获取
}

var MnemonicUser = `squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter`
var userWallet = crypto.getKeysFromMnemonic(MnemonicUser);
var userlambdaaddress = address.getAddress(userWallet.publicKey)

 var  base_req = {
    "sequence": "0",
    "from": userlambdaaddress,
    "account_number": "0",
    "chain_id": "lambda-chain-test5.0",
    "simulate": true,
    "memo": ""
}

var Simulationtx = Object.assign({base_req},msg[0].value)

axios.post(`http://bj1.testnet.lambdastorage.com:13659/bank/accounts/${userlambdaaddress}/transfers`, Simulationtx)
  .then(function (response) {
      console.log('data2')
    console.log(response.data);
  })
  .catch(function (error) {
    console.log('error2')
    console.log(error.response.data);
  });
```



## 5 创建矿工子账户
挖矿需要先创建矿工子账户，用于挖矿相关的业务处理，子账户的功能主要用于打包pdp相关

提交挖矿证明，是高频交易，以免干扰到用户对于账号的正常交易操作

创建矿工子账户和创建账户的助记词一致，

主账户的     derivePath 为  '44\'/364\'/0\'/0/0'

矿工子账户 derivePath 为  '44\'/364\'/0\'/0/1'  




## 6 钱包配置文件加密解密说明
以js为例子

### 私钥加密的过程
```
const crypto = require('crypto');
const bcrypt = require('@jswebfans/bcryptjs');
 //修改过的bcrypt，需要能够支持传入随机数

const saltRounds = 12;
exports.ExportprivateKey = function encodePrivateKey(privatekey, password) {
	  var usersalt = crypto.randomBytes(16);
       //生成随机数
	

	  var salt = bcrypt.genSaltSync(saltRounds, '', usersalt);
        //用bcrypt根据随机数生成随机盐
	

	  var hash = bcrypt.hashSync(password, salt);
        //用bcrypt根据根据密码和随机盐生成哈希
        
	  const hashs = crypto.createHash('sha256');
	  hashs.update(Buffer.from(hash));
	  const userkey = hashs.digest('hex');
       // 使用sha256 对哈希进行处理生成key
	
      //
	  格式转换的方法，私钥对应praviteFB， key 对应userkeyFB
       //调用加密方法进行加密
	  var cryptoResult = encryptSymmetric(praviteFB, '', userkeyFB);
       /*
       encryptSymmetric 是tendermint 中的一个加密用的方法，稍后会有详细说明
    https://github.com/tendermint/tendermint/blob/3e1516b62427aba1199766fc98943dffe81d7f4b/crypto/xsalsa20symmetric/symmetric.go
       */
	  var Key = toBuffer(cryptoResult);
	  return {
	    salt: usersalt,
	    privateKey: Key
	  };
	};
```
### 解密的过程
```
const saltRounds = 12;
exports.importPrivateKey = function decodePrivateKey(privatekey, usersalt, password) {
	  var salt = bcrypt.genSaltSync(saltRounds, '', usersalt);
       // bcrypt 根据随机数生成随机盐
	  var hash = bcrypt.hashSync(password, salt);
	   // bcrypt 根据密码和随机盐生成哈希

	  const hashs = crypto.createHash('sha256');
	  hashs.update(Buffer.from(hash));
	  const userkey = hashs.digest('hex');
       //使用sha256 对哈希值进行处理生成key
	
      /**
      js格式转换
      privatekeyFB 对应私钥privatekey
      userkeyFB   对应 key userkey
      **/
	

	  var seed = decryptSymmetric(privatekeyFB, '', userkeyFB);
      /**
      decryptSymmetric  是tendermint 中的一个解密用的方法，稍后会有详细的说明
    https://github.com/tendermint/tendermint/blob/3e1516b62427aba1199766fc98943dffe81d7f4b/crypto/xsalsa20symmetric/symmetric
      **/ 
	  if (seed == null || seed.length == 0) {
	    throw new Error('Password error');
	  }
	  var privateKey = toBuffer(seed).slice(5);
	  return privateKey;
	};
```
### 公钥格式化展示


### 配置文件的解释与说明
```
{
	"salt": "bXJ0fCwdyta3LYtShoBrSA==",
	"privateKey": "Tghm8vmEY+XtA0IrwGhsm1RM2+WZG+6MvnK34cCM+unP6wC11Uy00Z5q3NiozF91DoIDFgBIEVD0XqSKv+2xjAKDU9WAhS8r1tpKs2A=",
	"name": "钱包的名称",
	"address": "lambda17ydyaapgwfp0ekgxmr74szjakn58h79rdyf7a3",
	"publicKey": "lambdapub1addwnpepqvyxh8rxtjymsqty8wkct8hjgf87ueqdrvgpr758x2p32jypzqmcxx269sx"
}
```
配置文件中的publicKey是带有lambdapub前缀
代码例子
在lib 中 新建 publicKey.js
```

var Amino = require('./amino.js');
//通过Amino 库处理公钥  这里参考了 社区对amino 一些方法 的js版本的翻译
//https://github.com/tendermint/go-amino

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
```
调用例子

```
const axios = require('axios');

var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')
var publicKey =require('./lib/publicKey.js')

var MnemonicUser = `squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter`
var userWallet = crypto.getKeysFromMnemonic(MnemonicUser);
var lambdapubkey = publicKey.getPublicKey(userWallet.publicKey);
  
console.log('lambdapubkey',lambdapubkey)

```
### 关于decryptSymmetric和encryptSymmetric 方法的说明

[详细见](Symmetric.md) 

## 创建完账户、能够签名并发送交易，就可以从矿工哪里购买空间，使用s3 api上传文件了
### 购买空间相关的api和数据结构
1 获取矿工在售卖空间列表或在浏览器中选择合适矿工的卖单
```
/market/sellorders/${marketName}/${orderType}/${statusType}/${page}/${limit}
```
例如 http://bj1.testnet.lambdastorage.com:13659/market/sellorders/lambdamarket/premium/active/1/10
orderType 值为premium 表示读取优质的卖单，all 为全部卖单

statusType 值active 表示活跃的卖单 unActive 表示卖光了的卖单
```
[
  {
    "orderId": "062690F2FB389B8371373EBDC311C0423AA4750F",
    "address": "lambdamineroper1r8ls57p6rzgcz4l8ah9qnadu9lyqwwqv22v4h3",
    "price": "5000000",
    "rate": "1.000000000000000000",
    "amount": [
      {
        "denom": "ulamb",
        "amount": "49950000000"
      }
    ],
    "sellSize": "10000",
    "unusedSize": "9990",
    "status": "0",
    "createTime": "2020-07-16T16:11:32.793384537Z",
    "cancelTimeDuration": "3600000000000",
    "marketAddress": "lambdamarketoper1a83p8s9gs5hua09xn5ktmahepst3vzg9rjjlzy",
    "minBuySize": "1",
    "minDuration": "2592000000000000",
    "maxDuration": "155520000000000000",
    "reserve1": ""
  }
]
```

2 发送购买空间的交易

接口文档 http://docs.lambdastorage.com/Wallet-API/#6_2

签名前的数据结构
```
{
    "account_number": "535",
    "chain_id": "lambda-chain-test4.0",
    "fee": {
        "amount": [{
            "amount": "369293",
            "denom": "ulamb"
        }],
        "gas": "147717"
    },
    "memo": "",
    "msgs": [{
        "type": "lambda/MsgCreateBuyOrder",
        "value": {
            "address": "lambda1k6rxrmly7hz0ewh7gth2dj48mv3xs9yz8ffauw", 购买人的地址
            "duration": "2592000000000000", 购买的时长
            "marketName": "lambdamarket",市场名称
            "sellOrderId": "00A482D80ACAAA0BEDABB0AA6BE25598967E69DF",卖单id
            "size": "1"   购买空间大小
        }
    }],
    "sequence": "56083"
}
```
购买时长的单位为纳秒，购买的最短时间为1个月

2592000000000000 是一个月（30天）

lambdamarket 为默认的市场，


发送的数据结构

数据也是post到/txs 接口
```
{
    "tx": {
        "msg": [{
            "type": "lambda/MsgCreateBuyOrder",
            "value": {
                "address": "lambda1k6rxrmly7hz0ewh7gth2dj48mv3xs9yz8ffauw",
                "duration": "2592000000000000",
                "marketName": "lambdamarket",
                "sellOrderId": "00A482D80ACAAA0BEDABB0AA6BE25598967E69DF",
                "size": "1"
            }
        }],
        "fee": {
            "amount": [{
                "amount": "369293",
                "denom": "ulamb"
            }],
            "gas": "147717"
        },
        "signatures": [{
            "signature": "pUkiUoF9A1j02aTs1F9IHOOL57sMONAMr/Jj/Y6+UucN+KN03fTbeDvWARuSGTp2els2iPg4fMSm01BDSkNGtA==",
            "pub_key": {
                "type": "tendermint/PubKeySecp256k1",
                "value": "AubWE19RlYW3sJZolichLXGu9FP8v00mV3f5/PQqYciO"
            }
        }],
        "memo": ""
    },
    "mode": "block"
}
```
### 启动s3

本地测试 可以通过钱包中的订单启动s3

测试环境生产环境需要下载安装lambda 矿工程序安装包，里面包含了s3

s3 的说明文档 http://docs.lambdastorage.com/S3-Gateway-API/


### s3的sdk和基础api使用
推荐使用minio 创建Bucket，上传、下载文件 

sdk 相关 https://docs.min.io/docs/golang-client-quickstart-guide

目前仅支持 创建Bucket，上传、下载文件 相关接口，其他sdk其他接口s3暂不支持

[调用s3举例](./s3file.js)

```
var Minio = require('minio')
```

```
//初始化
var minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 8091,
    accessKey: 'lambda1',
    secretKey: '123456781',
    signature_version:'s3v4',
    useSSL: false,
});
// 创建bucket
   minioClient.makeBucket('mybucket', '', function(err) {
     if (err) return console.log('Error creating bucket.', err)
     console.log('Bucket created successfully .')
   })

// 获取Buckets
minioClient.listBuckets(function(err, buckets) {
    if (err) return console.log(err)
    console.log('buckets :', buckets)
  })

//上传文件
var fs = require('fs')
var file = './README.md'
var fileStream = Fs.createReadStream(file)
var fileStat = Fs.stat(file, function(err, stats) {
  if (err) {
    return console.log(err)
  }
  minioClient.putObject('mybucket', 'README.md', fileStream, stats.size, function(err, etag) {
    console.log('-----')
    return console.log(err, etag) // err should be null
  })
})
//下载文件
var size = 0;
var data = '';
minioClient.getObject('mybucket', 'README.md', function (err, dataStream) {
  if (err) {
    return console.log(err)
  }
  var myWriteStream = fs.createWriteStream('./README2.md')
  dataStream.pipe(myWriteStream);
  dataStream.on('data', function (chunk) {
    size += chunk.length
  })
  dataStream.on('end', function () {
    console.log('End. Total size = ' + size)
  })
  dataStream.on('error', function (err) {
    console.log(err)
  })

})

```


