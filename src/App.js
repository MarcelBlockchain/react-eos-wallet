import React, { Component } from 'react';
import * as Eos from 'eosjs';
import logo from './logo.svg';
import './App.css';

const floatRegex = /[^\d.-]/g;
//testkeys
//const privKeyTest = '5HrZWBGf6ovYBqdDkoGBqzXCKRxyXdkEmke6LVufN3zK4q9Hctc';
//const pubKey2Test = 'EOS7pMyqadiD7DE7uZEHuEejZu2Qa7kiMmNVHf35bJEtqyniy8vBG';
const pubKeyTest = 'EOS7Tq7KKKz1UD5mzotQ5Ls3caVpfXKvEDdk4qKx2Xu4Qsr9UBxtW';
const transactionIDtest = 'd4d95c85db899a0e54328b2f0c2e2062f1d7dc4445d04008836367d1c5448298';
const blockNumHintTest = '9100334';

const config = {
  //chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906', // public net
  //chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f', //test net
  //keyProvider: ['MY PRIVATE KEY'], //used globally for signing transactions
  keyProvider: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'],
  //httpEndpoint: 'https://api.eosnewyork.io:443',
  //expireInSeconds: 60,
  //sign: true,   // sign the transaction with a private key. Leaving a transaction unsigned avoids the need to provide a private key.
  //broadcast: true,   //post the transaction to the blockchain. Use false to obtain a fully signed transaction
  verbose: true, //verbose logging such as API activity
};
const eos = Eos(config);
const { ecc } = Eos.modules;

class App extends Component {
  toFloat = str => parseFloat(str.replace(floatRegex, ''));

