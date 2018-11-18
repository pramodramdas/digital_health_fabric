const HealthCare  = require('../contracts/test_contract');
const { ChaincodeMockStub, Transform } = require("@theledger/fabric-mock-stub");
const assert = require('assert');

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
let chaincode;
let mockStub;

before(function () {
    chaincode = new HealthCare();
});

describe('Initalize Contract', function() {
    it('Init', async function(){
        mockStub = new ChaincodeMockStub("MyMockStub", chaincode, patientCert);
        let response = await mockStub.mockInit("init", []);
        let respObj = response.payload.toString("utf-8");
        assert.equal(respObj, 'Initialized Successfully');
    });
});

describe('Registration', function() {
    it('Register Patient', async function(){
        mockStub.usercert = patientCert;
        response = await mockStub.mockInvoke("registerPatient", ["registerPatient","patient5","20"]);
        let respObj = JSON.parse(response.payload.toString("utf-8"));
        assert.equal(respObj.email, 'patient5');
    });

    it('Register Doctor', async function(){
        mockStub.usercert = doctorCert;
        response = await mockStub.mockInvoke("registerDoctor", ["registerDoctor","doctor5"]);
        let respObj = JSON.parse(response.payload.toString("utf-8"));
        assert.equal(respObj.email, 'doctor5');
    });
});

describe('Grant Access', function() {
    it('Patient -> Doctor', async function(){
        mockStub.usercert = patientCert;
        response = await mockStub.mockInvoke("grantAccess", ["grantAccess","doctor5"]);
        let respObj = JSON.parse(response.payload.toString("utf-8"));
        assert.equal(respObj.doctorList[0], 'doctor5');
    });
    describe('Check Access', function() {
        it('Check access to doctor', async function(){
            mockStub.usercert = doctorCert;
            response = await mockStub.mockInvoke("getDoctorInfo", ["getDoctorInfo"]);
            let respObj = JSON.parse(response.payload.toString("utf-8"));
            assert.equal(respObj.patientList[0], 'patient5');
        });
    });
});

describe('Upload File', function() {
    it('Patient uploads file to IPFS, saves filehash and secret', async function(){
        mockStub.usercert = patientCert;
        response = await mockStub.mockInvoke("addFile", ["addFile","profile.png", "png", "secret123", "fileHash123"]);
        let respObj = JSON.parse(response.payload.toString("utf-8"));
        assert.equal(respObj.files['fileHash123']['fileName'], 'profile.png');
    });
    describe('Check File Access', function() {
        it('check file access to patient', async function(){
            mockStub.usercert = patientCert;
            response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo"]);
            let respObj = JSON.parse(response.payload.toString("utf-8"));
            assert.equal(respObj.files[0], 'fileHash123');
        });
        it('check file access to doctor', async function(){
            mockStub.usercert = doctorCert;
            response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo","patient5"]);
            let respObj = JSON.parse(response.payload.toString("utf-8"));
            assert.equal(respObj.files[0], 'fileHash123');
        });
    });
});

describe('Get File Secret', function() {
    it('get file secret for patient', async function(){
        mockStub.usercert = patientCert;
        response = await mockStub.mockInvoke("getFileSecret", ["getFileSecret","fileHash123"]);
        let respObj = JSON.parse(response.payload.toString("utf-8"));
        assert.equal(respObj['fileInfo']['fileName'], 'profile.png');
    });
    it('get file secret for doctor', async function(){
        mockStub.usercert = doctorCert;
        response = await mockStub.mockInvoke("getFileSecret", ["getFileSecret","fileHash123","patient5"]);
        let respObj = JSON.parse(response.payload.toString("utf-8"));
        assert.equal(respObj['fileInfo']['fileName'], 'profile.png');
    });
});

describe('Revoke Access', function() {
    it('patient revoke access -> doctor', async function(){
        mockStub.usercert = patientCert;
        response = await mockStub.mockInvoke("revokeAccess", ["revokeAccess","doctor5"]);
        let respObj = response.payload.toString("utf-8");
        assert.equal(respObj, 'revoke successful');
    });
    describe('Check after revoke', function() {
        it('check doctorlist', async function(){
            mockStub.usercert = patientCert;
            response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo"]);
            let respObj = JSON.parse(response.payload.toString("utf-8"));
            assert.equal(respObj.doctorList.indexOf('doctor5'), -1);
        });
        it('check patientList', async function(){
            mockStub.usercert = doctorCert;
            response = await mockStub.mockInvoke("getDoctorInfo", ["getDoctorInfo"]);
            let respObj = JSON.parse(response.payload.toString("utf-8"));
            assert.equal(respObj.patientList.indexOf('patient5'), -1);
        });
        it('get patient info to dotor', async function(){
            mockStub.usercert = doctorCert;
            response = await mockStub.mockInvoke("getPatientInfo", ["getPatientInfo","patient5"]);
            let respObj = response.message.toString("utf-8");
            assert.equal(respObj, 'does not have access');
        });
        it('get file secret for doctor', async function(){
            mockStub.usercert = doctorCert;
            response = await mockStub.mockInvoke("getFileSecret", ["getFileSecret","fileHash123","patient5"]);
            let respObj = response.message.toString("utf-8");
            assert.equal(respObj, 'does not have access');
        });
    });
});