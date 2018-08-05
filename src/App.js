import React, { Component } from 'react';
import * as Eos from 'eosjs';
import logo from './logo.svg';
import './App.css';
//Possible tool for testing wallets https://github.com/OracleChain/EOSDevHelper

const floatRegex = /[^\d.-]/g;
//testkeys
const privKeyTest = '5HrZWBGf6ovYBqdDkoGBqzXCKRxyXdkEmke6LVufN3zK4q9Hctc';
const pubKeyTest = 'EOS7Tq7KKKz1UD5mzotQ5Ls3caVpfXKvEDdk4qKx2Xu4Qsr9UBxtW';
const pubKey2Test = 'EOS7pMyqadiD7DE7uZEHuEejZu2Qa7kiMmNVHf35bJEtqyniy8vBG';
const transactionIDtest = 'd4d95c85db899a0e54328b2f0c2e2062f1d7dc4445d04008836367d1c5448298';
const blockNumHintTest = '9100334';

const config = {
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
  //keyProvider: ['MY PRIVATE KEY'],
  keyProvider: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3',
  httpEndpoint: 'https://api.eosnewyork.io:443',
  expireInSeconds: 60,
  // sign the transaction with a private key. Leaving a transaction unsigned avoids the need to provide a private key.
  sign: true,
  //post the transaction to the blockchain. Use false to obtain a fully signed transaction
  broadcast: true,
  verbose: false, //verbose logging such as API activity
};
const eos = Eos(config);

class App extends Component {
  toFloat = str => parseFloat(str.replace(floatRegex, ''));

  fromPrivToPub = wif => {
    const pubKey = Eos.modules.ecc.privateToPublic(wif);
    console.log('PubKey: ', pubKey);
    return pubKey;
  };

  isPubKeyValid = pubKey => {
    const bool = Eos.modules.ecc.isValidPublic(pubKey) === true;
    console.log('is pubKey valid? --> ', bool);
    return bool;
  };

  isPrivKeyValid = privKey => {
    const bool = Eos.modules.ecc.isValidPrivate(privKey) === true;
    console.log('is privKey valid? --> ', bool);
    return bool;
  };

  //seed: 'string' any length string. This is private. The same seed produces the same
  //private key every time. At least 128 random bits should be used to produce a good private key.
  generatePrivKeyFromSeed = seed => Eos.modules.ecc.seedPrivate(seed);

  //EOS public and private keys can be generated off the chain, but EOS users need to create a user
  //name before they can operate on the chain. So activated users are needed to send on-chain transactions
  //to new users in order to help them create accounts. By default users need to find Tripartite help.

  generateRandomPrivKeyP = () =>
    new Promise((resolve, reject) => {
      Eos.modules.ecc.randomKey().then(privateKey => {
        //console.log('random private key: ', privateKey);
        resolve(privateKey);
      });
    });

  generateRandomPrivKey = async () => {
    let output = await this.generateRandomPrivKeyP();
    console.log('random private key: ', output);
    return output;
  };

  //id is the 12 character EOS name aka account name
  getAllAccountBalancesP = (id = 'itamnetwork1') =>
    new Promise((resolve, reject) => {
      eos.getAccount(id, (error, result) => {
        if (error) reject(error);
        resolve(result.total_resources);
      });
    });

  getAllAccountBalances = async (id = 'itamnetwork1') => {
    const result = await this.getAllAccountBalancesP(id);
    let { cpu_weight, net_weight, ram_bytes } = result;
    cpu_weight = this.toFloat(cpu_weight);
    net_weight = this.toFloat(net_weight);
    console.log('CPU weight in EOS: ', cpu_weight);
    console.log('Net weight in EOS: ', net_weight);
    console.log('RAM in KB: ', ram_bytes / 1000);
    return result;
  };

  getAccountNamesFromPubKeyP = (pubKey = pubKeyTest) =>
    new Promise((resolve, reject) => {
      eos.getKeyAccounts(pubKey, (error, result) => {
        if (error) reject(error);
        //console.log(result);
        resolve(result);
        //array of account names, can be multiples
        //output example: { account_names: [ 'itamnetwork1' ] }
      });
    });

  getAccountNamesFromPubKey = async (pubKey = pubKeyTest) => {
    let result = await this.getAccountNamesFromPubKeyP(pubKey);
    console.log('account names: ', result);
    return result;
  };

  //If you look at the result value, you can see an array in the form of a string.
  //This is because there could be tokens with many different symbols in the account. On the EOS testnet, Jungle Net,
  //if you search eosio.token excluding symbol, you can see 2 tokens.
  getCurrencyBalanceP = (
    contractName = 'eosio.token',
    accountName = 'itamnetwork1',
    symbol = 'EOS'
  ) =>
    new Promise((resolve, reject) => {
      eos.getCurrencyBalance(contractName, accountName, symbol, (error, result) => {
        let sum = 0.0;
        if (error) {
          console.log(error);
          return;
        }
        if (result.length === 1)
          console.log('Total EOS balance: ', parseFloat(result[0].replace(floatRegex, '')));
        else {
          for (var i in result) {
            let amount = parseFloat(result[i].replace(floatRegex, ''));
            sum += amount;
            console.log(`Amount of token ${i}: ${amount}`);
          }
          console.log('Total EOS amount: ', sum);
        }
      });
    });

