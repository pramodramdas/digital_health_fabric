const HealthCare  = require('../contracts/test_contract');
const { ChaincodeMockStub, Transform } = require("@theledger/fabric-mock-stub");
const test_users = require('./test_users');

const chaincode = new HealthCare();

const init_query = async () => {

    const mockStub = new ChaincodeMockStub("MyMockStub", chaincode, test_users.patient1);

    let response = await mockStub.mockInit("init", []);

    response = await mockStub.mockInvoke("registerPatient", ["registerPatient","patient1","21"]);

    mockStub.usercert = test_users.patient2;
    response = await mockStub.mockInvoke("registerPatient", ["registerPatient","patient2","21"]);
    mockStub.usercert = test_users.patient3;
    response = await mockStub.mockInvoke("registerPatient", ["registerPatient","patient3","23"]);
    mockStub.usercert = test_users.patient4;
    response = await mockStub.mockInvoke("registerPatient", ["registerPatient","patient4","24"]);
    
    mockStub.usercert = test_users.doctor1; 
    response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor1"]);
    mockStub.usercert = test_users.doctor2; 
    response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor2"]);
    mockStub.usercert = test_users.doctor3; 
    response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor3"]);
    mockStub.usercert = test_users.doctor4; 
    response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor4"]);
    mockStub.usercert = test_users.doctor5; 
    response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor5"]);

    mockStub.usercert = test_users.patient1;
    response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor1"]);
    mockStub.usercert = test_users.patient2;
    response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor1"]);
    response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor2"]);
    mockStub.usercert = test_users.patient3;
    response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor2"]);
    mockStub.usercert = test_users.patient4;
    response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor4"]);

    queryByRange(mockStub);
    queryByPartialKey(mockStub);
    historyQuery(mockStub);
}


const historyQuery = async (mockStub) => {
    let resultsIterator = await mockStub.getHistoryForKey('patient1');

    while (true) {
        let res = await resultsIterator.next();
        let jsonRes = {};
        if (res.value && res.value.value.toString()) {
            jsonRes.TxId = res.value.tx_id;
            jsonRes.Timestamp = res.value.timestamp;
            jsonRes.IsDelete = res.value.is_delete.toString();
            try {
                jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                console.log(jsonRes);
            } catch (err) {
                console.log(err);
                jsonRes.Value = res.value.value.toString('utf8');
            }
        }
        if (res.done) {
            console.log('end of historyQuery data');
            await resultsIterator.close();
            break;
        }
    }
}

const queryByPartialKey = async (mockStub) => {
    let resIterator = await mockStub.getStateByPartialCompositeKey('age~name', ["21"]);
    
    while(true) {
        let responseRange = await resIterator.next();

        if (!responseRange || !responseRange.value || !responseRange.value.key) {
            console.log('empty of queryByPartialKey');
            break;
        }

        let { objectType, attributes } = await mockStub.splitCompositeKey(responseRange.value.key)
        console.log('objectType',objectType);
        console.log('attributes',attributes);
        if (responseRange.done) {
            console.log('end of queryByPartialKey data');
            await resIterator.close();
            break;
        }
    }
}

const queryByRange = async (mockStub) => {
    let iterator = await mockStub.getStateByRange("doctor2", "doctor4");

    while (true) {
        let res = await iterator.next();
        if (res.value && res.value.value.toString()) {
            console.log(res.value.value.toString('utf8'));
        }
        if (res.done) {
            console.log('end of queryByRange data');
            await iterator.close();
            break;
        }
    }
}

init_query();
