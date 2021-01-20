const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

let nodate = new Date;
//let hr = nodate.getUTCHours()<10?'0':''

const syllabusSchema = new mongoose.Schema({  
    _level:{type:String,required:true}, 
    _course:{type:String,required:true},
    _shortname:{type:String,required:true},
    _file:{type:String,required:true},
    _createdat:{type:String,default:nodate.toDateString()}
});


const Syllabus = mongoose.model('Syllabus',syllabusSchema);

module.exports = Syllabus;
