const Fabric_Client = require('fabric-client');
const Fabric_CA_Client = require('fabric-ca-client');
const util = require('util');

const getUser = (store_path, user) => {
    const fabric_client = new Fabric_Client();

    return new Promise(async (resolve, reject) => {
        try {
            const state_store = await Fabric_Client.newDefaultKeyValueStore({ path: store_path})

            fabric_client.setStateStore(state_store);
            const crypto_suite = Fabric_Client.newCryptoSuite();

            const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            
            const user_from_store =  await fabric_client.getUserContext(user, true);

            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded '+user+' from persistence');
                resolve({status:true, fabric_client});
            } else
                resolve({status:false});

        } catch(error) {
            console.log(error);
            reject('error');
        }
    });
}

const getAdmin = (store_path) => {
    const fabric_client = new Fabric_Client();

    return new Promise(async (resolve, reject) => {
        try {
            const state_store = await Fabric_Client.newDefaultKeyValueStore({ path: store_path})

            fabric_client.setStateStore(state_store);
            const crypto_suite = Fabric_Client.newCryptoSuite();

            const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            
            var	tlsOptions = {
                trustedRoots: [],
                verify: false
            };
            
            fabric_ca_client = new Fabric_CA_Client(process.env.LEDGER_CA, null , '', crypto_suite);

            const user_from_store =  await fabric_client.getUserContext('admin', true);

            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded '+user_from_store+' from persistence');
                resolve({status:true, fabric_ca_client, user_from_store, fabric_client});
            } else
                resolve({status:false});

        } catch(error) {
            console.log(error);
            reject('error');
        }
    });
}

const getChannel = (fabric_client) => {
    const channel = fabric_client.newChannel(process.env.LEDGER_CHANNEL);
    const peer = fabric_client.newPeer(process.env.LEDGER_PEER);
    channel.addPeer(peer);
    const order = fabric_client.newOrderer(process.env.LEDGER_ORDERER);
    channel.addOrderer(order);
    return channel;
}

const invoke = (fabric_client, invokeFcn, invokeArgs) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!fabric_client || !invokeFcn || !invokeArgs)
                reject('missing arguments');

            const channel = fabric_client.newChannel(process.env.LEDGER_CHANNEL);
            const peer = fabric_client.newPeer(process.env.LEDGER_PEER);
            channel.addPeer(peer);
            const order = fabric_client.newOrderer(process.env.LEDGER_ORDERER);
            channel.addOrderer(order);

            let tx_id = fabric_client.newTransactionID();
            console.log("Assigning transaction_id: ", tx_id._transaction_id);

            const request = {
                //targets: let default to the peer assigned to the client
                chaincodeId: process.env.LEDGER_CHAINCODE_ID,
                fcn: invokeFcn,
                args: invokeArgs,
                chainId: process.env.LEDGER_CHANNEL,
                txId: tx_id
            };
            
            const results = await channel.sendTransactionProposal(request);
            const proposalResponses = results[0];
            const proposal = results[1];
            let isProposalGood = false;

            if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                    isProposalGood = true;
                    console.log('Transaction proposal was good');
            } else {
                console.error('Transaction proposal was bad');
                reject('Transaction proposal was bad');
            }
            
            if (isProposalGood) {
                console.log(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                    proposalResponses[0].response.status, proposalResponses[0].response.message));

                let request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                let transaction_id_string = tx_id.getTransactionID();
                let promises = [];

                let sendPromise = channel.sendTransaction(request);
                promises.push(sendPromise); 
                let event_hub = channel.newChannelEventHub(peer);

                let txPromise = new Promise((resolve, reject) => {
                    let handle = setTimeout(() => {
                        event_hub.unregisterTxEvent(transaction_id_string);
                        event_hub.disconnect();
                        resolve({event_status : 'TIMEOUT'});
                    }, 3000);

                    event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                        clearTimeout(handle);
                        var return_status = {event_status : code, tx_id : transaction_id_string};
                        if (code !== 'VALID') {
                            console.error('The transaction was invalid, code = ' + code);
                            resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                        } else {
                            console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
                            resolve(return_status);
                        }
                    }, (err) => {
                        reject(new Error('There was a problem with the eventhub ::'+err));
                    },
                        {disconnect: true}
                    );
                    event_hub.connect();

                });
                promises.push(txPromise);

                let promiseResult = await Promise.all(promises);
                console.log('Send transaction promise and event listener promise have completed');

                if (promiseResult && promiseResult[0] && promiseResult[0].status === 'SUCCESS') {
                    console.log('Successfully sent transaction to the orderer.');
                } else {
                    console.error('Failed to order the transaction. Error code: ' + promiseResult[0].status);
                }

                if(promiseResult && promiseResult[1] && promiseResult[1].event_status === 'VALID') {
                    console.log('Successfully committed the change to the ledger by the peer');
                    resolve(true);
                } else {
                    reject('Transaction failed to be committed to the ledger due to ::'+promiseResult[1].event_status);
                }
            } else {
                console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
                reject('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            }
        } catch(error) {
            console.log(error);
            reject('error');
        }
    });
}

const queryChainCode = async (fabric_client, invokeFcn, invokeArgs) => {
    const request = {
		//targets : --- letting this default to the peers assigned to the channel
		chaincodeId: process.env.LEDGER_CHAINCODE_ID,
		fcn: invokeFcn,
		args: invokeArgs
	};

    return new Promise(async (resolve, reject) => {
        try {
            const channel = getChannel(fabric_client);
            const query_responses = await channel.queryByChaincode(request);
            
            console.log("Query has completed, checking results");
            
            if (query_responses && query_responses.length == 1) {
                if (query_responses[0] instanceof Error)
                    reject("error from query = " + query_responses[0]);
                else {
                    resolve(query_responses[0].toString());
                }
            } else 
                reject("No payloads were returned from query");
        } catch(err) {
            console.log(err);
            reject('error while query');
        }
    });
}

module.exports = {
    getAdmin,
    getUser,
    getChannel,
    invoke,
    queryChainCode
}