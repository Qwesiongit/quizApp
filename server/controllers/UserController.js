const {check,validationResult } = require('express-validator');
const General = require('../models/general_category');
const Past_Category = require('../models/past_question_category');
const QuizHistory = require("../models/quiz_history");
const User = require('../models/user');
const Payments = require('../models/payments');
const Edu_Materails = require("../models/syllabus");
const path = require('path');



module.exports = function(app) {


    const regValidation=[
        check('fullname').not().isEmpty().withMessage("full name is required").isLength({min:7}).withMessage("Full name must be at least 7 characters").matches(/^[A-Za-z\s]+$/).withMessage("Name must be only alphabets"),
        check('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Email supplied is not valid"),
        check('password').not().isEmpty().withMessage("Password is required").isLength({min:8}).withMessage("Password length must be at least eight(8) characters"),
        check('password_co').not().isEmpty().withMessage("Password confirm is required").custom((value,{req})=>{
              if(value !== req.body.password){
                 throw new Error("Pasword Mismatch");
              }
              return value;
        }),
        check('email').custom(value=>{
            return User.findOne({email:value}).then(user=>{
                if(user){
                    throw new Error("Email already account holder");
                }
            })
        }),
        //check('_img').not().isEmpty().withMessage("Image is required"),

    ];


    const logValidation=[
        check('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Email supplied is not valid"),
        check('password').not().isEmpty().withMessage("Password is required"),
    ];


    function isloggedin(req,res,next){
        if(req.session.isLoggedIn===true){
            return next();
        }else{
          res.send(false);
        }    
  };


  function islogged(req,res){
    if(req.session.isLoggedIn===true){
        res.send(true);
     }else{
      res.send(false);
    }    
};

function logoff(req,res,next){
    let mail=req.session.user.email;
    User.findOne({email:mail}).exec((err,doc)=>{
        if(err){
            return res.send(err);
        }else{
            if(doc!==null){
                doc.loggedIn="no";
                doc.save();   
            }
        }
        return next();
    });    
};




    function register(req,res){
     var errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.send({errors:errors.mapped()});
     }
     let {fullname,email,password}=req.body;
     let file = req.files._img;
      
     let user = new User();
     user.fullname=fullname;
     user.email=email;
     user.image=file.name;
     user.password = user.hashPassword(password);
     user.save().then(user=>{
        if(user){
            try {
                file.mv(`${__dirname}/../public/images/normal/${file.name}`,err=>{
                    if(err){
                        console.log(err);
                    }
                });
             } catch (error) {
                return res.send({error:error})
             }
         return res.send({success:true,message:"You have succesfully registered.Please Complete your payment to get activated.",user:user});
        }
     }).catch(err=>{
         res.send(err);
     });
    }

const showCourses =(req,res)=>{
    if(req.session.user){
       switch (req.body.type) {
           case "general":
              General.find().then(g_courses=>{
                if(!(g_courses==null)){
                    return res.send({success:true,courses:g_courses});
                   }else{
                     return res.send({success:false,message:"No available course for this category."});
                   }
              }).catch(err=>{
                res.send(err);
              });
               break;
               case "past_question":
                Past_Category.find().
                then(p_courses=>{
                    if(!p_courses==null){
                        return res.send({success:true,courses:p_courses});
                        }else{
                            return res.send({success:false,message:"No available course for this category."});
                          }
                }).
                catch(err=>{
                    res.send(err);
                });
               break;
           default:
            return res.send({success:false,message:"wrong quiz type"});
       }
    }else{
        return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
}

    function login(req,res){
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({errors:errors.mapped()});
        }
         User.findOne({email:req.body.email}).then(user=>{
             if(!user){
                 return res.send({success:false,message:"user does not exist!!!"});
             }
             if(!user.comparePassword(req.body.password,user.password)){
                return res.send({success:false,message:"Wrong password!!!"});
             }
             if(!(user.active==="yes")){
                return res.send({success:false,message:"Sorry,account is not active!!!"});
             }
             if(!(user.loggedIn==="no")){
                return res.send({success:false,message:"Sorry,user is already loggedin elsewhere!!!"});
             }
             user.loggedIn ="yes";
             user.save().then(thisuser=>{
                req.session.user=thisuser;
                req.session.isLoggedIn=true;
                return res.send({success:true,message:"You are logged in!!!",user:thisuser});
             }).catch(oops=>{console.log(oops)});

         }).catch(err=>{
             res.send(err);
         });
       
       };


       const showQuestions =(req,res)=>{
        if(req.session.user){
           switch (req.body.type) {
               case "general":
                  General.findOne({short_name:req.body.course}).
                  then(gquestions=>{
                    if(!gquestions==null){
                        res.send({success:true,questions:gquestions.question_items});
                  } else{
                    return res.send({success:false,message:"No available questions for this course."});
                  }
                  }).catch(err=>{
                    res.send(err);
                  });
                   break;
                   case "past_question":
                    Past_Category.findOne({short_name:req.body.course}).
                    then(pquestions=>{
                        if(pquestions!==null){
                            return res.send({success:true,questions:pquestions.question_items});
                             }else{
                                 return res.send({success:false,message:"No available questions for this course."});
                             }
                    }).
                    catch(err=>{
                        res.send(err);
                    });

                   break;
               default:
                return res.send({success:false,message:"wrong quiz type"});
           }
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
            }
    };


    function addScore(req,res){
        if(req.session.user && req.session.user.user_type==="normal"){ 
            QuizHistory.findOne({user:req.session.user._id}).
            exec((err,doc)=>{
                if(err){
                    res.send(err);
                }else{
                    
                    if(doc===null){
                    let newone = new QuizHistory();
                    newone.user=req.session.user._id;
                    newone.quiz_history.push(req.body);
                    newone.save().then(one=>{
                        if(one!==null){
                           return res.send({success:true,message:"Score saved"});
                        }
                        
                    }).catch(err=>{
                        res.send(err);
                    });

                    }else{
                        //console.log("not empty");
                    doc.quiz_history.push(req.body);
                    doc.save().then(one=>{
                        if(one!==null){
                           return res.send({success:true,message:"Score saved"});
                        }
                    }).catch(err=>{
                        //console.log(err);
                        res.send(err);
                    });

                    }
                }
            });    
              
             
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
       };


       function showScores(req,res){
        if(req.session.user){
               QuizHistory.findOne({user:req.session.user._id}).
               exec((err,doc)=>{
                   if (err) {
                       res.send(err);                       
                   }else{
                    if(!(doc===null)){
                   return res.send({success:true,scores:doc});
                   }else{
                   return res.send({success:false,message:"You have no quiz scores."});
                   }
                   }
               });             
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
       };

       const passwordReset=(req,res)=>{
        let {email} = req.body;
            User.findOne({email:email}).then(thisuser=>{
                if (thisuser===null) {
                  return res.send({success:false,message:"Sorry,this user does not exist."});
                } else {
                    let randnum = Math.floor((Math.random()*100000000)+10);
                    let pre_suggested_password = `${email}_${randnum}`;
                    let user = new User();
                    let hashed = user.hashPassword(pre_suggested_password);
                    thisuser.password=hashed;
                    thisuser.save().then(newone=>{
                        if(!(newone===null)){
                        return res.send({success:true,message:`Password reseted to ${pre_suggested_password},please login and change it immediately.`});
                    }
                    }).catch(err=>{
                        res.send(err);
                    });
                  
                }
            }).catch(err=>{
                res.send(err);
            });
        
    }
    
    
    const changePassword =(req,res)=>{
        if(req.session.user){
            User.findOne({email:req.session.user.email}).
            then(this_data=>{
              if(!(this_data===null)){
                  let user = new User();
                  if(user.comparePassword(req.body.oldpassword,this_data.password)){
                  let pre_pass = user.hashPassword(req.body.password);
                  this_data.password=pre_pass;
                  this_data.save().then(updated=>{
                    if(updated!==null){
                        return res.send({success:true,message:"password successfully changed"});
                         }
                  }).catch(err=>{
                    res.send(err);
                  });
                 }else{
                    return res.send({success:false,message:"Sorry,old password submitted is not correct"});
                 }




              }
            }).catch(errr=>{
                    res.send(errr);
            });
        }else{
          return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }

    const updateUser =(req,res)=>{
        if(req.session.user && req.session.user.user_type==="normal"){
            let{fullname,email}=req.body;
            let file ="";
            if(req.files){
                file=req.files._img;
            }
            User.findOne({email:req.session.user.email}).
            then(this_data=>{
              if(!(this_data===null)){
               
                  if(file!==""){
                    try {
                        file.mv(`${__dirname}/../public/images/normal/${file.name}`,err=>{
                            if(err){
                                console.log(err);
                            }
                        });
                     } catch (error) {
                        return res.send({error:error})
                     }
                    let fpath=`${__dirname}/../public/images/normal/${this_data.image}`;
                        try {
                            fs.unlinkSync(fpath);
                        } catch (ferror) {
                            console.error(ferror);
                        };

                        this_data.fullname=fullname;
                        this_data.email=email;
                        this_data.image=file.name;     
                 
              }else{
                this_data.fullname=fullname;
                this_data.email=email;
              }

                  this_data.save().then(updated=>{
                    if(updated!==null){
                        return res.send({success:true,message:"Data successfully updated",user:updated});
                    }
                  }).catch(err=>{
                    res.send(err);
                  });
              }
            }).catch(err=>{
                    res.send(err);
            });
        }else{
          return  res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }


    const doPayment = (req,res)=>{
          User.findOne({email:req.body.email}).
          then(this_user=>{
              if(!(this_user===null)){
                  Payments.findOne({_user:this_user._id}).
                  exec((err,doc)=>{
                      if (err) {
                          res.send(err);
                      } else {
                        let today = new Date();
                          if(doc===null){
                              let topay = new Payments();
                              topay._user=this_user._id;
                              topay._amount_paid=req.body.amount;
                              topay._days_left="20";
                              topay.payment_records.push({_amount_paid:req.body.amount,_paid_on:today.toLocaleDateString()});
                              topay.save().then(payed=>{
                                if(payed!==null){
                                return res.send({success:true,message:"payment effected.You will be notified soon when activated."});
                              }
                             }).catch(err=>{
                               res.send(err);
                             });
                         }else{
                             if(doc._expired===true){
                            doc._amount_paid=req.body.amount;
                            doc._days_left="20";
                            doc._expired="no";
                            doc.payment_records.push({_amount_paid:req.body.amount,_paid_on:today.toLocaleDateString()});
                            doc.save().then(payed=>{
                              if(payed!==null){
                              return res.send({success:true,message:"payment effected.You will be notified soon when activated."});
                            }
                           }).catch(function (errr) {
                                   res.send(errr);
                               });
                        }else{
                            return res.send({success:false,message:"Your subscribtion has not yet expired"});
                        }
                         }
                      }
                  });
                 
              }else{
               return res.send({success:false,message:"Sorry,this user does not exist."});
              }
          }).
          catch(err=>{
              res.send(err);
          });
    }

    const showMaterials=(req,res)=>{
        if(req.session.user && req.session.user.user_type==="normal"){
         if(req.body._type==="pastQuestion"){
            let{_type,_level,_year,_course}=req.body;

            Edu_Materails.find().exec((err,doc)=>{
                if (err) {
                    return res.send(err);
                } else {
                    if(doc.pastQusetion.length===0){
                        return res.send({success:false,message:"Sorry,no past question available for download."});
                    }else{
                      let sd = doc.pastQusetion.find(i=>i._level==_level && i._year==_year && i._course==_course);
                      if(sd!==null){
                        return res.send({success:true,question:sd})
                      }else{
                        return res.send({success:false,message:"Sorry,no past question for your choice"})
                      }
                    }
                }
            });
         }
         if(req.body._type==="syllabus"){
            let{_type,_level,_course}=req.body;

            Edu_Materails.find().exec((err,doc)=>{
                if (err) {
                    return res.send(err);
                } else {
                    if(doc.syllabus.length===0){
                        return res.send({success:false,message:"Sorry,there are no syllabus for download"});
                    }else{
                      let sd = doc.syllabus.find(i=>i._level==_level && i._course==_course);
                      if(sd!==null){
                        return res.send({success:true,syllabus:sd})
                      }else{
                        return res.send({success:false,message:"Sorry,your choice of syllabus does not exist"})
                      }
                    }
                }
            });


         }
         
        

        }else{
          return  res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }

    };

    
    const dologout=(req,res)=>{
       req.session.destroy();
       res.send({message:"You are logged out"});
     };

     app.post('/api/user/register',regValidation,register);

     app.post('/api/user/dopayment',doPayment);
 
     app.post('/api/user/login',logValidation,login);

     app.get('/api/user/isloggedIn',isloggedin);
     
     app.get('/api/user/checklogged',islogged);

   app.get('/api/user/getcourses',isloggedin,showCourses);

   app.get('/api/user/getmatrerials',isloggedin,showMaterials);

   app.get('/api/user/getquestions',isloggedin,showQuestions);

   app.post('/api/user/addscore',isloggedin,addScore);

   app.post('/api/user/getscores',isloggedin,showScores);

   app.post('/api/user/changepassword',isloggedin,changePassword);

   app.post('/api/user/updateuser',isloggedin,updateUser);

   app.post('/api/user/resetpassword',passwordReset);
   
   app.get('/api/user/logout',logoff,dologout);

    }