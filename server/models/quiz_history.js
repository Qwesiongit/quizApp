const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


const scoreSchema=new mongoose.Schema({
    quiz_type:{type:String},
    level:{type:String},
    course:{type:String},
    total_questions:{type:String},
    total_attempted:{type:String},
    correctly_answered:{type:String},
    wrongly_answers:{type:String},
    total_unanswered:{type:String},
    date_quiz_taken:{type:String}
    //date_quiz_taken:{type:Date,default:Date.now}
});

const qzhistorySchema = new mongoose.Schema({
    user:{type:mongoose.Schema.ObjectId,required:true,ref:"User"},
    quiz_history:[scoreSchema]
});


const QuizHistory = mongoose.model('QuizHistory',qzhistorySchema);

module.exports = QuizHistory;
