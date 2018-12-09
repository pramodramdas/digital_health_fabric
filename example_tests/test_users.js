const patient1Indo = require("../creds/patient1.json");
const patient2Indo = require("../creds/patient2.json");
const patient3Indo = require("../creds/patient3.json");
const patient4Indo = require("../creds/patient4.json");
const doctor1Indo = require("../creds/doctor1.json");
const doctor2Indo = require("../creds/doctor2.json");
const doctor3Indo = require("../creds/doctor3.json");
const doctor4Indo = require("../creds/doctor4.json");
const doctor5Indo = require("../creds/doctor5.json");

module.exports = {
    patient1: patient1Indo.enrollment.identity.certificate,
    patient2: patient2Indo.enrollment.identity.certificate,
    patient3: patient3Indo.enrollment.identity.certificate,
    patient4: patient4Indo.enrollment.identity.certificate,
    doctor1: doctor1Indo.enrollment.identity.certificate,
    doctor2: doctor2Indo.enrollment.identity.certificate,
    doctor3: doctor3Indo.enrollment.identity.certificate,
    doctor4: doctor4Indo.enrollment.identity.certificate,
    doctor5: doctor5Indo.enrollment.identity.certificate
}
