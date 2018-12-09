const HealthCare  = require('../contracts/test_contract');
const { ChaincodeMockStub, Transform } = require("@theledger/fabric-mock-stub");

const patientCert = '-----BEGIN CERTIFICATE-----' +
    'MIICljCCAj2gAwIBAgIUT/03xzDBg3H3cYfcr+aSvFOfXGQwCgYIKoZIzj0EAwIw' +
    'czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh' +
    'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT' +
    'E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgxMDA2MTM0NDAwWhcNMTkxMDA2MTM0' +
    'OTAwWjBGMTEwDgYDVQQLEwdwYXRpZW50MAsGA1UECxMEb3JnMTASBgNVBAsTC2Rl' +
    'cGFydG1lbnQxMREwDwYDVQQDEwhwYXRpZW50NTBZMBMGByqGSM49AgEGCCqGSM49' +
    'AwEHA0IABNsXnEDX1zaFHCM6KdZCk3reUKXFeyEs8GsdOvnGkA97n/JB+NOzXsgX' +
    'bQilkFo9jHkD0r9meJLcgR77YDswvmijgdswgdgwDgYDVR0PAQH/BAQDAgeAMAwG' +
    'A1UdEwEB/wQCMAAwHQYDVR0OBBYEFGgasEQ1cEun9NmwbR4gbk0Itf5DMCsGA1Ud' +
    'IwQkMCKAIEI5qg3NdtruuLoM2nAYUdFFBNMarRst3dusalc2Xkl8MGwGCCoDBAUG' +
    'BwgBBGB7ImF0dHJzIjp7ImhmLkFmZmlsaWF0aW9uIjoib3JnMS5kZXBhcnRtZW50' +
    'MSIsImhmLkVucm9sbG1lbnRJRCI6InBhdGllbnQ1IiwiaGYuVHlwZSI6InBhdGll' +
    'bnQifX0wCgYIKoZIzj0EAwIDRwAwRAIgYzHb6mBwrS7eMMv8L5K2xmy4LtwskKCO' +
    's/1fQcG/vqMCICwWyHFfYTqO6mRtAy/2mJeEyeXXqSQipSDSXhy4EsDV' +
    '-----END CERTIFICATE-----';


const doctorCert = '-----BEGIN CERTIFICATE-----' +
    'MIICkzCCAjmgAwIBAgIUdIa/se92PvvOHRbacnhTJQasmlUwCgYIKoZIzj0EAwIw' +
    'czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh' +
    'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT' +
    'E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgxMDA2MTAzMjAwWhcNMTkxMDA2MTAz' +
    'NzAwWjBEMTAwDQYDVQQLEwZkb2N0b3IwCwYDVQQLEwRvcmcxMBIGA1UECxMLZGVw' +
    'YXJ0bWVudDExEDAOBgNVBAMTB2RvY3RvcjUwWTATBgcqhkjOPQIBBggqhkjOPQMB' +
    'BwNCAAThUzTInOHaRyu+00IzyVn7QKUDNti/wbIjsrdArn4rRZVqYqoAZYDnZfvj' +
    'ilynxx7KNzH5i2DuxNhdKB5rO0Szo4HZMIHWMA4GA1UdDwEB/wQEAwIHgDAMBgNV' +
    'HRMBAf8EAjAAMB0GA1UdDgQWBBRoHDpHuq9ZWS6k7OqWvWos9G1ASzArBgNVHSME' +
    'JDAigCBCOaoNzXba7ri6DNpwGFHRRQTTGq0bLd3brGpXNl5JfDBqBggqAwQFBgcI' +
    'AQReeyJhdHRycyI6eyJoZi5BZmZpbGlhdGlvbiI6Im9yZzEuZGVwYXJ0bWVudDEi' +
    'LCJoZi5FbnJvbGxtZW50SUQiOiJkb2N0b3I1IiwiaGYuVHlwZSI6ImRvY3RvciJ9' +
    'fTAKBggqhkjOPQQDAgNIADBFAiEAh9zDekt9zHOtZx555Z1qG/dwlyRJukZ8ysUS' +
    'P2WC23oCIAV4ZjVNF9rlypyK0Vv5l9wZ78vhlOFJ660Ncr8soosT' +
    '-----END CERTIFICATE-----';

// You always need your chaincode so it knows which chaincode to invoke on
const chaincode = new HealthCare();

const call_init = async () => {

    const mockStub = new ChaincodeMockStub("MyMockStub", chaincode, patientCert);
    // console.log(mockStub);
    let response = await mockStub.mockInit("init", []);
    console.log(response.payload.toString("utf-8"));

    //register patient
    console.log('registering patient');
    response = await mockStub.mockInvoke("registerPatient", ["registerPatient","patient5","20"]);
    console.log(response.payload.toString("utf-8"));

    //change certificate to doctor
    mockStub.usercert = doctorCert;

    //register doctor
    console.log('registering doctor');
    response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor5"]);
    console.log(response.payload.toString("utf-8"));

    mockStub.usercert = patientCert;

    //add access
    console.log('grant access');
    response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor5"]);
    console.log(response.payload.toString("utf-8"));

    //add file
    console.log('add file');
    response = await mockStub.mockInvoke("addFile", ["addFile","profile.png", "png", "secret123", "fileHash123"]);
    console.log(response.payload.toString("utf-8"));

    //get patient info for patient
    console.log('get patient info for patient');
    response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo"]);
    console.log(response.payload.toString("utf-8"));

    mockStub.usercert = doctorCert;

    //get patient info for doctor
    console.log('get patient info for doctor');
    response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo","patient5"]);
    console.log(response.payload.toString("utf-8"));

    //get file info for doctor
    console.log('get file info for doctor');
    response = await mockStub.mockInvoke("getFileSecret", ["getFileSecret","fileHash123","patient5"]);
    console.log(response.payload.toString("utf-8"));

    mockStub.usercert = patientCert;

    //get file info for patient
    console.log('get file info for patient');
    response = await mockStub.mockInvoke("getFileSecret", ["getFileSecret","fileHash123"]);
    console.log(response.payload.toString("utf-8"));

    //revoke access from doctor
    console.log('revoke access doctor5');
    response = await mockStub.mockInvoke("revokeAccess", ["revokeAccess","doctor5"]);
    console.log(response.payload.toString("utf-8"));

    //get patient info after revoke
    console.log('get patient info after revoke');
    response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo"]);
    console.log(response.payload.toString("utf-8"));
}

call_init();
