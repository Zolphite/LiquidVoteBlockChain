const {Blockchain, Transaction} = require('./blockchain')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('26a42458aa7916d1c76226569726f246a4c5c51cc227015d43be9c3c3d13a165')
const walletAddress = myKey.getPublic('hex');

let saveVotePower = new Blockchain();

const tx1 = new Transaction(walletAddress, 'Cult001publickey', 'Zolphite', 'CultLeader', 1, 'Legalize it?', 'transfer');
tx1.signTransation(myKey);
console.log("Transfer 1 vote to Cultleader from Zolphite");
saveVotePower.addTransaction(tx1);

console.log("Start Mining");

saveVotePower.minePendingTransactions(walletAddress, 'Zolphite');

console.log('\nBalance of Zolphite is', saveVotePower.getBalanceOfAddress(walletAddress));
console.log('Balance of CultLeader is', saveVotePower.getBalanceOfAddress('Cult001publickey'));

console.log('is chain valid?', saveVotePower.isChainValid());

console.log('\nChanging 1 link in chain(Giving Zolphite 200 votes by changing previous blocks transaction)');

saveVotePower.chain[1].transactions[0].amount = -200;

console.log('Balance of Zolphite is', saveVotePower.getBalanceOfAddress(walletAddress));
console.log('Balance of CultLeader is', saveVotePower.getBalanceOfAddress('Cult001publickey'));

console.log('is chain valid?', saveVotePower.isChainValid());

saveVotePower.saveChain(saveVotePower);