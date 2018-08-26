import React, { Component } from 'react';
import * as Eos from 'eosjs';
import logo from './logo.svg';
import './App.css';

const floatRegex = /[^\d.-]/g;

// ----TEST VARIABLES ----
const pubKeyTest = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'; // from privKeyTest, local test net
const pubKeyTest2 = 'EOS7pMyqadiD7DE7uZEHuEejZu2Qa7kiMmNVHf35bJEtqyniy8vBG'; // from 'itamnetwork2' on main net
// const pubKeyTest3 = 'EOS86rDVGVU5UJAeAvDvRNKGJEDMjxGWr9vJBtBzCUW7s6zK2Puqp'

const privKeyTest = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
// const privKeyTest2 = '5HrZWBGf6ovYBqdDkoGBqzXCKRxyXdkEmke6LVufN3zK4q9Hctc'
const exampleTrxMainNet = '87134edc78cf9d1d183e896cbd96c8a89144511b33bce91c82f99321d0d2673a';
const trBlockHeight = 10251887;
const acc1 = 'inita';
const acc2 = 'initb';
const accBinance = 'binancecleos';
const bytes = 8192;
const stake_net_quantity = '10.0000 SYS';
const stake_cpu_quantity = '10.0000 SYS';
const transfer = 0;
const quantityTest = '2.0000 SYS';

//----MAIN NET----
// const config = {
//   chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906', // main net
//   //keyProvider: ['MY PRIVATE KEY'], //used globally for signing transactions
//   keyProvider: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'],
//   httpEndpoint: 'https://api.eosnewyork.io:443', //main net
//   expireInSeconds: 60,
//   sign: true, // sign the transaction with a private key. Leaving a transaction unsigned avoids the need to provide a private key
//   broadcast: true, //post the transaction to the blockchain. Use false to obtain a fully signed transaction
//   verbose: false, //verbose logging such as API activity
// };

//----TEST NET----
const config = {
  keyProvider: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'],
  //sign: true,   // sign the transaction with a private key. Leaving a transaction unsigned avoids the need to provide a private key.
  //broadcast: true,   //post the transaction to the blockchain. Use false to obtain a fully signed transaction
  verbose: false, //verbose logging such as API activity
};

const eos = Eos(config);
const { ecc } = Eos.modules;

