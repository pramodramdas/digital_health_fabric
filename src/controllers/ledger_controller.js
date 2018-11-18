const path = require('path');
const ledgerUtil = require('../utils/ledger_util');

const cert_path = path.join(__dirname, "/../../hfc-key-store");

const getPatientInfo = async (req, res) => {
    //let { userEmail } = req.body;
    let userEmail = req.headers.useremail;
    let invokingUser;// this should be extracted from jwt
    let invokingRole;// this should be extracted from jwt
    let invokeArgs = [];

    if(res.locals.decoded) {
        invokingUser = res.locals.decoded.email;
        invokingRole = res.locals.decoded.role;
    }
    if(!invokingRole)
        return res.json({success:false, msg:'role not found'});    
    if(invokingRole === 'doctor' && !userEmail)
        return res.json({success:false, msg:'missing patient email'});
    
    invokeArgs = userEmail ? [userEmail] : [];
    try {
        const fabClient = await ledgerUtil.getUser(cert_path, invokingUser);
        if(fabClient && fabClient.status) {
            let queryData = await ledgerUtil.queryChainCode(fabClient.fabric_client, 'getPatientInfo', invokeArgs);
            // console.log(queryData);
            return res.json({success:true, queryData});
        }
    } catch (err) {
        console.log(err);
        let msg = err.split(":")
        return res.json({success:false, msg:msg[2]?msg[2].trim():"error"});
    }
}

const getDoctorInfo = async (req, res) => {
    let invokingUser;// this should be extracted from jwt
    let invokeArgs = [];

    if(res.locals.decoded) {
        invokingUser = res.locals.decoded.email;
        invokingRole = res.locals.decoded.role;
    }
    try {
        const fabClient = await ledgerUtil.getUser(cert_path, invokingUser);
        if(fabClient && fabClient.status) {
            let queryData = await ledgerUtil.queryChainCode(fabClient.fabric_client, 'getDoctorInfo', invokeArgs);
            // console.log(queryData);
            return res.json({success:true, queryData});
        }
    } catch (err) {
        console.log(err);
        let msg = err.split(":")
        return res.json({success:false, msg:msg[2]?msg[2].trim():"error"});
    }
}

const getFileSecret = async (req, res) => {
    //let { fileHash, userEmail } = req.body;
    
    let fileHash = req.headers.filehash;
    let userEmail = req.headers.useremail;
    let invokingUser;// this should be extracted from jwt
    let invokingRole;// this should be extracted from jwt

    if(res.locals.decoded) {
        invokingUser = res.locals.decoded.email;
        invokingRole = res.locals.decoded.role;
    }

    if(!fileHash || !invokingRole)
        return res.json({success:true, msg:'missing file hash or role'});
    if(invokingRole === 'doctor' && !userEmail)
        return res.json({success:true, msg:'missing patient email'});

    let invokeArgs = [fileHash, userEmail];
    
    try {
        const fabClient = await ledgerUtil.getUser(cert_path, invokingUser);
        if(fabClient && fabClient.status) {
            let queryData = await ledgerUtil.queryChainCode(fabClient.fabric_client, 'getFileSecret', invokeArgs);
            return res.json({success:true, queryData});
        }
    } catch (err) {
        console.log(err);
        let msg = err.split(":")
        return res.json({success:false, msg:msg[2]?msg[2].trim():"error"});
    }
}

const addFile = async (req, res) => {
    let { fileName, fileType, secret, fileHash } = req.body;
    let invokingUser;// this should be extracted from jwt
    let invokingRole;

    if(res.locals.decoded) {
        invokingUser = res.locals.decoded.email;
        invokingRole = res.locals.decoded.role;
    }

    if(invokingRole !== 'patient')
        return res.json({success:false, msg:'role should patient'});
    if(!fileName || !fileType || !secret || !fileHash)
        return res.json({success:false, msg:'missing arguments'});

    let invokeArgs = [fileName, fileType, secret, fileHash];
    try {
        const fabClient = await ledgerUtil.getUser(cert_path, invokingUser);
        if(fabClient && fabClient.status) {
            await ledgerUtil.invoke(fabClient.fabric_client, 'addFile', invokeArgs);
            return res.json({success:true});
        }
    } catch (err) {
        console.log(err);
        let msg = err.split(":")
        return res.json({success:false, msg:msg[2]?msg[2].trim():"error"});
    }
}

const modifyAccess = async (req, res) => {
    let { doctorEmail, type } = req.body;
    let invokingUser;// this should be extracted from jwt
    let invokingRole;
    let fcn;

    if(res.locals.decoded) {
        invokingUser = res.locals.decoded.email;
        invokingRole = res.locals.decoded.role;
    }
    
    if(invokingRole !== 'patient')
        return res.json({success:false, msg:'role should be patient'});
    if(!type || !doctorEmail)
        return res.json({success:false, msg:'missing arguments'});

    fcn = (type === 'grant') ? 'grantAccess' : 'revokeAccess';

    try {
        const fabClient = await ledgerUtil.getUser(cert_path, invokingUser);
        if(fabClient && fabClient.status) {
            await ledgerUtil.invoke(fabClient.fabric_client, fcn, [doctorEmail]);
            return res.json({success:true});
        }
        else return res.json({success:false});
    } catch (err) {
        console.log(err);
        let msg = err.split(":")
        return res.json({success:false, msg:msg[2]?msg[2].trim():"error"});
    }
}

const registerUser = (email, role, name, age) => {
    return new Promise(async (resolve, reject) => {
        try {
            let invokeArgs = [name];
            let fcn;
            if(role === 'patient') {
                if(!age)reject('age required');
                invokeArgs.push(age);
                fcn = 'registerPatient';
            }
            else if(role === 'doctor')
                fcn = 'registerDoctor';
                
            const fabClient = await ledgerUtil.getUser(cert_path, email);

            if(fabClient && fabClient.status) {
                let invokeResponse = await ledgerUtil.invoke(fabClient.fabric_client, fcn, invokeArgs);
                resolve(invokeResponse);
            }
        } catch (err) {
            console.log(err);
            reject('error');
        }
    });
}

module.exports = {
    getPatientInfo,
    getDoctorInfo,
    getFileSecret,
    addFile,
    modifyAccess,
    registerUser
}