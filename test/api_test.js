const assert = require('assert');
const axios = require('axios');
//const expect = require('chai').expect;
let testUrl;
let app;
let doctor;
let patient
let doctorAuth;
let patientAuth;
let headerInfo = {headers: {authtoken:""}}
let fileHash = "abc";
let fileSecret = "abc";

before(function(done) {
    app = require('../server').server;
    testUrl = process.env.API_TEST_URL;
    doctor = {
        email:process.env.TEST_DOCTOR_EMAIL,
        name:process.env.TEST_DOCTOR_NAME
    };
    patient = {
        email:process.env.TEST_PATIENT_EMAIL,
        name:process.env.TEST_PATIENT_NAME
    };
    setTimeout(() => { done() }, 1000);
});

after(function() {
    app.close();
});

describe('Register', function () {
    it('register patient without parameters', async () => {
        let registerRes = await axios.post(testUrl+'/register');
        assert.equal(registerRes.data.success, false);
        assert.equal(registerRes.data.msg, 'one or more fields missing');
    });
    it('try registering patient', async () => {
        let postData = {
            "name":patient.name,
            "email": patient.email,
            "password": patient.email,
            "role": "patient",
            "age": "20"
        }
        let registerRes = await axios.post(testUrl+'/register', postData);
        assert(registerRes.data.success, true);
    });
    it('try registering patient once again', async () => {
        let postData = {
            "name":patient.name,
            "email": patient.email,
            "password": patient.email,
            "role": "patient",
            "age": "20"
        }
        let registerRes = await axios.post(testUrl+'/register', postData);
        assert.equal(registerRes.data.success, false);
        assert.equal(registerRes.data.msg, 'registration failed');
    });
    it('register doctor', async () => {
        let postData = {
            "name":doctor.name,
            "email":doctor.email,
            "password":doctor.email,
            "role":"doctor"
        }

        let registerRes = await axios.post(testUrl+'/register', postData);
        assert.equal(registerRes.data.success, true);
    });
});

describe('Login User', function () {
    it('login with wrong cred', async () => {
        let registerRes = await axios.post(testUrl+'/login', {
            "email":doctor.email,
            "password":"wrong password"
        });
        assert.equal(registerRes.data.success, false);
        assert.equal(registerRes.data.msg, 'user not found');
    });
    it('login doctor', async () => {
        let registerRes = await axios.post(testUrl+'/login', {
            "email":doctor.email,
            "password":doctor.email
        });
        assert.equal(registerRes.data.success, true);
        assert(registerRes.data.userInfo.token);
        doctorAuth = registerRes.data.userInfo.token;
    });
    it('login doctor', async () => {
        let registerRes = await axios.post(testUrl+'/login', {
            "email":patient.email,
            "password":patient.email
        });
        assert.equal(registerRes.data.success, true);
        assert(registerRes.data.userInfo.token);
        patientAuth = registerRes.data.userInfo.token;
    });
});

describe('Get Patient Info', function () {
    it('get patient info for patient', async () => {
        headerInfo.headers.authtoken = patientAuth;
        let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
        assert.equal(registerRes.data.success, true);
        assert.equal(JSON.parse(registerRes.data.queryData).email, patient.email);
    });
    it('get patient info for doctor without access', async () => {
        headerInfo.headers.authtoken = doctorAuth;
        headerInfo.headers.userEmail = patient.email;
        let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
        assert.equal(registerRes.data.success, false);
        assert.equal(registerRes.data.msg, 'does not have access');
    });
});

describe('Grant access to doctor', function () {
    it('patient grant access doctor', async () => {
        headerInfo.headers.authtoken = patientAuth;
        let registerRes = await axios.post(testUrl+'/modifyAccess',{
            "type": "grant",
            "doctorEmail": doctor.email
        },headerInfo);
        assert.equal(registerRes.data.success, true);
    });
    describe('Check access list', () => {
        it('get patient info for patient', async () => {
            headerInfo.headers.authtoken = patientAuth;
            let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).doctorList.indexOf(doctor.email) > -1)
                assert.ok('access successful');
            else
                assert.fail('access not granted');
        });
        it('get patient info for doctor with access', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            headerInfo.headers.userEmail = patient.email;
            let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).doctorList.indexOf(doctor.email) > -1)
                assert.ok('access successful');
            else
                assert.fail('access not granted');
        });
        it('get doctor info for doctor with access', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            let registerRes = await axios.get(testUrl+'/getDoctorInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).patientList.indexOf(patient.email) > -1)
                assert.ok('access successful');
            else
                assert.fail('access not granted');
        });
    });
});

