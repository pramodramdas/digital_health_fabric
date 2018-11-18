const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type:String, required: [true, 'name required'] },
    email: { type:String, required: [true, 'email required'] },
    password: { type:String, required: [true, 'password required'] },
    role: { type:String, required: [true, 'role required'] }
});

UserSchema.pre('save', function(next) {
    Users.findOne({email: this["email"]})
    .then((user) => {
        if(user)
            next(new Error("user already exist"));
        else
            next();
    })
    .catch((error) => {
        console.log(error);
        next(new Error("db error"));
    })
});

const Users = mongoose.model('users', UserSchema);

module.exports = Users;