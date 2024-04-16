const express = require("express");
const router = express.Router();
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const uuid = require('uuid');
const poolPromise = require("../util/connectionPromise.js");
const {smsfunction} = require("../globalfunction/smsfunction.js");
const SALT = process.env.SALT.toString();
const moment = require("moment-timezone");
moment().tz("Asia/Calcutta").format();
process.env.TZ = "Asia/Calcutta";
const key = require("../middleware/apikey.js"); 



// ***** auth *** start
//// app login start

router.post("/app-login", key, async (req, res) => {
  var connection = await poolPromise().getConnection();
  const statusObj = {
        6: "Mobile Number Verification Pending",
        5: "Onboard is Pending",
        4: "KYC Onboard is Pending",
        3: "Services Activated is Pending",
        2: "e-KYC Pending",
        1: "Active",
        0: "Suspended",
      };

  try {
    const { mobile, coordinates, deviceId, os, ip } = req.body;
    let location = " ";
    const missingValues = [];

if (mobile === undefined) {
    missingValues.push("mobile");
}
if (coordinates === undefined) {
    missingValues.push("coordinates");
}
if (deviceId === undefined) {
    missingValues.push("deviceId");
}
if (os === undefined) {
    missingValues.push("os");
}
if (ip === undefined) {
    missingValues.push("ip");
}

if (missingValues.length > 0) {
    // Some values are missing in req.body
    return res.status(400).json({ error: `The following values are missing: ${missingValues.join(", ")}` });
}

    const [[authUserData]] = await connection.query(
      "SELECT * FROM auths WHERE mobile = ?",
      [mobile]
    );

    if (!authUserData)
    {
      
      return res.status(200).json({
        statuscode: "2",
        status: "failed",
        message: "Unauthorized Access.",
      });
    } else {
      const statusCode = authUserData.status;

      
      // 2 - ekyc Pending
      if (statusCode >= 3 && statusCode <= 6)
      {
        try
        {
          if (coordinates !== null)
          {
            
            const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
            if (geo_result.length !== 0)
            {
              location = {
                district: geo_result[0].district,
                pincode: geo_result[0].pincode,
                state: geo_result[0].state
              }
            }
          }
          
        } catch (error) {
          console.log(`Getting geolocation ${error}`)
        }
        try
        {
        
          await connection.query("INSERT INTO login_data SET ? ", {
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
            route: "/app-login",
            mobile: mobile,
            coordinates,
            device_id:deviceId,
            os,
            ip,
            location,
            response:JSON.stringify({statuscode: "2",
            status: "failed",
            message: `${statusObj[Number(statusCode)]} Contact Support.`}),
            status:statusObj[Number(statusCode)]
            
          })
          // await poolPromise().execute(
          //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
          //   [coordinates, os, ip, newSecretKey, mobile]
          // );

        }
        catch (error)
        {
          console.log(error)
        }
        return res.status(200).json({
          statuscode: "2",
          status: "failed",
          message: `${statusObj[Number(statusCode)]} Contact Support.`,
        });
      } else if (statusCode === "0")
      {
        try
        {
          if (coordinates !== null)
          {
            
            const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
            if (geo_result.length !== 0)
            {
              location = {
                district: geo_result[0].district,
                pincode: geo_result[0].pincode,
                state: geo_result[0].state
              }
            }
          }
          
        } catch (error) {
          console.log(`Getting geolocation ${error}`)
        }
        try
        {
        
          await connection.query("INSERT INTO login_data SET ? ", {
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
            route: "/app-login",
            mobile: mobile,
            coordinates,
            device_id:deviceId,
            os,
            ip,
            location,
            response:JSON.stringify({statuscode: "2",
            status: "failed",
            message: "Your Business Wallet is Suspended."}),
            status:statusObj[Number(statusCode)]
            
          })
          // await poolPromise().execute(
          //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
          //   [coordinates, os, ip, newSecretKey, mobile]
          // );

        }
        catch (error)
        {
          console.log(error)
        }
        return res.status(200).json({
          statuscode: "2",
          status: "failed",
          message: "Your Business Wallet is Suspended.",
        });
      } else if (statusCode >= 1 && statusCode <= 2)
      {
        
        const { password } = authUserData;
        console.log(`device_id match ${deviceId === authUserData.device_id}`)
        console.log(`password  ${!password}`)
        console.log(`password  ${password}`)
      
        if (
          (deviceId !== authUserData.device_id) && !password
        )
        {
          
          // Devices id Not-Match or NULL and Password is NULL
          // Generate OTP and send to the registered mobile
          var otp = Math.floor(100000 + Math.random() * 900000);
          console.log(`OTP - > ${otp}`)
          const sms_result = await smsfunction(mobile, otp, 'loginotp');
          //if (sms_result["Status"] === "Error")
        
         
            let saltedOTP = SALT.concat(otp);
          var hashedOTP = md5(saltedOTP);

          try
          {
            
            await connection.query(
              "UPDATE auths SET otp = ? WHERE unique_id = ?",
              [hashedOTP, authUserData.unique_id]
              );
          } 
          catch (error)
          {
            console.log(error)
          }

          try
          {
            if (coordinates !== null)
            {
              
              const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
              if (geo_result.length !== 0)
              {
                location = {
                  district: geo_result[0].district,
                  pincode: geo_result[0].pincode,
                  state: geo_result[0].state
                }
              }
            }
            
          } catch (error) {
            console.log(`Getting geolocation ${error}`)
          }
          try
          {
          
            await connection.query("INSERT INTO login_data SET ? ", {
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              route: "/app-login",
              mobile: mobile,
              coordinates,
              device_id:deviceId,
              os,
              ip,
              location,
              response:JSON.stringify({statuscode: "01",
              status: "success",
              message: "OTP Successfully Sent to Registered Mobile"
              }),
              status:statusObj[Number(statusCode)]
              
            })
            // await poolPromise().execute(
            //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
            //   [coordinates, os, ip, newSecretKey, mobile]
            // );
  
          }
          catch (error)
          {
            console.log(error)
          }
              
          return res.status(200).json({
            statuscode: "01",
            status: "success",
            message: "OTP Successfully Sent to Registered Mobile.",
          });
          }
          
        
        else if ((deviceId !== authUserData.device_id) && password)
        {
          try
          {
            if (coordinates !== null)
            {
              
              const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
              if (geo_result.length !== 0)
              {
                location = {
                  district: geo_result[0].district,
                  pincode: geo_result[0].pincode,
                  state: geo_result[0].state
                }
              }
            }
            
          } catch (error) {
            console.log(`Getting geolocation ${error}`)
          }
          try
          {
          
            await connection.query("INSERT INTO login_data SET ? ", {
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              route: "/app-login",
              mobile: mobile,
              coordinates,
              device_id:deviceId,
              os,
              ip,
              location,
              response:JSON.stringify({statuscode: "03",
              status: "pending",
              message: "Unlock with password and save devices details.",
              }),
              status:statusObj[Number(statusCode)]
              
            })
            // await poolPromise().execute(
            //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
            //   [coordinates, os, ip, newSecretKey, mobile]
            // );
  
          }
          catch (error)
          {
            console.log(error)
          }
          // Devices id Not-Match and Password is Not-NULL
          return res.status(200).json({
            statuscode: "03",
            status: "pending",
            message: "Unlock with password and save devices details.",
          });
        } else if (deviceId === authUserData.device_id && !password) {
          // Devices id Match and Password is NULL

         const token = jwt.sign(
           {
             id: authUserData.unique_id,
             user_code: authUserData.user_code,
             mobile: authUserData.mobile,
            deviceId:authUserData.device_id
           },
           process.env.JWT_KEYS,
           { expiresIn: 600 } // 10 minutes in seconds
         );
         try
         {
           if (coordinates !== null)
           {
             
             const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
             if (geo_result.length !== 0)
             {
               location = {
                 district: geo_result[0].district,
                 pincode: geo_result[0].pincode,
                 state: geo_result[0].state
               }
             }
           }
           
         } catch (error) {
           console.log(`Getting geolocation ${error}`)
         }
         try
         {
         
           await connection.query("INSERT INTO login_data SET ? ", {
             timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
             route: "/app-login",
             mobile: mobile,
             coordinates,
             device_id:deviceId,
             os,
             ip,
             location,
             response:JSON.stringify({statuscode: "04",
             status: "set_password",
             message: "Set Password.",
             }),
             status:statusObj[Number(statusCode)]
             
           })
           // await poolPromise().execute(
           //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
           //   [coordinates, os, ip, newSecretKey, mobile]
           // );
 
         }
         catch (error)
         {
           console.log(error)
         }
          return res.status(200).json({
            statuscode: "04",
            status: "set_password",
            token: token,
            message: "Set Password.",
          });
        } else if (deviceId === authUserData.device_id && password)
        {
          console.log("here");
          // Devices id Match and Password is Not-NULL
          // Update coordinates and os, Generate New secret key
          const newSecretKey = uuid.v4() + Math.floor(1000 + Math.random() * 9000);
          
           const token = jwt.sign(
             {
               id: authUserData.unique_id,
               secret: newSecretKey,
               user_code: authUserData.user_code,
               mobile: authUserData.mobile,
              deviceId:authUserData.device_id
             },
             process.env.JWT_KEYS
          );
          try
          {
            if (coordinates !== null)
            {
              
              const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
              if (geo_result.length !== 0)
              {
                location = {
                  district: geo_result[0].district,
                  pincode: geo_result[0].pincode,
                  state: geo_result[0].state
                }
              }
            }
            
          } catch (error) {
            console.log(`Getting geolocation ${error}`)
          }
          try {
            await poolPromise().execute(
              "UPDATE auths SET  app_secret = ? WHERE unique_id = ?",
              [newSecretKey, authUserData.unique_id]
            );
           } catch (error) {
            console.log(`Auth Update ${error}`)
          }
          // return res.json({d:authUserData.unique_id})
          const [merchant_result] = await  connection.query("SELECT * FROM merchants WHERE unique_id  = ? ", [authUserData["unique_id"]])
          // return res.json({merchant_result})
          try
          {
          
            await connection.query("INSERT INTO login_data SET ? ", {
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              route: "/app-login",
              mobile: mobile,
              coordinates,
              device_id: deviceId || " ",
              os,
              ip,
              location,
              response: JSON.stringify({
                statuscode: "01",
                status: statusObj[Number(statusCode)],
                user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
                customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
                mobile: authUserData.mobile,
                tpin_status: authUserData.tpin === null ? "false":"true",
                package_status: authUserData.package_status,
              }),
              status:statusObj[Number(statusCode)]
              
            })
            // await poolPromise().execute(
            //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
            //   [coordinates, os, ip, newSecretKey, mobile]
            // );
  
          }
          catch (error)
          {
            console.log(error)
          }
        
          console.log(`statusCode  ${statusObj[Number(statusCode)]}   ${Number(statusCode)}  ${statusCode}`) 
          // return res.json({m:merchant_result.length})
          return res.status(200).json({
            statuscode: "01",
            status: statusObj[Number(statusCode)],
            user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
            customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
            mobile: authUserData.mobile,
            tpin_status: authUserData.tpin === null ? "false":"true",
            package_status: authUserData.package_status,
            token: token,
          });
        }
      }
    }
  } catch (error) {
    console.error(error.message);
    return res.status(422).json({
      statuscode: "2",
      status: "failed",
      message: "Something went wrong!",
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
});

router.post("/login-with-otp", key, async (req, res) => {
  var connection = await poolPromise().getConnection();
  // return res.json({data:"Entering Endpoint"})
  try {
    const { otp, mobile, coordinates, deviceId, os,ip } = req.body;
    let saltedOTP = SALT.concat(otp);
    var hashedOTP = md5(saltedOTP);
    let location =  " "

    const [userData] = await connection.query(
      "SELECT * FROM auths WHERE mobile = ? AND otp = ?",
      [mobile, hashedOTP]
    );
  //   return res.json({
  //     data: {
  //       message: "User Data",
  //       d:userData
  //  }})

      console.log(userData);
      
    if (userData.length === 0) {
      return res.status(200).json({
        statuscode: "2",
        status: "failed",
        message: "Invalid OTP."
      });
    }
    try
          {
            if (coordinates !== null)
            {
              
              const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
              if (geo_result.length !== 0)
              {
                location = {
                  district: geo_result[0].district,
                  pincode: geo_result[0].pincode,
                  state: geo_result[0].state
                }
              }
            }
            
          } catch (error) {
            console.log(`Getting geolocation ${error}`)
          }

    // Valid OTP, update data in login_data table
    const newCoordinates = coordinates || " ";
   
    const newDeviceId = deviceId || " ";
    const newOs = os || " ";
    const secretKey = uuid.v4() + Math.floor(1000 + Math.random() * 9000);

    // await connection.query(
    //   "UPDATE login_data SET coordinates = ?, mac_id = ?, device_id = ?, os = ?, secretkey = ? WHERE mobile = ?",
    //   [newCoordinates, newMacId, newDeviceId, newOs, secretKey, mobile]
    // );

   

    // return res.json({userData})
    await connection.query(
      "UPDATE auths SET device_id = ?, app_secret = ? WHERE mobile = ?",
      [deviceId, secretKey, mobile]
    );
    // const { password, name, tpin, customer_id, package_status, status } = userData[0];
    const { password, tpin, status } = userData[0];


    if (!password) {
      // Password is NULL, set a new password
      let token = jwt.sign({ id: userData[0].unique_id }, process.env.JWT_KEYS , { expiresIn: '10m' });
      console.log(token)
      return res.status(200).json({
        statuscode: "04",
        status: "set_password",
        message: "Set password.",
        token: token
      });
    } else
    {
      
      // Password is not NULL, generate token and update secret key
     
      let token = jwt.sign({
        id: userData[0].unique_id,
        user_code: userData[0].user_code,
        mobile: userData[0].mobile,
       deviceId:userData[0].device_id
      }, process.env.JWT_KEYS);
      
     const statusObj = {
       6: "Mobile Number Verification Pending",
       5: "Onboard is Pending",
       4: "KYC Onboard is Pending",
       3: "Services Activated is Pending",
       2: "E-KYC Pending",
       1: "Active",
       0: "Suspended",
     };

     try
     {
     
       await connection.query("INSERT INTO login_data SET ? ", {
         timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
         route: "/login-with-otp",
         mobile: mobile,
         coordinates:newCoordinates,
         device_id: newDeviceId || " ",
         os: newOs,
         ip:ip || " ",
         location:location || " ",
         response:JSON.stringify({statuscode: "01",
         status: "success",
         mobile: mobile,
         tpin: tpin === null ? "false":"true",
         status: statusObj[status],
         
         }),
         status:statusObj[Number(status)]
         
       })
       // await poolPromise().execute(
       //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
       //   [coordinates, os, ip, newSecretKey, mobile]
       // );

     }
     catch (error)
     {
       console.log(error)
      }
      const [merchant_result] = await connection.query("SELECT * FROM merchants WHERE unique_id  = ? ", [userData[0].unique_id])
       
      return res.status(200).json({
        statuscode: "01",
        status: "success",
        user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
            customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
            mobile: userData[0].mobile,
        tpin: tpin === null ? "false":"true",
        status: statusObj[status],
        token: token,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(422).json({
      statuscode: "2",
      status: "failed",
      message: "Something went wrong!"
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
});

router.post("/login-with-password", async (req, res) => {
  const { mobile, password, coordinates,deviceId, os,ip } = req.body;
  let location = " ";

  const statusObj = {
    6: "Mobile Number Verification Pending",
    5: "Onboard is Pending",
    4: "KYC Onboard is Pending",
    3: "Services Activated is Pending",
    2: "E-KYC Pending",
    1: "Active",
    0: "Suspended",
  };
  let missingValues = [];
  if (mobile === undefined) {
    missingValues.push("mobile");
}
if (coordinates === undefined) {
    missingValues.push("coordinates");
  }
  if (password === undefined) {
    missingValues.push("password");
}
if (deviceId === undefined) {
    missingValues.push("deviceId");
}
if (os === undefined) {
    missingValues.push("os");
}
if (ip === undefined) {
    missingValues.push("ip");
}

if (missingValues.length > 0) {
    // Some values are missing in req.body
    return res.status(422).json({ error: `The following values are missing: ${missingValues.join(", ")}` });
}
  if (password.length !== 32 || !/^[0-9a-f]{32}$/i.test(password)) {
    return res.status(422).json({
      status: "fail",
      message: "Password not matched.",
    });
  }

  try {
    const connection = await poolPromise().getConnection();

    try {
      
     

      const [savedUser] = await connection.execute(
        "SELECT * FROM auths WHERE mobile = ?",
        [mobile]
      );
      console.log(savedUser,"savedUser");
      
      if (savedUser.length === 0) {
        connection.release();
        return res.status(422).json({
          statuscode:"2",
          status: "failed",
          message: "Invalid Mobile number or password",
        });
      }
      if (Number(savedUser[0].status) !== 1 && Number(savedUser[0].status) !== 2)
      {
        {
          return res.status(422).json({
            statuscode: "2",
            status: "fail",
            message:"You are not allowed further"
        })  
        }
      }
      const userPassword = savedUser[0].password; 
      if (userPassword === null)
      {
        return res.status(422).json({
          statuscode: "2",
          status: "fail",
          message:"Set Password"
      })  
      }

      if (userPassword === password) {
        const [sent_otp] = await connection.execute(
          "UPDATE auths SET device_id = ? WHERE mobile = ?",
          [deviceId, mobile]
        );
        const newSecretKey = uuid.v4() + Math.floor(1000 + Math.random() * 9000);

        const token = jwt.sign(
          {
            id: savedUser[0].unique_id,
            secret: newSecretKey,
            user_code: savedUser[0].user_code,
            mobile: savedUser[0].mobile,
           deviceId:savedUser[0].device_id
          },
          process.env.JWT_KEYS
       );
       
          try
          {
            if (coordinates !== null)
            {
            
              const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
              if (geo_result.length !== 0)
              {
                location = {
                  district: geo_result[0].district,
                  pincode: geo_result[0].pincode,
                  state: geo_result[0].state
                }
              }
            }
          
          } catch (error)
          {
            console.log(`Getting geolocation ${error}`)
        }
        const [merchant_result] = await connection.query("SELECT * FROM merchants WHERE unique_id  = ? ", [savedUser[0].unique_id])
        // return res.json({merchant_result})
          try
          {
        
            await connection.query("INSERT INTO login_data SET ? ", {
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              route: "/login-with-password",
              mobile: mobile,
              coordinates: coordinates,
              device_id: savedUser[0].device_id || " ",
              os: " ",
              ip: " ",
              location: location || " ",
              response: JSON.stringify({
                statuscode: "01",
                status: statusObj[Number(savedUser[0].status)],
                user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
                customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
                mobile,
                tpin_status: savedUser[0].tpin === null ? "false":"true",
                package_status: savedUser[0].package_status,
                message: "with OTP Saved  Devices id.",
              }),
              status: statusObj[Number(savedUser[0].status)]
            
            })
            // await poolPromise().execute(
            //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
            //   [coordinates, os, ip, newSecretKey, mobile]
            // );
   
          }
          catch (error)
          {
            console.log(error)
        }
      
          connection.release();
          return res.json({
            statuscode: "01",
            status: statusObj[Number(savedUser[0].status)],
            user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
            customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
            mobile,
            tpin_status: savedUser[0].tpin === null ? "false":"true",
            package_status: savedUser[0].package_status,
            token
          });
        
         
          return res.status(200).json({
            statuscode: "01",
            status: statusObj[Number(statusCode)],
            user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
            customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
            mobile: authUserData.mobile,
            tpin_status: authUserData.tpin === null ? "false":"true",
            package_status: authUserData.package_status,
            token: token,
          });
      } else {
        connection.release();
        return res
          .status(422)
          .json({ statuscode:"2", status: "fail", message: "Invalid Password" });
      }
    } catch (error) {
      connection.release();
      console.log(error);
      return res.status(422).json({
        status: "Failed",
        statuscode: "2",
        message: "Something went wrong!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(422).json({
      status: "Failed",
      statuscode: "2",
      message: "Something went wrong!",
    });
  }
});

router.post("/set-password", key , async (req, res) => {
  const { authorization } = req.headers;
  const { password, cpassword, coordinates } = req.body;
  let location = " "
  
  if (!authorization) {
    return res
      .status(422)
      .json({ status: false, statuscode: "2", error: "Unauthorization" });
  }

  const token = authorization.replace("Bearer ", "");

  jwt.verify(token, process.env.JWT_KEYS, async (err, payload) => {
    if (err) {
      return res.status(422).json({ error: err });
    }

    const { id } = payload;
    var unique_id = id;

    const connection = await poolPromise().getConnection();

    const [fetchedUser] = await connection.execute(
      "SELECT * FROM auths WHERE unique_id = ?",
      [unique_id]
    );


    if (fetchedUser.length === 0) {
      connection.release();
      return res
        .status(422)
        .json({ status: "failed", message: "INVALID token" });
    }
    
 
    const mobile = fetchedUser[0].mobile;
    const secretToken = fetchedUser[0].app_secret;
    const tpin = fetchedUser[0].tpin;
    const status = fetchedUser[0].status;


    
    console.log(!/^[0-9a-f]{32}$/i.test(password))
    if (password !== cpassword || password.length !== 32 || !/^[0-9a-f]{32}$/i.test(password)) {
      return res.status(422).json({
        status: "fail",
        message: "Password and Confirm Password must be the same.",
      });
    }

    try {
 
      const [updatePassword] = await connection.execute(
        "UPDATE auths SET password = ? WHERE unique_id = ?",
        [password, unique_id]
      );

      if (updatePassword.affectedRows === 0) {
        connection.release();
        return res.status(422).json({ status: "fail" });
      }

      const token = jwt.sign(
        {
          id: unique_id,
          secret: secretToken,
        },
        process.env.JWT_KEYS
      );

      const statusObj = {
        6: "Mobile Number Verification Pending",
        5: "Onboard is Pending",
        4: "KYC Onboard is Pending",
        3: "Services Activated is Pending",
        2: "e-KYC Pending",
        1: "Active",
        0: "Suspended",
      };
      try
      {
        if (coordinates !== null)
        {
          
          const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
          if (geo_result.length !== 0)
          {
            location = {
              district: geo_result[0].district,
              pincode: geo_result[0].pincode,
              state: geo_result[0].state
            }
          }
        }
        
      } catch (error) {
        console.log(`Getting geolocation ${error}`)
      }
      const [merchant_result] = await  connection.query("SELECT * FROM merchants WHERE unique_id  = ? ", [fetchedUser[0].unique_id])
      try
      {
       
      
        await connection.query("INSERT INTO login_data SET ? ", {
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          route: "/set-password",
          mobile: mobile,
          coordinates: coordinates || " ",
          device_id: fetchedUser[0].device_id || " ",
          os: " ",
          ip: " ",
          location:location || " ",
          response: JSON.stringify({
            statuscode: "01",
            status: "success",
            user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
            customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
            mobile: mobile,
            tpin: tpin === null ? "false":"true",
            status: statusObj[Number(status)]
            
          }),
          status:statusObj[Number(status)]
          
        })
        // await poolPromise().execute(
        //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
        //   [coordinates, os, ip, newSecretKey, mobile]
        // );
 
      }
      catch (error)
      {
        console.log(error)
      }

      connection.release();
      return res.status(200).json({
        statuscode: "01",
        status: "success",
        user_name: merchant_result.length > 0 ? merchant_result[0].authorized_person_name : null,
        customer_id:merchant_result.length > 0 ? merchant_result[0].customer_id : null,
        mobile: mobile,
        tpin: tpin === null ? "false":"true",
        status: statusObj[Number(status)],
        token: token,
  
      });
    } catch (error) {
      console.log(error.message);
      return res.status(422).json({
        status: "Failed",
        statuscode: "2",
        message: "Something went wrong!",
      });
    }
  });
});

// Status code is not 2, or 1
router.post("/forgot-password", key, async (req, res) => {
  var connection = await poolPromise().getConnection();
  const statusObj = {
    6: "Mobile Number Verification Pending",
    5: "Onboard is Pending",
    4: "KYC Onboard is Pending",
    3: "Services Activated is Pending",
    2: "KYC Verification Pending",
    1: "Active",
    0: "Suspended",
  };
  let location =  " "

  try {
    const { mobile, coordinates } = req.body;

    const [[userData]] = await connection.query(
      "SELECT * FROM auths WHERE mobile = ?",
      [mobile]
    );

    if (!userData) {
      // User not found
      return res.status(202).json({
        statuscode: "2",
        status: "failed",
        message: "User not found."
      });
    }

    const statusCode = userData.status;

    if (["2", "1"].includes(statusCode)) {

       // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      let saltedOTP = SALT.concat(otp);
      var hashedOTP = md5(saltedOTP);

      // Update coordinates in Login Data Table
      await connection.query(
        "UPDATE auths SET otp =? WHERE id = ?",
        [hashedOTP, userData.id]
      );

      // Send OTP to the registered mobile number
     
    console.log(`otp -> ${otp}`)
      smsfunction(mobile, otp, 'loginotp');
      try
      {
        if (coordinates !== null)
        {
          
          const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
          if (geo_result.length !== 0)
          {
            location = {
              district: geo_result[0].district,
              pincode: geo_result[0].pincode,
              state: geo_result[0].state
            }
          }
        }
        
      } catch (error) {
        console.log(`Getting geolocation ${error}`)
      }
      try
      {
      
        await connection.query("INSERT INTO login_data SET ? ", {
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          route: "/forgot-password",
          mobile: mobile,
          coordinates: coordinates || " ",
          device_id: userData.device_id || " " ,
          os: " ",
          ip: " ",
          location:location || " ",
          response: JSON.stringify({
            statuscode: "01",
            status: "success",
            message: "OTP sent successfully."
          }),
          status:statusObj[Number(userData.status)]
          
        })
        // await poolPromise().execute(
        //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
        //   [coordinates, os, ip, newSecretKey, mobile]
        // );
 
      }
      catch (error)
      {
        console.log(error)
      }

      return res.status(200).json({
        statuscode: "01",
        status: "success",
        message: "OTP sent successfully."
      });
    } else {
      // Status code is not 2, or 1
      return res.status(202).json({
        statuscode: "2",
        status: "failed",
        message: "User not found."
      });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(422).json({
      statuscode: "2",
      status: "failed",
      message: "Something went wrong!"
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
});

router.post("/reset-password", key, async (req, res) => {
  var connection = await poolPromise().getConnection();

  try {
    const { mobile, password, otp, coordinates, deviceId, os, ip } = req.body;
    let location = " ";
  
    if (password.length !== 32 || !/^[0-9a-f]{32}$/i.test(password)) {
      return res.status(422).json({
        status: "fail",
        message: "Password not matched.",
      });
    }
  
    let saltedOTP = SALT.concat(otp);
    var hashedOTP = md5(saltedOTP);
    // Validate OTP
    const [[userData]] = await connection.query(
      "SELECT * FROM auths WHERE mobile = ? AND otp = ?",
      [mobile, hashedOTP]
    );

    if (!userData) {
      // Invalid OTP
      return res.status(202).json({
        statuscode: "2",
        status: "failed",
        message: "Invalid OTP."
      });
    }
    console.log(userData);

    const statusCode = userData.status;

    if (["2", "1"].includes(statusCode)) {
      // Update New Password, coordinates, Devices ID, os
      await connection.query(
        "UPDATE  auths  SET password = ?,device_id = ? WHERE unique_id = ?",
        [password, deviceId, userData.unique_id]
      );

      // Generate a new JWT token
      const token = jwt.sign(
        {
          id: userData.unique_id,
          secret: userData.secretkey,
        },
        process.env.JWT_KEYS
      );

        const statusObj = {
          6: "Mobile Number Verification Pending",
          5: "Onboard is Pending",
          4: "KYC Onboard is Pending",
          3: "Services Activated is Pending",
          2: "KYC Verification Pending",
          1: "Active",
          0: "Suspended",
        };
      // Return success response with the updated user information
      try
      {
        if (coordinates !== null)
        {
          
          const [geo_result] = await connection.query("SELECT * FROM geolocations WHERE coordinates = ? ", [coordinates])
          if (geo_result.length !== 0)
          {
            location = {
              district: geo_result[0].district,
              pincode: geo_result[0].pincode,
              state: geo_result[0].state
            }
          }
        }
        
      } catch (error) {
        console.log(`Getting geolocation ${error}`)
      }
      try
      {
      
        await connection.query("INSERT INTO login_data SET ? ", {
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          route: "/reset-password",
          mobile: mobile,
          coordinates: coordinates || " ",
          device_id: userData.device_id || " " ,
          os: os || " ",
          ip: ip || " ",
          location:location || " ",
          response: JSON.stringify({
            statuscode: "01",
            status: statusObj[userData.status],
            mobile: userData.mobile,
            tpin_status: userData.tpin === null ? "false":"true",
          }),
          status:statusObj[Number(userData.status)]
          
        })
        // await poolPromise().execute(
        //   "UPDATE login_data SET coordinates = ?, os = ?, ip= ? WHERE mobile = ?",
        //   [coordinates, os, ip, newSecretKey, mobile]
        // );
 
      }
      catch (error)
      {
        console.log(error)
      }
      return res.status(200).json({
        statuscode: "01",
        status: statusObj[userData.status],
        mobile: userData.mobile,
        tpin_status: userData.tpin === null ? "false":"true",
        token: token,
        // Include other user details or status information as needed
      });
    } else {
      // Status code is not 3, 2, or 1
      return res.status(202).json({
        statuscode: "2",
        status: "failed",
        message: "User not found."
      });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(422).json({
      statuscode: "2",
      status: "failed",
      message: "Something went wrong!"
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
});

//// app login end
// ***** auth *** end

//sms function
async function generatetemplate_id(connection, otp) {
  //sms_templete
  // const var1 = "<%23> ";
  // const var3 = " 3 min ";
  const functions = "send_otp";
  const sql = "SELECT template_id,templates FROM sms_template WHERE `function` = ? and `status` = 'Enable'";
  const value1 = [functions];
  const [smstemplate] = await connection.query(sql, value1);
  const template_id = smstemplate[0].template_id;
  const templates = smstemplate[0].templates;

  
  var message2 = templates.replace('#VAR1#', otp);
  console.log(templates,smstemplate,otp,message2,"smstemplate")
  // var message1 = message.replace('#VAR2#', otp);
  // var message2 = message1.replace('#VAR3#', var3);
return {template_id, message2};
}


module.exports = router;
