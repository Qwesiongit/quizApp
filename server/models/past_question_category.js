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

const pastSchema = new mongoose.Schema({
    exam_type:{type:String,required:true,default:"regular"},  
    year:{type:String,required:true}, 
    course:{type:String,required:true},
    level:{type:String,required:true},
    short_name:{type:String,required:true},
    question_items:[qitemSchema],
    question_file:{type:String},
    createdat:{type:String,default:nodate.toDateString()}
});


const Past_Category = mongoose.model('Past_Category',pastSchema);

module.exports = Past_Category;
