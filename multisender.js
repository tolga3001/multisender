const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const Common = require('ethereumjs-common');
const PromisePool = require('es6-promise-pool');

const bscRpcEndpoint = 'wss://bsc.publicnode.com';
const senderPrivateKeys = [
  //private keys '0xas23423jk423jkl42jk342lk34','0xj4kjk43j3k43lkj43823h3', 
  
 
];
const receiverAddress = '';// write receiver adrress here
const bnbAmount = 1;// bnbAmount 

const gasPrice = 12; // const gasPrice value

const common = Common.default.forCustomChain(
  'mainnet',
  {
    name: 'bsc',
    networkId: 56,
    chainId: 56,
  },
  'petersburg'
);

const web3 = new Web3(bscRpcEndpoint);

async function sendTransaction(privateKey) {
  const senderAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

  const nonce = await web3.eth.getTransactionCount(senderAddress);

  const gasEstimate = await web3.eth.estimateGas({
    to: receiverAddress,
    from: senderAddress,
    value: web3.utils.toHex(web3.utils.toWei(bnbAmount.toString(), 'ether'))
  });
  console.log('Automatic gas estimation:', gasEstimate);

  
  const gasLimit = gasEstimate + 100000; 
  console.log('Automatic gas limit:', gasLimit);

  const rawTransaction = {
    from: senderAddress,
    to: receiverAddress,
    value: web3.utils.toHex(web3.utils.toWei(bnbAmount.toString(), 'ether')),
    gasPrice: web3.utils.toHex(gasPrice * 1e9), r
    nonce: web3.utils.toHex(nonce),
    gasLimit: web3.utils.toHex(gasLimit),
    chainId: common.chainId,
  };

  const privateKeyBuffer = Buffer.from(privateKey.replace('0x', ''), 'hex');
  const tx = new Tx.Transaction(rawTransaction, { common });
  tx.sign(privateKeyBuffer);

  const serializedTx = tx.serialize();
  const serializedTxHex = '0x' + serializedTx.toString('hex');

  let receipt;
  let retryCount = 0;
  const maxRetries = 10;

  
  while (!receipt && retryCount < maxRetries) {
    try {
      receipt = await web3.eth.sendSignedTransaction(serializedTxHex);
      console.log(`Transaction sent from ${senderAddress} to ${receiverAddress}. Transaction hash: ${receipt.transactionHash}`);
    } catch (error) {
      console.error(`Error sending transaction: ${error.message || error}`);
      retryCount++;
      console.log(`Retrying (${retryCount}/${maxRetries})...`);
      
    }
  }

  if (!receipt) {
    console.error(`Transaction failed after ${maxRetries} retries.`);
  }
}

async function sendTransactions() {
  const concurrency = 5; 

  const sendTransactionGenerator = function* () {
    for (const privateKey of senderPrivateKeys) {
      yield sendTransaction(privateKey);
    }
  };

  const pool = new PromisePool(sendTransactionGenerator(), concurrency);

  await pool.start();
  console.log('All operations completed.');
}

async function main() {
  try {
    await sendTransactions();
  } catch (error) {
    console.error('An error occurred:', error.message || error);
  }
}


main();
