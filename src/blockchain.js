'use strict';
const SHA256 = require('crypto-js/sha256')
const fs = require('fs')
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction{
    constructor(fromAddress, toAddress, fromName, toName, amount, topic, type, timestamp)
    {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.fromName = fromName;
        this.toName = toName;
        this.amount = amount;
        this.topic = topic;
        this.type = type;
        this.timestamp = Date.now();
    }

    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.fromName + this.toName + this.amount + this.topic + 
            this.type + this.timestamp).toString();
    }

    signTransation(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress)
        {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        if(this.fromAddress === null) return true;

        if(!this.signature || this.signature.length === 0){
            throw new Error('No sinature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block{
    constructor(timestamp, transactions, previousHash = ''){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash(){
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while(this.hash.substring(0, difficulty) != Array(difficulty + 1).join("0")){
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }

    hasValidTransaction(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }

        return true;
    }
}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 0; //Change to 0
    }

    createGenesisBlock(){
        return new Block("01/01/2000", [], "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length -1];
    }

    // addBlock(newBlock){
    //     newBlock.previousHash = this.getLatestBlock().hash;
    //     newBlock.mineBlock(this.difficulty);
    //     this.chain.push(newBlock);
    // }

    minePendingTransactions(miningRewardAddress, minerName){
        const rewardTx = new Transaction(null, miningRewardAddress, null, minerName, this.miningReward, null, "Mine");
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block succsefuly mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    addTransaction(transaction)
    {
        if(!transaction.fromAddress || !transaction.toAddress)
        {
            throw new Error('Transaction must include from and to address');
        }

        if(!transaction.isValid())
        {
            throw new Error('Cannot add invalid transaction to chain')
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address){
        let balance = 0;

        for(const block of this.chain){
            for(const trans of block.transactions){
                if(trans.fromAddress === address)
                {
                    balance -= trans.amount;
                }

                if(trans.toAddress === address){
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    isChainValid(){
        for (let i = 1; i < this.chain.length; i++)
        {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if(!currentBlock.hasValidTransaction()){
                console.log('Invalid Transaction');
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){
                console.log('Invalid Hash');
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash)
            {
                console.log('Invalid Hash2');
                return false;
            }
        }

        return true;
    }

    saveChain(saveChain)
    {
        const data = JSON.stringify(saveChain, null, 4);

        // write JSON string to a file
        fs.writeFile('VotePowerChain.json', data, err => {
            if (err) {
                throw err
            }
            console.log('JSON data is saved.')
        })
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction