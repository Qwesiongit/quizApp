const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

let nodate = new Date;

const pastquestionSchema = new mongoose.Schema({  
    _level:{type:String,required:true}, 
    _year:{type:String,required:true},
    _course:{type:String,required:true},
    _file:{type:String,required:true},
    _createdat:{type:String,default:nodate.toDateString()}
});


const PastQuestion = mongoose.model('PastQuestion',pastquestionSchema);

module.exports = PastQuestion;
