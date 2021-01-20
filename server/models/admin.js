const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

let nodate = new Date;

const adminSchema = new mongoose.Schema({
    fullname:{type:String,required:true},
    email:{type:String,unique:true,required:true},
    admin_type:{type:String,default:"normal",required:true},
    password:{type:String,required:true},
    image:{type:String,required:true},
    user_type:{type:String,default:"admin"},
    active:{type:String,default:"no"},
    createdat:{type:String,default:nodate.toDateString()}
});


adminSchema.methods.hashPassword = function(password){
    return bcrypt.hashSync(password, 10);
};

adminSchema.methods.comparePassword = function(password,hashPasw){
    return bcrypt.compareSync(password,hashPasw);
}

const Admin = mongoose.model('Admin',adminSchema);

module.exports = Admin;