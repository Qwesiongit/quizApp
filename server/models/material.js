const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

let nodate = new Date;

const syllabusSchema = new mongoose.Schema({  
    _level:{type:String,required:true}, 
    _course:{type:String,required:true},
    _shortname:{type:String,required:true},
    _file:{type:String,required:true},
    _createdat:{type:String,default:nodate.toDateString()}
});

const pastquestionSchema = new mongoose.Schema({  
    _level:{type:String,required:true}, 
    _year:{type:String,required:true},
    _course:{type:String,required:true},
    _file:{type:String,required:true},
    _createdat:{type:String,default:nodate.toDateString()}
});


const materialSchema = new mongoose.Schema({  
    syllabus:[syllabusSchema],
    pasQuestion:[pastquestionSchema],

});


const Material = mongoose.model('Material',materialSchema);

module.exports = Material;
