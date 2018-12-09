const shim = require('fabric-shim');
const { ClientIdentity } = shim;

class HealthCare {
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
            return shim.error(Buffer.from('User '+email+' role should be doctor'));
        }
        if(isUser) {
            return shim.error(Buffer.from('User '+email+' already exist'));
        }
        let userData = {email,name,role:'doctor',patientList:[]};
        await stub.putState(email, Buffer.from(JSON.stringify(userData)));

        let storedUser = await stub.getState(email);
        return shim.success(Buffer.from(storedUser.toString()));
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
            throw new Error('User '+email+' role should be patient');
        }
        if(isUser) {
            console.log('User '+email+' already exist');
            throw new Error('User '+email+' already exist');
        }

        let userData = {email,name,age,role:'patient',doctorList:[],files:{}};
        await stub.putState(email, Buffer.from(JSON.stringify(userData)));
	
	// to search by PartialKey
        let indexName = 'age~name';
        let patientAgeIndexKey = await stub.createCompositeKey(indexName, [age.toString(), name]);
        await stub.putState(patientAgeIndexKey, Buffer.from('\u0000'));

        let storedUser = await stub.getState(email);
        return shim.success(Buffer.from(storedUser.toString()));
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

        if(role === "patient" && patient) {
            let patientInfo = JSON.parse(patient.toString());
            if(patientInfo.files[fileHash])
                shim.error(Buffer.from('file already present'));
            else {
                patientInfo.files[fileHash] = {fileName,fileType,secret};
                await stub.putState(patientEmail, Buffer.from(JSON.stringify(patientInfo)));
                let storedUser = await stub.getState(patientEmail);
                return shim.success(Buffer.from(storedUser.toString()));
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
        let user = await stub.getState(userEmail);

        if(requester) {
            let requesterInfo = JSON.parse(requester.toString());
            if(user && role === "doctor") {
                let userInfo = JSON.parse(user.toString());
                if(userInfo.role === "patient" && userInfo.doctorList.indexOf(requesterEmail) > -1) {
                   return shim.success(Buffer.from( JSON.stringify(Object.assign({}, userInfo, {files: Object.keys(userInfo.files)})) ));
                    //return Object.assign({}, userInfo, {files: Object.keys(userInfo.files)});
                }
                else
                    return shim.error(Buffer.from('does not have access'));
            }
            else if(role === "patient") {
                return shim.success(Buffer.from( JSON.stringify(Object.assign({}, requesterInfo, {files: Object.keys(requesterInfo.files)})) ));
                //return Object.assign({}, requesterInfo, {files: Object.keys(requesterInfo.files)});
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

        if(role === "doctor" && requester)
            return shim.success(Buffer.from(requester.toString()));
        else
            return shim.error(Buffer.from('Role should be doctor or not registered'));
    }

    async getFileSecret(stub, args) {
        let fileHash = args[0];
        let userEmail = args[1];
        let user = await stub.getState(userEmail);
        let cid = new ClientIdentity(stub);
        let requesterEmail = cid.getAttributeValue('hf.EnrollmentID');
        let requester = await stub.getState(requesterEmail);
        let role = cid.getAttributeValue('hf.Type');

        if(requester) {
            let requesterInfo = JSON.parse(requester.toString());
            if(user && role === "doctor") {
                let userInfo = JSON.parse(user.toString());
                if(userInfo.role === "patient" && userInfo.doctorList.indexOf(requesterEmail) > -1) {
                    if(userInfo.files[fileHash])
                        return shim.success(Buffer.from( JSON.stringify(Object.assign({}, {fileInfo: userInfo.files[fileHash]})) ));
                        //return Object.assign({}, {fileInfo: userInfo.files[fileHash]});
                }
                else
                    return shim.error(Buffer.from('does not have access'));
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
        let doctor = await stub.getState(doctorEmail);

        if(role === "patient" && patient && doctor) {
            let patientInfo = JSON.parse(patient.toString());
            let doctorInfo = JSON.parse(doctor.toString());
            if(patientInfo.doctorList.indexOf(doctorEmail) === -1) {
                patientInfo.doctorList.push(doctorEmail);
                await stub.putState(patientEmail, Buffer.from(JSON.stringify(patientInfo)));

                doctorInfo.patientList.push(patientEmail);
                await stub.putState(doctorEmail, Buffer.from(JSON.stringify(doctorInfo)));

                let storedUser = await stub.getState(patientEmail);
                return shim.success(Buffer.from(storedUser.toString()));
            }
            else
                return shim.error(Buffer.from('doctor '+email+' already has access'));
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
        let doctor = await stub.getState(doctorEmail);

        if(role === "patient" && patient && doctor) {
            let patientInfo = JSON.parse(patient.toString());
            let doctorInfo = JSON.parse(doctor.toString());
            let doctorindex = patientInfo.doctorList.indexOf(doctorEmail);
            let patientIndex = doctorInfo.patientList.indexOf(patientEmail);

            if(doctorindex > -1 && patientIndex > -1) {
                patientInfo.doctorList.splice(doctorindex, 1);
                doctorInfo.patientList.splice(patientIndex, 1);
                await stub.putState(patientEmail, Buffer.from(JSON.stringify(patientInfo)));
                await stub.putState(doctorEmail, Buffer.from(JSON.stringify(doctorInfo)));
                return shim.success(Buffer.from('revoke successful'));
            }
            else
                return shim.error(Buffer.from('doctor '+email+' not in access list'));
        }
        else 
            return shim.error(Buffer.from('doctor or patient not registered'));
    }
}

module.exports = HealthCare;
