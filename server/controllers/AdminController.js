const {check,validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const General = require('../models/general_category');
const Past_Category = require('../models/past_question_category');
const User = require('../models/user');
const Payments = require("../models/payments");
const Syllabus = require("../models/syllabus");
const PastQuestion = require("../models/PastQuestion");
const fs = require('fs');


module.exports = function(app) {

    const regValidation=[
        check('fullname').not().isEmpty().withMessage("full name is required").isLength({min:7}).withMessage("Full name must be at least 7 characters").matches(/^[A-Za-z\s]+$/).withMessage("Name must be only alphabets"),
        check('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Email supplied is not valid"),
        check('admin_type').not().isEmpty().withMessage("Admin type is required"),
        //check('_img').not().isEmpty().withMessage("Image is required"),
        check('password').not().isEmpty().withMessage("Password is required").isLength({min:8}).withMessage("Password length must be at least eight(8) characters"),
        check('password_co').not().isEmpty().withMessage("Password confirm is required").custom((value,{req})=>{
              if(value !== req.body.password){
                 throw new Error("Pasword Mismatch");
              }
              return value;
        }),
        check('email').custom(value=>{
            return Admin.findOne({email:value}).then(admin=>{
                if(admin){
                    throw new Error("Email already account holder");
                }
            })
        })
    ];


    const logValidation=[
        check('email').not().isEmpty().withMessage("Email is required").isEmail().withMessage("Email supplied is not valid"),
        check('password').not().isEmpty().withMessage("Password is required"),
    ];

    const cataddValidation=[
        check('course').not().isEmpty().withMessage("Name is required").isLength({min:5}).withMessage("Category name length must be at least eight(5) characters"),
        check('level').not().isEmpty().withMessage("level is required"),
        check('type').not().isEmpty().withMessage("Quiz type is required"),
        check('short_name').not().isEmpty().withMessage("short name is required")
    ];

    const addQValidation=[
        check('course').not().isEmpty().withMessage("Course is required").isLength({min:5}).withMessage("Course name length must be at least eight(5) characters"),
        check('question').not().isEmpty().withMessage("Question is required"),
        check('answer_a').not().isEmpty().withMessage("answer a is required"),
        check('answer_b').not().isEmpty().withMessage("answer b is required"),
        check('answer_c').not().isEmpty().withMessage("answer c is required"),
        check('answer_d').not().isEmpty().withMessage("answer d is required"),
        check('correct_answer').not().isEmpty().withMessage("Correct answer is required")
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


       function addCategory(req,res){
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({errors:errors.mapped()});
        }
        if(req.session.user && req.session.user.user_type==="admin"){
            switch (req.body.type) {
                case "past_question":
                    let {year,level,exam_type,course,short_name}=req.body;
                    Past_Category.findOne({short_name:short_name}).then(found=>{
                        if(found){
                            let kcourse = course.replace("_"," ");
                            let tskk = kcourse.toLowerCase();
                            const msg =`${level},${exam_type}, ${year}, ${tskk} already exist`;
                            return res.send({success:false,message:msg});
                        }else{
                    let pqcat = new Past_Category();
                    pqcat.level=level;
                    pqcat.exam_type=exam_type;
                    pqcat.year=year;
                    pqcat.course=course;
                    pqcat.short_name=short_name;
                    pqcat.save().then(cat=>{
                        if(cat!==null){
                            let kkcourse = course.replace("_"," ");
                            let _tskk = kkcourse.toLowerCase();
                            const msgg =`${level}, ${year}, ${_tskk} successfully added.`;
                        return res.send({success:true,message:msgg,data:cat});
                        }
                    }).catch(errr=>{
                        res.send(errr);
                    });
                        }
                    });
                    
                    break;
                case "general":
                    General.findOne({short_name:req.body.short_name}).then(found=>{
                        if(found){
                            let _kkcourse = req.body.course.replace("_"," ");
                            let _tsk = _kkcourse.toLowerCase();
                            const _msg =`${_tsk} for ${req.body.level} already exist`;
                            return res.send({success:false,message:_msg});
                        }else{        
                    let gencat = new General();
                    gencat.course=req.body.course;
                    gencat.level=req.body.level;
                    gencat.short_name=req.body.short_name;
                    gencat.save().then(cat=>{
                        let _kcourse = req.body.course.replace("_"," ");
                        let tsk = _kcourse.toLowerCase();
                        const _msgg=`${tsk} for ${req.body.level} succesfully added.`;
                        return res.send({success:true,message:_msgg,data:cat});
                    }).catch(err=>{
                        res.send(err);
                    });

                        }
                    });
                break;
                default:
                    return res.send({success:false,message:"Please choose quiz type!!!"});
                    //break;
            }
            
        }else{
           return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
        
       }


       function addQuestion(req,res){
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({errors:errors.mapped()});
        }
        if(req.session.user && req.session.user.user_type==="admin"){
            let{type,course,question,answer_a,answer_b,answer_c,answer_d,correct_answer}=req.body;
            let todo={question,answer_a,answer_b,answer_c,answer_d,correct_answer};
            switch (type) {
                case "general":
                    General.findOne({short_name:course}).
                    exec((err,doc)=>{
                         if(err){
                            console.log(err);
                         }else{

                            let qus = doc.question_items.find(i=>i.question == req.body.question);
                            //console.log(qus);
                            if(qus){
                                res.send({success:false,message:"Sorry,Question already exist"});
                            }else{
                                doc.question_items.push(todo);
                             doc.save().
                             then(ques=>{
                                 return res.send({success:true,message:"Question successfully added.",data:ques});
                             }).
                             catch(err=>{
                               return res.send(err)
                             });
                            }
                         }
                    });
                    
                    break;

                    case "past_question":
                        Past_Category.findOne({short_name:course}).
                        exec((err,dt)=>{
                           if(err){
                            console.log(err);
                           }else{
                            let qus = dt.question_items.find(i=>i.question == req.body.question);
                            if(qus){
                                res.send({success:false,message:"Sorry,Question already exist"});
                            }else{

                                dt.question_items.push(todo);
                            dt.save().then(ques=>{
                                return res.send({success:true,message:"Question successfully added.",data:ques});
                            }).catch(err=>{
                               return res.send(err);
                            });

                            }
                            
                           }
                        });
                    
                        break;
            
                default:
                    return res.send({success:false,message:"Please choose quiz type!!!"});
                    //break;
            }
             
        }else{
           return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
       }

       function updateQuestion(req,res){
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({errors:errors.mapped()});
        }
        if(req.session.user && req.session.user.user_type==="admin"){
            let{type,course,qid,question,answer_a,answer_b,answer_c,answer_d,correct_answer}=req.body;
            let todo={question,answer_a,answer_b,answer_c,answer_d,correct_answer};
            switch (type) {
                case "general":

                    General.findOne({short_name:course}).
                    exec((err,doc)=>{
                         if(err){
                            console.log(err);
                         }else{
                          let qus = doc.question_items.find(i=>i._id == qid);
                          if(qus === null){
                              console.log("no such question");
                          }else{
                            console.log(qus);
                            qus.question=question;
                            qus.answer_a=answer_a;
                            qus.answer_b=answer_b;
                            qus.answer_c=answer_c;
                            qus.answer_d=answer_d;
                            qus.correct_answer=correct_answer;
                            doc.save().then(newsaved=>{
                                if(newsaved!==null){
                                    return res.send({success:true,message:"Question successfully updated."});
                                }
                            }).catch(err=>{
                                console.log(err)
                            });
                          }
                         
                         }
                    });
                    
                    break;

                    case "past_question":
                        Past_Category.findOne({short_name:course}).
                        exec((err,doc)=>{
                           if(err){
                            console.log(err);
                           }else{
                            let qus = doc.question_items.find(i=>i._id == qid);
                          if(qus === null){
                              console.log("no such question");
                          }else{
                            console.log(qus);
                            qus.question=question;
                            qus.answer_a=answer_a;
                            qus.answer_b=answer_b;
                            qus.answer_c=answer_c;
                            qus.answer_d=answer_d;
                            qus.correct_answer=correct_answer;
                            doc.save().then(newsaved=>{
                                if(newsaved!==null){
                                    return res.send({success:true,message:"Question successfully updated."});
                                }
                            }).catch(err=>{
                                console.log(err)
                            });
                          }
                         
                            
                           }
                        });
                    
                        break;
            
                default:
                    return res.send({success:false,message:"Please choose quiz type!!!"});
                    break;
            }
             
        }else{
           return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
       }



    function register(req,res){
     var errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.send({errors:errors.mapped()});
     }
     let {fullname,email,admin_type,password}=req.body;
     let file = req.files._img;
     
     var admin = new Admin();
     admin.fullname=fullname;
     admin.email=email;
     admin.admin_type=admin_type;
     admin.active==="yes"
     admin.image=file.name;
     admin.password = admin.hashPassword(password);
     admin.save().then(admin=>{
         if(!(admin===null)){
            try {
                file.mv(`${__dirname}/../public/images/admin/${file.name}`,err=>{
                    if(err){
                        console.log(err);
                    }
                });
             } catch (error) {
                return res.send({error:error})
             }
         return res.send({success:true,message:"Admin successfully added.",data:admin});
     }
     }).catch(err=>{
         res.send(err);
     });
    }

const passwordReset=(req,res)=>{
    let {email} = req.body;
        Admin.findOne({email:email}).then(thisadmin=>{
            if (thisadmin===null) {
               return res.send({success:false,message:"Sorry,this admin does not exist."});
            } else {
                let randnum = Math.floor((Math.random()*100000000)+10);
                let pre_suggested_password = `${email}_${randnum}`;
                let adm = new Admin();
                let hashed = adm.hashPassword(pre_suggested_password);
                thisadmin.password=hashed;
                thisadmin.save().then(newone=>{
                    if(newone!==null){
                        const msg =`Password reseted to ${pre_suggested_password},please login and change it immediately.`;
                    return res.send({success:true,message:msg});
                    }
                }).catch(err=>{
                    res.send(err);
                });
              
            }
        }).catch(err=>{
            console.log(err);
            res.send(err);
        });
    
}


const changePassword =(req,res)=>{
    if(req.session.user){
        Admin.findOne({email:req.session.user.email}).
        then(this_data=>{
          if(!(this_data===null)){
              let admin = new Admin();
                if( admin.comparePassword(req.body.oldpassword,this_data.password)){
              let pre_pass = admin.hashPassword(req.body.password);
              this_data.password=pre_pass;
              this_data.save().then(updated=>{
                  if(updated!==null){
                      console.log("password change");
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
        res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
    }
}

    function login(req,res){
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({errors:errors.mapped()});
        }
         Admin.findOne({email:req.body.email}).then(admin=>{
             if(!admin){
                 return res.send({success:false,message:"admin does not exist!!!"});
             }
             if(!admin.comparePassword(req.body.password,admin.password)){
                return res.send({success:false,message:"Wrong password!!!"});
             }
             if(!(admin.active==="yes")){
                return res.send({success:false,message:"Sorry,account is not active!!!"});
             }
             req.session.user=admin;
             req.session.isLoggedIn=true;
             return res.send({success:true,message:"You are logged in!!!",user:admin});
             //res.send(user);
         }).catch(err=>{
             res.send(err);
         });
       
       };



       const showCourses =(req,res)=>{
        if(req.session.user){
            //console.log(req.body.type);
           switch (req.body.type) {
               case "general":
                  General.find().then(g_courses=>{
                      if(!(g_courses==null)){
                       return res.send({success:true,courses:g_courses});
                      }else{
                        return res.send({success:false,message:"No available course for this category."});
                      }
                  }).catch(err=>{
                    res.json(err);
                  });
                   break;
                   case "past_question":
                    Past_Category.find().
                    then(p_courses=>{
                        if(p_courses!==null){
                        return res.send({success:true,courses:p_courses});
                        }else{
                            return res.send({success:false,message:"No available course for this category."});
                          }
                    }).
                    catch(err=>{
                        res.json(err);
                    });
                   break;
               default:
                return res.send({success:false,message:"wrong quiz type"});
           }
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
            }
    };


    const showQuestions =(req,res)=>{
        if(req.session.user){
           switch (req.body.type) {
               case "general":
                  General.findOne({short_name:req.body.course}).
                  then(gquestions=>{
                      if(gquestions!==null){
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
                   break;
           }
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
            }
    };



    const showUsers = (req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin"){
           switch (req.body.type) {
               case 'admin':
                Admin.find().
                then(all_users=>{
                    if (all_users!==null) {
                     return res.send({success:true,users:all_users});
                    } else {
                     return res.send({success:false,message:"No registered user"});
                    }
                }).catch(err=>{
                 return res.send(err);
                });
                   break;
                case 'normal':
                    User.find().
                  then(all_users=>{
                 if (all_users!==null) {
                 return res.send({success:true,users:all_users});
                 } else {
                 return res.send({success:false,message:"No registered user"});
                }
              }).catch(err=>{
              console.log(err);
            res.send(err);
           });
                    break;
           
               default:
                   console.log("wrong user type")
                   break;
           }

        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }


    const updateAdmin =(req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin"){
            let{fullname,email,admin_type}=req.body;
            let file ="";
            if(req.files){
                file=req.files._img;
            }
            
            Admin.findOne({email:req.session.user.email}).
            then(this_data=>{
              if(!(this_data===null)){
                  if(file!==""){
                    try {
                        file.mv(`${__dirname}/../public/images/admin/${file.name}`,err=>{
                            if(err){
                                console.log(err);
                            }
                        });
                     } catch (error) {
                        return res.send({error:error})
                     }
                    let fpath=`${__dirname}/../public/images/admin/${this_data.image}`;
                        try {
                            fs.unlinkSync(fpath);
                        } catch (ferror) {
                            console.error(ferror);
                        };

                        this_data.fullname=fullname;
                        this_data.email=email;
                        this_data.admin_type=admin_type;
                        this_data.image=file.name;     
                 
              }else{
                this_data.fullname=fullname;
                this_data.email=email;
                this_data.admin_type=admin_type;
              }
                  this_data.save().then(updated=>{
                    if(updated!==null){
                        return res.send({success:true,message:"admin successfully updated",user:updated});
                    }
                   
                  }).catch(err=>{
                    res.send(err);
                  });
              }
            }).catch(err=>{
                    res.send(err);
            });
        }else{
            res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }

    const activateUser = (req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin"){
           User.findOne({email:req.body.email}).
           then(this_user=>{
               if (this_user!==null) {
                Payments.findOne({_user:this_user._id}).
                then(pay=>{
                    if (pay!==null) {
                        if (pay._days_left!==null) {
                            this_user.active="yes";
                            this_user.save().then(actvtd=>{
                                  if(actvtd!==null){
                                   return res.send({success:true,message:"user successfully activated"});
                                  }
                            }).catch(errr=>{
                                console.log(errr);
                                res.send(err);
                            });
                        } else {
                            res.send({success:false,message:"Sorry,subscription for user is expired or user is yet to subscribe."});
                        }
                    }
                }).catch(er=>{
                    //console.log(er);
                    res.send(er);
                });
               } else {
                return res.send({success:false,message:"This user does not exist"});
               }
           }).catch(err=>{
            //console.log(err);
            res.send(err);
           });
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }

    const deActivateUser = (req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin"){
           User.findOne({email:req.body.email}).
           then(this_user=>{
               if (this_user!==null) {
                Payments.findOne({_user:this_user._id}).
                then(pay=>{
                    if (pay!==null) {
                        if (pay._expired==="yes") {
                            this_user.active="no";
                            this_user.save().then(actvtd=>{
                                  if(actvtd!==null){
                                   return res.send({success:true,message:"user de-activated"});
                                  }
                            }).catch(errr=>{
                                //console.log(errr);
                                res.send(err);
                            });
                        } else {
                           return res.send({success:false,message:"Sorry,subscription for user is expired or user is yet to subscribe."});
                        }
                    }
                }).catch(er=>{
                    //console.log(er);
                    res.send(er);
                });
               } else {
                return res.send({success:false,message:"Sorry,this user does not exist"});
               }
           }).catch(err=>{
            res.send(err);
           });
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }

    const suspendordeSuspend = (req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin"){
           User.findOne({email:req.body.email}).
           then(this_user=>{
               if (this_user!==null) {
                   let activated = this_user.active;
                   if (activated==="suspended") {
                       this_user.active="yes";
                       this_user.save().then(done=>{
                           if(done!==null){
                          return res.send({success:true,message:"account activated"});
                       }
                       }).catch(err=>{
                        res.send(err);
                       });
                   } 
                   else {
                    this_user.active="suspended";
                    this_user.save().then(done=>{
                        if(done!==null){
                       return res.send({success:true,message:"account suspended"});
                    }
                    }).catch(err=>{
                     res.send(err);
                    });
                   }
               } else {
                return res.send({success:false,message:"This user does not exist"});
               }
           }).catch(err=>{
            res.send(err);
           });
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }

    const activateDeactivateAdmin = (req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin" && req.session.user.admin_type==="super"){
           Admin.findOne({email:req.body.email}).
           then(this_admin=>{
               if (this_admin!==null) {
                   let activated = this_admin.active;
                   if (activated==="no") {
                       this_admin.active="yes";
                       this_admin.save().then(done=>{
                           if(done!==null){
                           return res.send({success:true,message:"account activated"});
                       }
                       }).catch(err=>{
                        res.send(err);
                       });
                   } 
                   else {
                    this_admin.active="no";
                    this_admin.save().then(done=>{
                        if(done!==null){
                       return res.send({success:true,message:"account de-activated"});
                    }
                    }).catch(err=>{
                     res.send(err);
                    });
                   }
               } else {
               return res.send({success:false,message:"This user does not exist"});
               }
           }).catch(err=>{
            res.send(err);
           });
        }else{
            return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }


    function addMaterail(req,res){
        var errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.send({errors:errors.mapped()});
        }
        if(req.session.user && req.session.user.user_type==="admin"){
            
            switch (req.body._type) {
                case "pastQuestion":

                PastQuestion.findOne({_shortname:req.body._shortname}).exec((err,doc)=>{
                    if(err){
                        console.log(err)
                    }else{
                        if(doc!==null){
                            res.send({success:false,message:"Sorry,this material already added."})
                        }else{

                            let nmat = new PastQuestion();
                            nmat._level=req.body._level;
                            nmat._course=req.body._course;
                            nmat._year=req.body._year;
                            nmat._shortname=req.body._shortname;
                            nmat._file=req.body._file;
                            nmat.save().then(svd=>{
                                if(svd!==null){
                                   res.send({success:true,message:"material material successfully added"});
                                }
                            }).
                            catch(er=>{
                                res.send(er);

                            }); 
                        }
                    }

                });

                    break;

                case "syllabus":

                    Syllabus.findOne({_shortname:req.body._shortname}).exec((err,doc)=>{
                        if(err){
                            console.log(err)
                        }else{
                            if(doc!==null){
                                res.send({success:false,message:"Sorry,this material already added."})
                            }else{
    
                                let nmat = new Syllabus();
                                nmat._level=req.body._level;
                                nmat._course=req.body._course;
                                nmat._shortname=req.body._shortname;
                                nmat._file=req.body._file;
                                nmat.save().then(svd=>{
                                    if(svd!==null){
                                       res.send({success:true,message:"material material successfully added"});
                                    }
                                }).
                                catch(er=>{
                                    res.send(er);
    
                                }); 
                            }
                        }
    
                    });
    
                    
                        break;
            
                default:
                    res.send({success:false,message:"wrong type submitted"});
                    break;
            }
             

   
        }else{
           return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
       }


       const check_admin_exist = (req,res)=>{
           Admin.find().
           then(all_users=>{
               if (all_users.length!==0) {
                return res.send({success:true});
               } else {
                return res.send({success:false});
               }
           }).catch(err=>{
            console.log(err);
            res.send(err);
           });
        
    };

    const addQfile=(req,res)=>{
        if(req.session.user && req.session.user.user_type==="admin"){
            let {type,course}=req.body;
            let file = req.files.file;
            switch (type) {
                case "past_question":
                    Past_Category.findOne({short_name:course}).
                    exec((errr,dt)=>{
                        if(errr){
                            console.log(err);
                        }else{
                            let fpath=`${__dirname}/../public/question_files/past_question/${dt.question_file}`;
                        try {
                            fs.unlinkSync(fpath);
                        } catch (eror) {
                            console.error(eror);
                        };
                            dt.question_file=file.name;
                            dt.save().then(sv=>{
                                if(sv){
                                try {
                                    file.mv(`${__dirname}/../public/question_files/past_question/${file.name}`,errs=>{
                                        if(errs){
                                            console.log(errs);
                                        }
                                    });
                                 } catch (error) {
                                    return res.send({error:error});
                                 }
                                 return res.send({success:true,message:"file successfully added."});
                                }
                            }).
                            catch(ere=>{
                              return res.send({error:ere});
                            });
                        }
                    });
                   break;                    
                case "general":
                    General.findOne({short_name:course}).
                    exec((err,dat)=>{
                      if(err){
                          console.log(err);
                      }else{

                        let fpath=`${__dirname}/../public/question_files/general/${dat.question_file}`;
                        try {
                            fs.unlinkSync(fpath);
                        } catch (ferror) {
                            console.error(ferror);
                        };
                          dat.question_file=file.name;
                          dat.save().then(savd=>{
                              if(savd){
                                try {
                                    file.mv(`${__dirname}/../public/question_files/general/${file.name}`,err=>{
                                        if(err){
                                            console.log(err);
                                        }
                                    });
                                 } catch (error) {
                                    return res.send({error:error});
                                 }
                                 return res.send({success:true,message:"file successfully added."});
                              }
                          }).
                          catch(er=>
                            console.log(er)
                            )
                      }
                    })
                    
                        break;
            
                default:
                    return res.send({success:false,message:"Sorry,wrong quiz type"});
            }

        }else{
        return res.send({success:false,message:"You are not logged in or not qualified to do this activity"});
        }
    }


   
    app.post('/api/admin/addmaterial',isloggedin,addMaterail);

    app.post('/api/admin/adminactivates',isloggedin,activateDeactivateAdmin);

    app.post('/api/admin/doactivate',isloggedin,activateUser);

    app.post('/api/admin/dodeactivate',isloggedin,deActivateUser);

    app.post('/api/admin/dosuspends',isloggedin,suspendordeSuspend);

     app.post('/api/admin/register',regValidation,register);
 
     app.post('/api/admin/login',logValidation,login);

     app.post('/api/admin/addquestion',addQValidation,addQuestion);

     app.post('/api/admin/updatequestion',addQValidation,updateQuestion);

     app.post('/api/admin/addcategory',cataddValidation,addCategory);
     
     app.get('/api/admin/isloggedIn',isloggedin);

     app.get('/api/admin/isexist',check_admin_exist);
     
     app.get('/api/admin/checklogged',islogged);

     app.post('/api/admin/getcourses',isloggedin,showCourses);

     app.post('/api/admin/getquestions',isloggedin,showQuestions);

     app.post('/api/admin/getusers',isloggedin,showUsers);

     app.post('/api/admin/changepassword',isloggedin,changePassword);

     app.post('/api/admin/updateadmin',isloggedin,updateAdmin);

     app.post('/api/admin/addqfile',isloggedin,addQfile);

     app.post('/api/admin/resetpassword',passwordReset);

   app.get('/api/admin/logout',(req,res)=>{
       req.session.destroy();
       res.send({message:"You are logged out"})
   });
 

    }