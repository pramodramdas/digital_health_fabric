const shim = require('fabric-shim');
const { ClientIdentity } = shim;

let Chaincode = class {
    async Init(stub) {
        return shim.success(Buffer.from('Initialized Successfully'));
    }
    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();

        let fcn = this[ret.fcn];
        return fcn(stub, ret.params);
    }
    async registerDoctor(stub, args) {
        if(!args[0])
            throw new Error('Missing arguments');
        // let email = args[0]; // email
        let name = args[0]; // name
        let cid = new ClientIdentity(stub);
        let email = cid.getAttributeValue('hf.EnrollmentID');
        let role = cid.getAttributeValue('hf.Type');
        let isUser = await stub.getState(email);

        if(role !== "doctor") {
            return shim.error(Buffer.from('User role should be doctor'));
        }
        if(isUser.toString()) {
            return shim.error(Buffer.from('User already exist'));
        }
        let userData = {email,name,role:'doctor',patientList:[]};
        await stub.putState(email, Buffer.from(JSON.stringify(userData)));

        return shim.success(Buffer.from('doctor registration successfull'));
    }
    async registerPatient(stub, args) {

        if(!args[0] && !args[1])
            throw new Error('Missing arguments');
        // let email = args[0]; // email
        let name = args[0];
        let age = parseInt(args[1]);
        let cid = new ClientIdentity(stub);
        let email = cid.getAttributeValue('hf.EnrollmentID');
        let role = cid.getAttributeValue('hf.Type');
        let isUser = await stub.getState(email);

        if(role !== "patient") {
            return shim.error(Buffer.from('User '+email+' role should be patient'));
        }
        if(isUser.toString()) {
            return shim.error(Buffer.from('User '+email+' already exist'));
        }

        let userData = {email,name,age,role:'patient',doctorList:[],files:{}};
        await stub.putState(email, Buffer.from(JSON.stringify(userData)));

        return shim.success(Buffer.from('patient registration successfull'));
    }
    async addFile(stub, args) {
        if(args.length < 4)
            throw new Error('arguments missing');
        let fileName = args[0];
        let fileType = args[1];
        let secret = args[2];
        let fileHash = args[3];
        let cid = new ClientIdentity(stub);
        let patientEmail = cid.getAttributeValue('hf.EnrollmentID');
        let role = cid.getAttributeValue('hf.Type');
        let patient = await stub.getState(patientEmail);

        if(role === "patient" && patient.toString()) {
            let patientInfo = JSON.parse(patient.toString());
            if(patientInfo.files[fileHash])
                shim.error(Buffer.from('file already present'));
            else {
                patientInfo.files[fileHash] = {fileName,fileType,secret};
                await stub.putState(patientEmail, Buffer.from(JSON.stringify(patientInfo)));
                
                return shim.success(Buffer.from('File added successfully'));
            }
        }
        else 
            return shim.error(Buffer.from('doctor or patient not registered'));

    }

    async getPatientInfo(stub, args) {
        let userEmail = args[0];
        let cid = new ClientIdentity(stub);
        let requesterEmail = cid.getAttributeValue('hf.EnrollmentID');
        let requester = await stub.getState(requesterEmail);
        let role = cid.getAttributeValue('hf.Type');
        let user;

        if(userEmail) 
            user = await stub.getState(userEmail);
        else
            user ="";

        if(requester.toString()) {
            let requesterInfo = JSON.parse(requester.toString());
            if(user.toString() && role === "doctor") {
                let userInfo = JSON.parse(user.toString());
                if(userInfo.role === "patient" && userInfo.doctorList.indexOf(requesterEmail) > -1) {
                   return shim.success(Buffer.from(JSON.stringify(Object.assign({}, userInfo, {files: Object.keys(userInfo.files)}))));
                }
                else
                    return shim.error(Buffer.from('does not have access'));//new
            }
            else if(role === "patient") {
                return shim.success(Buffer.from(JSON.stringify(Object.assign({}, requesterInfo, {files: Object.keys(requesterInfo.files)}))));
            }
            else
                return shim.error(Buffer.from('invalid call'));
        }
        else
            return shim.error(Buffer.from('not registered'));
    }

    async getDoctorInfo(stub, args) {
        let cid = new ClientIdentity(stub);
        let requesterEmail = cid.getAttributeValue('hf.EnrollmentID');
        let role = cid.getAttributeValue('hf.Type');
        let requester = await stub.getState(requesterEmail);

        if(role === "doctor" && requester.toString())
            return shim.success(Buffer.from(requester.toString()));
        else
            return shim.error(Buffer.from('Role should be doctor or not registered'));
    }

    async getFileSecret(stub, args) {
        let fileHash = args[0];
        let userEmail = args[1];
        let cid = new ClientIdentity(stub);
        let requesterEmail = cid.getAttributeValue('hf.EnrollmentID');
        let requester = await stub.getState(requesterEmail);
        let role = cid.getAttributeValue('hf.Type');
        let user;

        if(userEmail) 
            user = await stub.getState(userEmail);
        else
            user ="";

        if(requester.toString()) {
            let requesterInfo = JSON.parse(requester.toString());
            if(user.toString() && role === "doctor") {
                let userInfo = JSON.parse(user.toString());
                if(userInfo.role === "patient" && userInfo.doctorList.indexOf(requesterEmail) > -1) {
                    if(userInfo.files[fileHash])
                        return shim.success(Buffer.from( JSON.stringify(Object.assign({}, {fileInfo: userInfo.files[fileHash]})) ));
                        //return Object.assign({}, {fileInfo: userInfo.files[fileHash]});
                }
                else
                    return shim.error(Buffer.from('does not have access'));//new
            }
            else if(role === "patient") {
                return shim.success(Buffer.from( JSON.stringify(Object.assign({}, {fileInfo: requesterInfo.files[fileHash]})) ));
                //return Object.assign({}, {fileInfo: requesterInfo.files[fileHash]});
            }
            else
                return shim.error(Buffer.from('invalid call'));
        }
        else
            return shim.error(Buffer.from('not registered'));
    }

    async grantAccess(stub, args) {
        let cid = new ClientIdentity(stub);
        let patientEmail = cid.getAttributeValue('hf.EnrollmentID');
        let role = cid.getAttributeValue('hf.Type');
        let doctorEmail = args[0];
        let patient = await stub.getState(patientEmail);
        let doctor;

        if(doctorEmail)
            doctor = await stub.getState(doctorEmail);
        else
            doctor = "";

        if(role === "patient" && patient.toString() && doctor.toString()) {
            let patientInfo = JSON.parse(patient.toString());
            let doctorInfo = JSON.parse(doctor.toString()); // new
            if(patientInfo.doctorList.indexOf(doctorEmail) === -1) {
                patientInfo.doctorList.push(doctorEmail);
                await stub.putState(patientEmail, Buffer.from(JSON.stringify(patientInfo)));

                doctorInfo.patientList.push(patientEmail);//new
                await stub.putState(doctorEmail, Buffer.from(JSON.stringify(doctorInfo)));//new

                return shim.success(Buffer.from('Access granted'));
            }
            else
                return shim.error(Buffer.from('doctor already has access'));
        }
        else 
            return shim.error(Buffer.from('doctor or patient not registered'));
    }

    async revokeAccess(stub, args) {
        let cid = new ClientIdentity(stub);
        let patientEmail = cid.getAttributeValue('hf.EnrollmentID');
        let role = cid.getAttributeValue('hf.Type');
        let doctorEmail = args[0];
        let patient = await stub.getState(patientEmail);
        let doctor;

        if(doctorEmail)
            doctor = await stub.getState(doctorEmail);
        else
            doctor = "";

        if(role === "patient" && patient.toString() && doctor.toString()) {
            let patientInfo = JSON.parse(patient.toString());
            let doctorInfo = JSON.parse(doctor.toString());//new
            let doctorindex = patientInfo.doctorList.indexOf(doctorEmail);
            let patientIndex = doctorInfo.patientList.indexOf(patientEmail);//new
            if(doctorindex > -1) {
                patientInfo.doctorList.splice(doctorindex);
                await stub.putState(patientEmail, Buffer.from(JSON.stringify(patientInfo)));
                
                doctorInfo.patientList.splice(patientIndex, 1);
                await stub.putState(doctorEmail, Buffer.from(JSON.stringify(doctorInfo)));
                
                return shim.success(Buffer.from('revoke successful'));
            }
            else
                return shim.error(Buffer.from('doctor not in access list'));
        }
        else 
            return shim.error(Buffer.from('doctor or patient not registered'));
    }

    async getQueryResultFromString(stub, args) {
        if (args.length < 1) {
            throw new Error('Incorrect number of arguments. query string expected');
        }
        let queryString = args[0];
        let iterator = await stub.getQueryResult(queryString);
        let allResults = [];

        while (true) {
            let res = await iterator.next();
            let jsonRes = {};
            if (res.value && res.value.value.toString()) {
                jsonRes.Key = res.value.key;
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
            }
            allResults.push(jsonRes);
            if (res.done) {
                console.log('end of getQueryResultFromString data');
                await iterator.close();
                return shim.success(Buffer.from(JSON.stringify(allResults)));
            }
        }
    }
}

shim.start(new Chaincode());
//module.exports = HealthCare;
