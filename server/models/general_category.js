const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

let nodate = new Date;

const qitemSchema=new mongoose.Schema({
    question:{type:String},
    answer_a:{type:String},
    answer_a:{type:String},
    answer_b:{type:String},
    answer_c:{type:String},
    answer_d:{type:String},
    correct_answer:{type:String}
});

const genSchema = new mongoose.Schema({   
    course:{type:String,required:true},
    level:{type:String,required:true},
    short_name:{type:String,required:true},
    question_items:[qitemSchema],
    question_file:{type:String},
    createdat:{type:String,default:nodate.toDateString()}
});


const General = mongoose.model('General',genSchema);

module.exports = General;
