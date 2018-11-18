const path = require('path');
const shajs = require('sha.js');
const jwt = require('jsonwebtoken');
const Users = require('../database/models/users');
const ledgerUtil = require('../utils/ledger_util');
const ledgerController = require('./ledger_controller');
const cert_path = path.join(__dirname, "/../../hfc-key-store");

const jwtValidate = (req, res, next) => {
    let authtoken = req.get('authtoken');

    if(!authtoken) res.status(401).send('unathorized');

    try {
        jwt.verify(authtoken, process.env.JWT_TOKEN_SECRET, {}, (err, decoded) => {
            if(err) {
                console.log(err);
                res.status(401).send('unathorized');
            }
            else {
                res.locals.decoded = decoded;
                next();
            }
        });
    } catch(error) {
        console.log(error);
        res.status(401).send('unathorized');
    }
}

const userRegister = async (req, res) => {
    const  { name, email, password, role, age } = req.body;
    
    if(!name || !email || !password || !role) 
        return res.json({success:false, msg:'one or more fields missing'});
    
    if(role !== "doctor" && role !== "patient")
        return res.json({success:false, msg:'role should be either doctor or patient'});

    if(role === "patient" && (!age || isNaN(age)))
        return res.json({success:false, msg:'for patient age is missing or age should be number'});

    try {
        const adminObject = await ledgerUtil.getAdmin(cert_path);
  
        if(adminObject && adminObject.status && adminObject.fabric_ca_client && adminObject.user_from_store && adminObject.fabric_client) {
            const secret = await adminObject.fabric_ca_client.register({enrollmentID:email, affiliation:'org1.department1', role}, adminObject.user_from_store);
            console.log('Successfully registered '+name+' - secret:'+ secret);

            const enrollment = await adminObject.fabric_ca_client.enroll({enrollmentID:email, enrollmentSecret:secret});
            const member_user = await adminObject.fabric_client.createUser({
                username:email, mspid:'Org1MSP',
                cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
            });

            await adminObject.fabric_client.setUserContext(member_user);
            
            let registered;

            if(role === "patient") 
                registered = await ledgerController.registerUser(email, role, name, age);
            else if(role === "doctor") registered = await ledgerController.registerUser(email, role, name);

            if(registered) {
                const pHash = shajs('sha256').update(email+password).digest('hex');
                const users = new Users({name, email, password:pHash.toUpperCase(), role});
                users.save();
                return res.json({success:true});
            }
            else return res.json({success:false});
        }
        return res.json({success:false});
    } catch(err) {
        if(err.toString().indexOf('Authorization') > -1) {
            console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
            'Try again after deleting the contents of the store directory '+cert_path);
        }
        else
            console.log(err);
        return res.json({success:false, msg:'registration failed'});
    }
}

const userLogin = async (req, res) => {
    let { email, password } = req.body;
    
    if(!email || !password)
        return res.json({success:false, msg:'user name or password missing'});
    
    try {
        const pHash = shajs('sha256').update(email+password).digest('hex');
        let user = await Users.findOne({email, password:pHash.toUpperCase()});

        if(user) {
            const fabClient = await ledgerUtil.getUser(cert_path, email);

            if(fabClient && fabClient.status) {
                let userInfo = {name:user.name, email:user.email, role:user.role};
                const token = jwt.sign(userInfo, process.env.JWT_TOKEN_SECRET, {expiresIn: process.env.JWT_EXPIRE_TIME});
                userInfo.token = token;
                res.json({success:true, userInfo});
            }
            else
                throw "user certificate not found";
        }
        else
            throw "user not found";
    } catch(err) {
        console.log(err);
        res.json({success:false, msg:err});
    }
}

module.exports = {
    userRegister,
    userLogin,
    jwtValidate
}