class App extends Component {
  getBlockHeightP = () =>
    new Promise((resolve, reject) => {
      eos.getInfo((error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });

  getBlockHeight = async () => {
    const result = await this.getBlockHeightP();
    console.log('current block height: ', result.head_block_num);
    return result.head_block_num;
  };

  getCurrentBlockInfoP = () =>
    new Promise((resolve, reject) => {
      eos.getInfo((error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });

  getCurrentBlockInfo = async () => {
    const result = await this.getCurrentBlockInfoP();
    console.log('current block info: ', result);
    return result;
  };

  //  ---- KEYS ----

  // EOS public and private keys can be generated off the chain, but EOS users need to create a user
  // name before they can operate on the chain. So activated users are needed to send on-chain transactions
  // to new users in order to help them create accounts. By default users need to find Tripartite help.

  generateRandomPrivKeyP = () =>
    new Promise((resolve, reject) => {
      ecc.randomKey().then(privateKey => {
        // console.log('random private key: ', privateKey);
        resolve(privateKey);
      });
    });

  generateRandomPrivKey = async () => {
    const output = await this.generateRandomPrivKeyP();
    console.log('random private key: ', output);
    return output;
  };

  // seed: 'string' any length string. This is private. The same seed produces the same
  // private key every time. At least 128 random bits should be used to produce a good private key.
  generatePrivKeyFromSeed = seed => ecc.seedPrivate(seed);

  fromPrivToPub = wif => {
    const pubKey = ecc.privateToPublic(wif);
    console.log('pubKey: ', pubKey);
    return pubKey;
  };

  isPubKeyValid = pubKey => {
    const bool = ecc.isValidPublic(pubKey) === true;
    console.log('is pubKey valid? --> ', bool);
    return bool;
  };

  isPrivKeyValid = privKey => {
    const bool = ecc.isValidPrivate(privKey) === true;
    console.log('is privKey valid? --> ', bool);
    return bool;
  };

  //  ---- ACCOUNTS ----
  getAccountNamesFromPubKeyP = pubKey =>
    new Promise((resolve, reject) => {
      eos.getKeyAccounts(pubKey, (error, result) => {
        if (error) reject(error);
        resolve(result);
        // array of account names, can be multiples
        // output example: { account_names: [ 'itamnetwork1', ... ] }
      });
    });

  // main net only:
  getAccountNamesFromPubKey = async pubKey => {
    const result = await this.getAccountNamesFromPubKeyP(pubKey);
    console.log('account names from pubKey: ', result);
    return result;
  };

  // id is the 12 character EOS name aka account name
  getAccSystemStatsP = id =>
    new Promise((resolve, reject) => {
      eos.getAccount(id, (error, result) => {
        if (error) reject(error);
        resolve(result.total_resources);
      });
    });

  //  main net only: (i.e. 'binancecleos'):
  getAccSystemStats = async id => {
    try {
      const result = await this.getAccSystemStatsP(id);
      // console.log(result); //whole object
      let { cpu_weight, net_weight, ram_bytes } = result;
      if (cpu_weight != null) cpu_weight = this.toFloat(cpu_weight);
      if (net_weight != null) net_weight = this.toFloat(net_weight);
      console.log(`account infos for ${id}:`);
      console.log('CPU weight in EOS: ', cpu_weight);
      console.log('net weight in EOS: ', net_weight);
      console.log('RAM in KB: ', ram_bytes / 1000);
      return result;
    } catch (error) {
      console.log(
        `no account-system-stats found for ${id}.\n` +
          'Make sure you are connected to the main net and the account name was spelled correctly'
      );
    }
  };

  //  account name must be less than 13 characters
  //  can only contain the following symbols: .12345abcdefghijklmnopqrstuvwxyz:
  //  default: bytes = 8192, stake_net_quantity = '10.0000 SYS', stake_cpu_quantity = '10.0000 SYS', transfer = 0:
  //  ownerPubKey and activePubKey can be the same, but is less secure
  //  optional: bytes, stake_net_quantity, stake_cpu_quantity, transfer
  createAccountPackage = async (
    ownerPubKey,
    activePubKey,
    name,
    bytes = 8192,
    stake_net_quantity = '10.0000 SYS',
    stake_cpu_quantity = '10.0000 SYS',
    transfer = 0
  ) => {
    const tr = await eos.transaction(tr => {
      tr.newaccount({
        creator: 'eosio',
        name,
        owner: ownerPubKey,
        active: activePubKey,
      });

      tr.buyrambytes({
        payer: 'eosio',
        receiver: name,
        bytes,
      });

      tr.delegatebw({
        from: 'eosio', // acc_name
        receiver: name,
        stake_net_quantity,
        stake_cpu_quantity,
        transfer,
      });
    });
    console.log('createAccountPackage tr: ', tr);
  };

  // Must be less than 13 characters
  // Can only contain the following symbols: .12345abcdefghijklmnopqrstuvwxyz
  // args: 'accountName', ownerPubKey, activePubKey
  createSingleAccount = async (name, ownerPubKey, activePubKey) => {
    const tr = await eos.transaction(tr => {
      tr.newaccount({
        creator: 'eosio', // account_name
        name, // new account name
        owner: ownerPubKey, // owner pubkey
        active: activePubKey, // active pubkey
      });
    });
    console.log('createSingleAccount tr: ', tr);
    return tr;
  };

  //  ---- TRANSACTIONS ----

  //  sender, receiver, quantity in format: '50.0000 SYS' , memo, | + optional: sign = true, broadcast = true
  transfer = async (from, to, quantity, memo = '', sign = true, broadcast = true) => {
    const tr = await eos.transfer(from, to, quantity, memo, { broadcast, sign });
    console.log('created transaction: ', tr);
    return tr.transaction;
  };

  //  first creates an unsigned transaction, signs it and then broadcasts it. All separately. See logs()
  transferSignPushTransaction = async (from, to, quantity, memo = '') => {
    // creates 1) unsigned transaction 2) signs 3) broadcasts tr
    const tr = await eos.transfer(from, to, quantity, memo, { broadcast: false, sign: false });
    console.log('created unsigned tr: ', tr);
    const signedTr = await this.signTr(tr, from, to, quantity, memo);
    await this.pushTransaction(signedTr.transaction);
  };

  //  just signs the transaction and returns it:
  //  returns signature. Args: (from, to, quantity, memo = '')
  getSignature = async (from, to, quantity, memo = '') => {
    // returns promise:
    const tr = await eos.transfer(from, to, quantity, memo, { broadcast: false });
    console.log('created signature: ', tr.transaction.signatures[0]);
    return tr.transaction.signatures[0];
  };

  //  signs transaction and returns it. Args: (transaction, from, to, quantity, memo = '')
  signTr = async (tr, from, to, quantity, memo = '') => {
    const sig = await this.getSignature(from, to, quantity, memo);
    tr.transaction.signatures.push(sig);
    return tr;
  };

  //  insert return value from eos.transfer(..., signed = true, broadcast = false);
  pushTransaction = async tr => {
    const pushed = await eos.pushTransaction(tr);
    console.log('broadcasted transaction: ', pushed);
  };

  // e.g. binancecleos, itamnetwork1
  getOutgoingTransactionsP = async accountName =>
    new Promise(async (resolve, reject) => {
      const trx = [];
      const actions = (await eos.getActions(accountName)).actions;
      // in case you solely want the standard transactions
      // .filter(a => a.action_trace.act.name === 'transfer')
      actions.map(a => {
        const { from, memo, quantity, to, payer, quant, receiver } = a.action_trace.act.data;
        const { bytes, stake_cpu_quantity, stake_net_quantity, transfer } = a.action_trace.act.data;
        const { name, data } = a.action_trace.act;
        let obj = {};
        if (name === 'transfer') {
          obj = {
            ...obj,
            to,
            from,
            quantity: this.toFloat(quantity),
            memo,
          };
        } else if (name === 'buyram') obj = { ...obj, payer, quant: this.toFloat(quant), receiver };
        else if (name === 'buyrambytes') obj = { ...obj, payer, receiver, bytes };
        else if (name === 'delegatebw') {
          obj = {
            ...obj,
            stake_cpu_quantity: this.toFloat(stake_cpu_quantity), // unit in EOS
            stake_net_quantity: this.toFloat(stake_net_quantity), // unit in EOS
            transfer,
          };
        } else if (name === 'newaccount') {
          obj = { ...obj, creator: data.creator, name: data.name, key: data.active.keys[0].key };
        } else {
          // https://eosio.stackexchange.com/questions/1831/getactionsaccountname-possible-names-actions-action-trace-act-name?noredirect=1#comment1698_1831
          // if not any of the mainly used transaction types, return whole object
          return actions;
        }
        obj = {
          ...obj,
          transaction_ID: a.action_trace.trx_id,
          block_time: a.block_time,
          block_num: a.block_num,
          trx_type: name,
        };
        trx.push(obj);
        return a.action_trace.act;
      });
      // console.log(trx);
      // console.log(actions);  //unfiltered data;
      resolve(trx);
    });

  //  accountName, (+ int allAboveBlockHeightX --> optional)
  getOutgoingTransactions = async (accountName, height) => {
    const result = await this.getOutgoingTransactionsP(accountName);
    if (!height) {
      console.log(`outgoing transactions of ${accountName}: `, result);
      return result;
    }
    // use 'height' to get all transactions above a specific block height
    const aboveHeight = result.filter(a => a.block_num > height);
    console.log(`outgoing transactions of ${accountName} above block ${height}: `, aboveHeight);
    return aboveHeight;
  };

  getTransactionP = async (id, blockNumHint) =>
    new Promise(async (resolve, reject) => {
      const blockHeight = await this.getBlockHeight();
      await eos.getTransaction(id, blockNumHint, (error, info) => {
        const res = {};
        if (error) reject(error);
        // Transactions can be considered confirmed with 99.9% certainty after an average of 0.25 seconds from time of broadcast.
        // The EOS aBFT algorithm provides 100% confirmation of irreversibility within 1 second.
        for (var i in info.traces) {
          for (var x in info.traces[i].act.authorization) {
            res['sender'] = info.traces[i].act.authorization[x].actor;
          }
          res['receiver'] = info.traces[i].receipt.receiver;
          res['smart contract owner'] = info.traces[i].act.account;
          res['message'] = info.traces[i].act.data.message;
          // full data object:
          // console.log('Transaction data', info.traces[i]);
        }
        res['status'] = info.trx.receipt.status;
        res['confirmation height'] = blockHeight - info.block_num;
        res['transaction in block'] = info.block_num;
        res['transaction time in block'] = info.block_time;
        resolve(res);
      });
    });

  //  get transaction info. Optionally with a block number hint (trBlockHeight)
  //  note: example tr only visible when switching to main net
  getTransaction = async (id, blockNumHint) => {
    const result = await this.getTransactionP(id, blockNumHint);
    console.log('transaction details: ', result);
    return result;
  };

  isTransactionExecutedP = async (id, blockNumHint) =>
    new Promise(async (resolve, reject) => {
      await eos.getTransaction(id, blockNumHint, (error, info) => {
        if (error) reject(error);
        resolve(info.trx.receipt.status === 'executed');
      });
    });

  isTransactionExecuted = async (id, blockNumHint) => {
    const executed = await this.isTransactionExecutedP(id, blockNumHint);
    console.log(`transaction: ${id} \nwas executed: ${executed}`);
    return executed;
  };

  //  ---- CURRENCY ----

  // If you look at the result value, you can see an array in the form of a string.
  // This is because there could be tokens with many different symbols in the account
  getCurrencyBalanceP = (accountName, contractName = 'eosio.token') =>
    new Promise((resolve, reject) => {
      eos.getCurrencyBalance(contractName, accountName, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    });

  getCurrencyBalance = async (accountName, contractName = 'eosio.token') => {
    const result = await this.getCurrencyBalanceP(accountName, contractName);
    console.log(`balance of ${accountName}: `, result);
  };

  getCurrencyStatsP = (symbol, contractName) =>
    new Promise((resolve, reject) => {
      eos.getCurrencyStats(contractName, symbol, (error, result) => {
        if (error) reject(error);
        resolve(result);
        // output { EOS: { supply: '1006148640.3388 EOS', max_supply: '10000000000.0000 EOS',
        //         issuer: 'eosio' } }
      });
    });

  // works for tokens as well, see https://github.com/eoscafe/eos-airdrops
  // 'SYMBOL', 'eos.contractName'
  getCurrencyStats = async (symbol, contractName = 'eosio.token') => {
    const result = await this.getCurrencyStatsP(symbol, contractName);
    console.log(result);
    return result;
  };

  //  amount in format '1000.0000 XYZ', receiver, memo:
  createToken = async (amountNsymbol, to, memo = '') => {
    await eos.transaction('eosio.token', acc => {
      // Create the initial token with its max supply
      // const options = {authorization: 'acc', broadcast: true, sign: true} // default
      // OR const options = [{"actor":"eosio.token","permission":"active"}] //default (API log)
      // according to eosio_token.json no arg reserved for 'name'
      acc.create('eosio.token', amountNsymbol); //, options)

      // Issue some of the max supply for circulation into an arbitrary account
      acc.issue('eosio.token', amountNsymbol, 'issue');
      acc.transfer('eosio.token', to, amountNsymbol, memo);
    }); // }, options)
    const balance = await eos.getCurrencyBalance('eosio.token', to);
    console.log(`currency balance ${to}: `, balance);
    const balance2 = await eos.getCurrencyBalance('eosio.token', 'eosio.token');
    console.log('currency balance eosio.token: ', balance2);
  };

  //  ---- OTHER ----
  //  converts '1.3000 EOS' --> 1.3, see floatRegex in eosjs.js
  toFloat = str => parseFloat(str.replace(floatRegex, ''));

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to simple JS EOS wallet</h1>
          <h3 className="App-sub-title"> made by Marcel Morales. Check ./App.js</h3>
        </header>
        <div
          onClick={() =>
            this.transferSignPushTransaction('inita', 'initb', '2.0000 SYS', 'hello', privKeyTest)
          }
          style={{
            backgroundColor: 'yellow',
            height: 100,
            width: 100,
          }}>
          <h3>Main fct</h3>
        </div>
        <div
          onClick={() => this.getTransaction(exampleTrxMainNet)}
          style={{
            backgroundColor: 'red',
            height: 100,
            width: 100,
          }}>
          <h3>getTransaction</h3>
        </div>
        <div
          onClick={() => this.createToken('10000.0000 ABC', acc1, 'new token memo')}
          style={{
            backgroundColor: 'blue',
            height: 100,
            width: 100,
          }}>
          <h3>createToken</h3>
        </div>
      </div>
    );
  }
}
export default App;
