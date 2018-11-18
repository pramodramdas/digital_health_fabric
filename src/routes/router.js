const { userRegister, userLogin, jwtValidate } = require("../controllers/access_controller");
const { getPatientInfo, getDoctorInfo, getFileSecret, addFile, modifyAccess } = require("../controllers/ledger_controller");

module.exports = (app) => {
    app.post('/register', userRegister);
    app.post('/login', userLogin);
    app.get('/getPatientInfo', jwtValidate, getPatientInfo);
    app.get('/getDoctorInfo', jwtValidate, getDoctorInfo);
    app.get('/getFileSecret', jwtValidate, getFileSecret);
    app.post('/addFile', jwtValidate, addFile);
    app.post('/modifyAccess', jwtValidate, modifyAccess);
}