  getCurrencyBalance = async (
    contractName = 'eosio.token',
    accountName = 'itamnetwork1',
    symbol = 'EOS'
  ) => {
    let result = await this.getCurrencyBalanceP(contractName, accountName, symbol);
    console.log('result: ', result);
  };

  getCurrencyStatsP = (contractName = 'eosio.token', symbol = 'EOS') =>
    new Promise((resolve, reject) => {
      eos.getCurrencyStats(contractName, symbol, (error, result) => {
        if (error) reject(error);
        resolve(result);
        //output { EOS: { supply: '1006148640.3388 EOS', max_supply: '10000000000.0000 EOS',
        //         issuer: 'eosio' } }
      });
    });

  getCurrencyStats = async (contractName = 'eosio.token', symbol = 'EOS') => {
    let result = await this.getCurrencyStatsP();
    console.log(result);
    return result;
  };

  getBlockHeightP = () =>
    new Promise((resolve, reject) => {
      eos.getInfo((error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });

  getBlockHeight = async (bool = false) => {
    const result = await this.getBlockHeightP();
    if (bool) console.log('Current block height: ', result.head_block_num);
    return result.head_block_num;
  };

  //TODO: getPubKeyFromAccountName?
  //TODO: testnet
  //TODO: create Account
  //TODO: createTransaction
  //TODO: sign transaction
  //TODO: broadcast transaction

  //TODO: where to get blockNumHint? https://github.com/EOSIO/eosjs/issues/288
  getTransactionP = async (id = transactionIDtest, blockNumHint = blockNumHintTest) =>
    new Promise(async (resolve, reject) => {
      const res = {};
      let blockHeight = await this.getBlockHeight();
      //eos.getScheduledTransactions(json, lowerBound, limit)
      eos.getTransaction(id, blockNumHint, (error, info) => {
        if (error) reject(error);
        //EOS 1 confirmation = 1.5s, irreversible 99%: 4.5s, irreversible 100%: 40sec
        for (var i in info.traces) {
          for (var x in info.traces[i].act.authorization)
            res['Sender / Transaction signed by'] = info.traces[i].act.authorization[x].actor;
          res['Receiver'] = info.traces[i].receipt.receiver;
          res['Smart Contract Owner'] = info.traces[i].act.account;
          res['Message'] = info.traces[i].act.data.message;
          //full data object:
          //console.log('Transaction data', info.traces[i]);
        }
        res['Status'] = info.trx.receipt.status;
        res['Confirmation height'] = blockHeight - info.block_num;
        res['Transaction in block'] = info.block_num;
        res['Transaction time in block'] = info.block_time;
      });
      resolve(res);
    });

  getTransaction = async (id = transactionIDtest, blockNumHint = blockNumHintTest) => {
    let result = await this.getTransactionP(id, blockNumHint);
    console.log('Transaction details: ', result);
    return result;
  };

  getCurrentBlockInfoP = () =>
    new Promise((resolve, reject) => {
      eos.getInfo((error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });
  getCurrentBlockInfo = async () => {
    let result = await this.getCurrentBlockInfoP();
    console.log('get Info:  ', result);
    return result;
  };

  //e.g. binancecleos, itamnetwork1
  getOutgoingTransactionsP = async (accountName = 'itamnetwork1') =>
    new Promise(async (resolve, reject) => {
      const trx = [];
      const actions = (await eos.getActions(accountName)).actions;
      // in case you solely want the standard transactions
      //.filter(a => a.action_trace.act.name === 'transfer')
      actions.map(a => {
        const { from, memo, quantity, to, payer, quant, receiver } = a.action_trace.act.data;
        const { bytes, stake_cpu_quantity, stake_net_quantity, transfer } = a.action_trace.act.data;
        const { name, data } = a.action_trace.act;
        let obj = {};
        //TODO: ask for ALL types:
        // https://eosio.stackexchange.com/questions/1831/getactionsaccountname-possible-names-actions-action-trace-act-name?noredirect=1#comment1698_1831
        if (name === 'transfer')
          obj = {
            ...obj,
            to,
            from,
            quantity: this.toFloat(quantity),
            memo,
          };
        if (name === 'buyram') obj = { ...obj, payer, quant: this.toFloat(quant), receiver };
        if (name === 'buyrambytes') obj = { ...obj, payer, receiver, bytes };
        if (name === 'delegatebw')
          obj = {
            ...obj,
            stake_cpu_quantity: this.toFloat(stake_cpu_quantity), //unit in EOS
            stake_net_quantity: this.toFloat(stake_net_quantity), //unit in EOS
            transfer,
          };
        if (name === 'newaccount')
          obj = { ...obj, creator: data.creator, name: data.name, key: data.active.keys[0].key };
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
      //console.log(trx);
      //console.log(actions);  //unfiltered data;
      resolve(trx);
    });

  getOutgoingTransactions = async height => {
    const result = await this.getOutgoingTransactionsP();
    if (!height) {
      console.log(result);
      return;
    }
    //use 'height' to get all transactions above a specific blockheight
    const aboveHeight = result.filter(a => a.block_num > height);
    console.log(aboveHeight);
    return aboveHeight;
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to simple JS EOS wallet</h1>
          <h3 className="App-sub-title"> made by Marcel Morales</h3>
        </header>
        <div
          onClick={() => this.getTransaction()}
          style={{
            backgroundColor: 'yellow',
            height: 200,
            width: 200,
          }}>
          <h3>Click me</h3>
        </div>
      </div>
    );
  }
}

export default App;