describe('Add file', () => {
    it('patient upload file', async () => {
        headerInfo.headers.authtoken = patientAuth;
        let registerRes = await axios.post(testUrl+'/addFile', {
            "fileName":"abc.png", 
            "fileType":"png", 
            "secret":fileSecret, 
            "fileHash":fileHash
        }, headerInfo);
        assert.equal(registerRes.data.success, true);
    });
    describe('check file after adding', () => {
        it('get patient info for patient', async () => {
            headerInfo.headers.authtoken = patientAuth;
            let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).files.indexOf(fileHash) > -1)
                assert.ok('access successful');
            else
                assert.fail('access not granted');
        });
        it('get patient info for doctor with access', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            headerInfo.headers.userEmail = patient.email;
            let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).files.indexOf(fileHash) > -1)
                assert.ok('access successful');
            else
                assert.fail('access not granted');
        });
    });

    describe('check file secret', () => {
        it('get file secret for patient', async () => {
            headerInfo.headers.authtoken = patientAuth;
            headerInfo.headers.fileHash = fileHash;

            let registerRes = await axios.get(testUrl+'/getFileSecret', headerInfo);
            assert.equal(registerRes.data.success, true);
            assert.equal(JSON.parse(registerRes.data.queryData).fileInfo.secret, fileSecret)
        });
        it('get file secret for doctor', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            headerInfo.headers.fileHash = fileHash;
            headerInfo.headers.userEmail = patient.email;

            let registerRes = await axios.get(testUrl+'/getFileSecret', headerInfo);
            assert.equal(registerRes.data.success, true);
            assert.equal(JSON.parse(registerRes.data.queryData).fileInfo.secret, fileSecret)
        });
    });
});

describe('Revoke access to doctor', function () {
    it('revoke grant access doctor', async () => {
        headerInfo.headers.authtoken = patientAuth;
        let registerRes = await axios.post(testUrl+'/modifyAccess',{
            "type": "revoke",
            "doctorEmail": doctor.email
        },headerInfo);
        assert.equal(registerRes.data.success, true);
    });

    describe('Check access list after revoke', () => {
        it('get patient info for patient', async () => {
            headerInfo.headers.authtoken = patientAuth;
            let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).doctorList.indexOf(doctor.email) === -1)
                assert.ok('revoke successful');
            else
                assert.fail('access not revoked');
        });
        it('get patient info for doctor after revoke', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            headerInfo.headers.userEmail = patient.email;
            
            let registerRes = await axios.get(testUrl+'/getPatientInfo', headerInfo);
            assert.equal(registerRes.data.success, false);
            assert.equal(registerRes.data.msg, 'does not have access');
        });
        it('get doctor info for doctor after revoke', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            let registerRes = await axios.get(testUrl+'/getDoctorInfo', headerInfo);
            assert.equal(registerRes.data.success, true);
            if(JSON.parse(registerRes.data.queryData).patientList.indexOf(patient.email) === -1)
                assert.ok('revoke successful');
            else
                assert.fail('access not revoked');
        });
    });

    describe('check file secret after revoke', () => {
        it('get file secret for doctor', async () => {
            headerInfo.headers.authtoken = doctorAuth;
            headerInfo.headers.fileHash = fileHash;
            headerInfo.headers.userEmail = patient.email;

            let registerRes = await axios.get(testUrl+'/getFileSecret', headerInfo);
            assert.equal(registerRes.data.success, false);
            assert.equal(registerRes.data.msg, 'does not have access')
        });
    });
});
