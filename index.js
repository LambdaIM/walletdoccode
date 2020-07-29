const axios = require('axios');

var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')
var publicKey =require('./lib/publicKey.js')

var Mnemonic = crypto.generateRandomMnemonic(256);
var wallet = crypto.getKeysFromMnemonic(Mnemonic)

console.log('Mnemonic:',Mnemonic)
console.log('publicKey:',wallet.publicKey.toString('base64'))
console.log('privateKey:',wallet.privateKey.toString('base64'))


var lambdaaddress = address.getAddress(wallet.publicKey)
console.log('address:',lambdaaddress)
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
    console.log(error.data);
  });

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

  var lambdapubkey = publicKey.getPublicKey(userWallet.publicKey);
  
  console.log('lambdapubkey',lambdapubkey)