  fromPrivToPub = wif => {
    const pubKey = ecc.privateToPublic(wif);
    console.log('PubKey: ', pubKey);
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

  //seed: 'string' any length string. This is private. The same seed produces the same
  //private key every time. At least 128 random bits should be used to produce a good private key.
  generatePrivKeyFromSeed = seed => ecc.seedPrivate(seed);

  //EOS public and private keys can be generated off the chain, but EOS users need to create a user
  //name before they can operate on the chain. So activated users are needed to send on-chain transactions
  //to new users in order to help them create accounts. By default users need to find Tripartite help.

  generateRandomPrivKeyP = () =>
    new Promise((resolve, reject) => {
      ecc.randomKey().then(privateKey => {
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
  getAccSystemStatsP = (id = 'itamnetwork1') =>
    new Promise((resolve, reject) => {
      eos.getAccount(id, (error, result) => {
        if (error) reject(error);
        resolve(result.total_resources);
      });
    });

  getAccSystemStats = async (id = 'itamnetwork1') => {
    const result = await this.getAccSystemStatsP(id);
    //let { cpu_weight, net_weight, ram_bytes } = result;
    if (result.cpu_weight != null) result.cpu_weight = this.toFloat(result.cpu_weight);
    if (result.net_weight) result.net_weight = this.toFloat(result.net_weight);
    console.log('CPU weight in EOS: ', result.cpu_weight);
    console.log('Net weight in EOS: ', result.net_weight);
    console.log('RAM in KB: ', result.ram_bytes / 1000);
    return result;
  };

  getAccountNamesFromPubKeyP = (pubKey = pubKeyTest) =>
    new Promise((resolve, reject) => {
      eos.getKeyAccounts(pubKey, (error, result) => {
        if (error) reject(error);
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
  //This is because there could be tokens with many different symbols in the account
  getCurrencyBalanceP = (accountName = 'itamnetwork1', contractName = 'eosio.token') =>
    new Promise((resolve, reject) => {
      eos.getCurrencyBalance(contractName, accountName, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    });

  getCurrencyBalance = async (accountName = 'itamnetwork1', contractName = 'eosio.token') => {
    let result = await this.getCurrencyBalanceP(accountName, contractName);
    console.log(`Balance of ${accountName}: `, result);
  };

  getCurrencyStatsP = (symbol = 'EOS', contractName = 'eosio.token') =>
    new Promise((resolve, reject) => {
      eos.getCurrencyStats(symbol, contractName, (error, result) => {
        if (error) reject(error);
        resolve(result);
        //output { EOS: { supply: '1006148640.3388 EOS', max_supply: '10000000000.0000 EOS',
        //         issuer: 'eosio' } }
      });
    });

  getCurrencyStats = async (symbol = 'EOS', contractName = 'eosio.token') => {
    let result = await this.getCurrencyStatsP(symbol, contractName);
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

  getBlockHeight = async (print = false) => {
    const result = await this.getBlockHeightP();
    if (print) console.log('Current block height: ', result.head_block_num);
    return result.head_block_num;
  };

  //TODO: where to get blockNumHint? https://github.com/EOSIO/eosjs/issues/288
  getTransactionP = async (id = transactionIDtest, blockNumHint = blockNumHintTest) =>
    new Promise(async (resolve, reject) => {
      const res = {};
      let blockHeight = await this.getBlockHeight();
      eos.getTransaction(id, blockNumHint, (error, info) => {
        if (error) reject(error);
        // Transactions can be considered confirmed with 99.9% certainty after an average of 0.25 seconds from time of broadcast.
        // The EOS aBFT algorithm provides 100% confirmation of irreversibility within 1 second.
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
        // https://eosio.stackexchange.com/questions/1831/getactionsaccountname-possible-names-actions-action-trace-act-name?noredirect=1#comment1698_1831
        //TODO: if not any of these below, just return the whole object. Double check node_modules/eosjs/lib/schema/eosio_system.json
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

  getOutgoingTransactions = async (accountName, height) => {
    const result = await this.getOutgoingTransactionsP(accountName);
    if (!height) {
      console.log(result);
      return result;
    }
    //use 'height' to get all transactions above a specific block height
    const aboveHeight = result.filter(a => a.block_num > height);
    console.log(aboveHeight);
    return aboveHeight;
  };

  createAccount = (pubKey, name) => {
    eos.transaction(tr => {
      tr.newaccount({
        creator: 'eosio', //acc_name, see createAccount2()
        name,
        owner: pubKey,
        active: pubKey,
      });

      tr.buyrambytes({
        payer: 'eosio',
        receiver: name,
        bytes: 8192,
      });

      tr.delegatebw({
        from: 'eosio', //acc_name
        receiver: name,
        stake_net_quantity: '10.0000 SYS',
        stake_cpu_quantity: '10.0000 SYS',
        transfer: 0,
      });
    });
  };

  //Must be less than 13 characters
  //Can only contain the following symbols: .12345abcdefghijklmnopqrstuvwxyz

  createAccount2 = (creator, name, ownerPubKey, activePubKey) => {
    eos.transaction(tr => {
      tr.newaccount({
        creator: 'eosio', //account_name
        name: 'mocnemsnwzp4', //new account name
        owner: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV', //owner pubkey
        active: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV', //active pubkey
      });
    });
  };

  //TODO: sign transaction

  transfer = async (from, to, amount, memo = '', sign = true, broadcast = true) => {
    const options = {
      //authorization: `${from}@active`, //@active for activeKey, @owner for Owner key
      //default authorizations will be calculated.
      broadcast,
      sign,
    };

    const transaction = await eos.transaction(
      'eosio.token',
      acc => {
        acc.transfer(from, to, amount, memo);
      },
      options
    );
    console.log(transaction);
    this.setState({ data: transaction.transaction });
    return transaction.transaction;
  };

  pushTransaction = async txrID => {
    const pushed = await eos.pushTransaction(this.state.data);
    console.log('pushed: ', pushed);
  };

  createToken = async (amountNsymbol, to, memo = '') => {
    await eos.transaction('eosio.token', acc => {
      // Create the initial token with its max supply
      // const options = {authorization: 'acc', broadcast: true, sign: true} // default
      // OR const options = [{"actor":"eosio.token","permission":"active"}] //default (API log)

      acc.create('eosio.token', amountNsymbol); //, options)
      //according to eosio_token.json no arg reserved for 'name'

      // Issue some of the max supply for circulation into an arbitrary account
      acc.issue('eosio.token', amountNsymbol, 'issue');
      acc.transfer('eosio.token', to, '5000.000 LLL', memo);
    }); //options
    const balance = await eos.getCurrencyBalance('eosio.token', to);
    console.log(`Currency balance ${to}: `, balance);
    const balance2 = await eos.getCurrencyBalance('eosio.token', 'eosio.token');
    console.log('Currency balance eosio.token: ', balance2);
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to simple JS EOS wallet</h1>
          <h3 className="App-sub-title"> made by Marcel Morales. Check ./App.js</h3>
        </header>
        <div
          onClick={() => this.generateRandomPrivKey()}
          style={{
            backgroundColor: 'yellow',
            height: 100,
            width: 100,
          }}>
          <h3>Main fct</h3>
        </div>
        <div
          onClick={() =>
            this.getAccountNamesFromPubKey('EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV')
          }
          style={{
            backgroundColor: 'red',
            height: 100,
            width: 100,
          }}>
          <h3>getAccountNamesFromPubKey</h3>
        </div>
        <div
          onClick={() => this.transfer('inita', 'initb', '2.0000 SYS', 'memo', false, false)}
          style={{
            backgroundColor: 'blue',
            height: 100,
            width: 100,
          }}>
          <h3>Transfer</h3>
        </div>
      </div>
    );
  }
}
export default App;
