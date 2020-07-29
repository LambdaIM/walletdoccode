var crypto = require('./lib/crypto.js')
var address = require('./lib/address.js')
var privateKey =require('./lib/privateKey.js')

var publicKey =require('./lib/publicKey.js')



var MnemonicUser = `squirrel can parade appear scatter frost resource pen pole category flame rigid uniform cost lava fall rebel rural tunnel involve beyond bomb august bitter`
var userWallet = crypto.getKeysFromMnemonic(MnemonicUser);
console.log('privateKey',userWallet.privateKey.toString('hex'))

var data = privateKey.ExportprivateKey(userWallet.privateKey,'123456')

console.log('en salt ',data.salt.toString('hex'))
console.log('en privateKey ',data.privateKey.toString('hex'))

var udata=  privateKey.importPrivateKey(data.privateKey,data.salt,'123456')

console.log('udata',udata.toString('hex'))

var lambdapub = publicKey.getPublicKey(userWallet.publicKey)
console.log('lambdapub',lambdapub)