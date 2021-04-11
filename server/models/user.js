const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

let nodate = new Date;

const userSchema = new mongoose.Schema({
    fullname:{type:String,required:true},
    email:{type:String,unique:true,required:true},
    password:{type:String,required:true},
    image:{type:String,required:true},
    user_type:{type:String,default:"normal"},
    createdat:{type:String,default:nodate.toDateString()},
    active:{type:String,default:"no"},
    loggedIn:{type:String,default:"no"},
    loggedInTime:{type:String,default:"none"}

});


userSchema.methods.hashPassword = function(password){
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.comparePassword = function(password,hashPasw){
    return bcrypt.compareSync(password,hashPasw);
}

const User = mongoose.model('User',userSchema);

module.exports = User;