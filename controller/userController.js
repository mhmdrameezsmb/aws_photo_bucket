const functions = require("../helpers/function");


let userController = {
    async fileUpload(req, res, next) {
      if (req.file) {
        console.log("image");
        console.log(req.file);
      }
      console.log(123);
      image = req.file.path;
      var new_image_path = image.replace("public", "");
      var insArray = {
        file_name: req.file.filename,
        created_at: moment().format("YYYY-MM-DD H:m:s"),
        file_path: new_image_path
      };
      let create_file = await functions.insert("file_upload", insArray);
      //console.log(req.body)
      console.log("file uploaded", create_file);
      req.response.status = true;
      req.response.message = "file uploaded successfully";
      next();
    },
    async filedel(req, res, next) {
      image = req.body.file;
      var new_image = "public/images/" + image;
     
      console.log(new_image);
      try {
       const response =  fs.unlinkSync(new_image);
       console.log(response);
       var insaArray = {
          deleted_at:moment().format("YYYY-MM-DD H:m:s")
        };
     
        
        const resp = await functions.update('file_upload',insaArray,{'file_name':image});
        console.log(resp);
  
  
  
        //file removed
      } catch (err) {
        console.error(err);
      }
      // let delete_file = await functions.delete("file_delete", insArray);
      // console.log("file uploaded", delete_file);
  
      req.response.status = true;
      req.response.message = "file deleted successfully";
      console.log(123);
  
      next();
    },
  
    async testingnew(req, res, next) {
      req.response.message = "here user";
      next();
    },
  
    //user login api
    async login(req, res, next) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.response.status = false;
        req.response.message = errors.errors[0].msg;
      } else {
        let enc_password = functions.encryptPassword(req.body.password);
        let check_email = await functions.get("user_master", {
          email: req.body.email,
        });
        if (check_email.length > 0) {
          let get_user = await users.login_check(req.body.email, enc_password);
  
          if (get_user.length > 0 && get_user[0].is_verified == "N") {
            var verify_code = Math.floor(1000 + Math.random() * 9000);
            await functions.update(
              "user_master",
              { otp: verify_code },
              { user_id: get_user[0].user_id }
            );
            functions
              .get("general_emails", {
                name: "account_activation_code",
              })
              .then((template) => {
                if (template) {
                  var email_template = template[0];
                  email_template.email_template =
                    email_template.email_template.replace(
                      "##CODE##",
                      verify_code
                    );
                  email_template.email_template =
                    email_template.email_template.replace(
                      "##NAME##",
                      get_user[0].first_name
                    );
                  functions.sendMail(
                    req.body.email,
                    "Verification Code",
                    email_template,
                    true,
                    function (emailres) {}
                  );
                }
              });
            req.response.status = true;
            req.response.data = get_user[0];
            req.response.message =
              "We have sent a verification code to your email id.";
          } else if (get_user.length > 0 && get_user[0].is_active == "N") {
            req.response.status = false;
            req.response.message =
              "Your account is temporarily deactivated. Please contact admin.";
          } else if (get_user.length > 0) {
            let get_latlng = await functions.get("vehicle_parking_master", {
              user_id: get_user[0].user_id,
              parking_status: "Y",
            });
            if (get_latlng.length > 0) {
              get_user[0].remainder_lat = get_latlng[0].remainder_lat;
              get_user[0].remainder_lng = get_latlng[0].remainder_lng;
            } else {
              get_user[0].remainder_lat = null;
              get_user[0].remainder_lng = null;
            }
  
            //update fcm id
            await functions.update(
              "user_master",
              { device: req.body.device, fcm_id: req.body.fcm_id },
              { user_id: get_user[0].user_id }
            );
            //creating token to authentication
            var token = jwt.sign(
              {
                email: get_user[0].email,
                user_id: get_user[0].user_id,
                first_name: get_user[0].first_name,
                last_name: get_user[0].last_name,
              },
              config.get("jwt_secret"),
              {
                expiresIn: "24000h",
              }
            );
            var refreshtoken = jwt.sign(
              {
                email: get_user[0].email,
                user_id: get_user[0].user_id,
                first_name: get_user[0].first_name,
                last_name: get_user[0].last_name,
              },
              config.get("jwt_secret"),
              {
                expiresIn: "24000000h",
              }
            );
            res.setHeader("x-access-token", token);
            res.setHeader("refresh-token", refreshtoken);
  
            req.response.status = true;
            req.response.data = get_user[0];
            req.response.message = "Login success";
          } else {
            req.response.status = false;
            req.response.message = "Invalid credentials";
          }
        } else {
          req.response.status = false;
          req.response.message = "Account does not exist";
        }
      }
      next();
    },
    //user registration api
    async register(req, res, next) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          req.response.status = false;
          req.response.message = errors.errors[0].msg;
        } else {
          let check_email = await users.check_user_email(req.body.email);
          if (check_email.length > 0) {
            req.response.status = false;
            req.response.message = "Email already exists";
          } else {
            var verify_code = Math.floor(1000 + Math.random() * 9000);
            enc_password = functions.encryptPassword(req.body.password);
            insArray = {
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              email: req.body.email,
              password: enc_password,
              otp: verify_code,
              display_name: req.body.display_name,
              device: req.body.device,
              fcm_id: req.body.fcm_id,
              created_date: moment().format("YYYY-MM-DD H:m:s"),
            };
            let create_user = await functions.insert("user_master", insArray);
            //sending otp to user email
            functions
              .get("general_emails", {
                name: "account_activation_code",
              })
              .then((template) => {
                if (template) {
                  var email_template = template[0];
                  email_template.email_template =
                    email_template.email_template.replace(
                      "##CODE##",
                      verify_code
                    );
                  email_template.email_template =
                    email_template.email_template.replace(
                      "##NAME##",
                      req.body.first_name
                    );
                  functions.sendMail(
                    req.body.email,
                    "Welcome to Trading Spaces !",
                    email_template,
                    true,
                    function (emailres) {}
                  );
                }
              });
            let user_details = await users.getUserdetails(create_user.insertId);
            if (user_details.length > 0) {
              var token = jwt.sign(
                {
                  email: user_details[0].email,
                  user_id: create_user.insertId,
                  first_name: user_details[0].first_name,
                  last_name: user_details[0].last_name,
                },
                config.get("jwt_secret"),
                {
                  expiresIn: "1h",
                }
              );
              var refreshtoken = jwt.sign(
                {
                  email: user_details[0].email,
                  user_id: create_user.insertId,
                  first_name: user_details[0].first_name,
                  last_name: user_details[0].last_name,
                },
                config.get("jwt_secret"),
                {
                  expiresIn: "240000h",
                }
              );
              res.setHeader("x-access-token", token);
              res.setHeader("refresh-token", refreshtoken);
              req.response.status = true;
              req.response.data = user_details[0];
              req.response.message =
                "We have sent a verification code to your email id.";
            } else {
              req.response.status = false;
              req.response.message = "Something went wrong..";
            }
          }
        }
  
        next();
      } catch (err) {
        console.log(err);
      }
    },
  
    async test(req, res, next) {
      let result = await functions.get("user_master");
      var dat = result[0];
      req.response.message = 123;
      req.response.data = dat;
      req.response.datad = { ...dat, user_id: 66 };
      next();
    },
  
    async editProfile(req, res, next) {
      try {
        let insArray = {};
        if (req.file) {
          image = req.file.path;
          var new_image = image.replace("public", "");
          insArray = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            image: new_image,
            display_name: req.body.display_name,
          };
        } else {
          insArray = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            display_name: req.body.display_name,
          };
        }
  
        let create_user = await functions.update("user_master", insArray, {
          user_id: req.decoded.user_id,
        });
        if (create_user.affectedRows > 0) {
          req.response.data = {};
          req.response.data.image = new_image;
          req.response.status = true;
          req.response.message = "successfully updated.";
        } else {
          req.response.status = false;
          req.response.message = "Something went wrong..";
        }
  
        next();
      } catch (err) {
        console.log(err);
      }
    },
  
    async logout(req, res, next) {
      try {
        let result = await functions.update(
          "user_master",
          { fcm_id: "" },
          { user_id: req.decoded.user_id }
        );
        // if(result.affectedRows > 0){
        req.response.status = true;
        req.response.message = "successfully logout.";
        // }else{
        //     req.response.status  = false;
        //     req.response.message = "failed update.";
        // }
        next();
      } catch (err) {
        console.log(err);
      }
    },
  };
  module.exports = userController;
  