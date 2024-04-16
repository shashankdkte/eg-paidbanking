const express = require("express");
const router = express.Router();
const poolPromise = require("../util/connectionPromise");
const SALT = process.env.SALT.toString();
const moment = require("moment-timezone");
moment().tz("Asia/Calcutta").format();
process.env.TZ = "Asia/Calcutta";
const TokenAuth = require("../globalfunction/TokenAuth.js");
const path = require("path");
const multer = require("multer");


const storage = multer.diskStorage({
  destination: "./assets/image/userdocs",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const uploadImage = multer({
  storage: storage,
});

// Configure multer storage for file uploads
const storages = multer.diskStorage({
  destination: "./assets/image/userkycdocs",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storages,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|pdf/; // Adjust the allowed file types as per your requirements
    const extname = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(
        "Error: Only jpeg, jpg, png, and pdf files Other Files are Not allowed."
      );
    }
  },
});
const roleMappings = {
  "CSP & Merchant & User": ["1"],
  "CSP & Merchant": ["2"],
  "CSP": ["3"],
  "Merchant": ["4"],
  "User": ["5"],
  "CSP & User": ["6"],
  "User & Merchant": ["7"],
};
router.get("/app_navigation", TokenAuth, async (req, res) => {
  var unique_id = req.users.unique_id;
  const connection = await poolPromise().getConnection();

  try{
    
  const [users] = await connection.query(
    "SELECT * FROM auths WHERE unique_id = ?",
    [unique_id]
  );
  // return res.json({users})
  if (users.length === 0) {
    return res
      .status(200)
      .json({ status: "Failed", message: "User not found" });
  }
    const result = getNumbersByUserType(users[0].user_type);
    // return res.json({result})
  const [navigation] = await connection.query(
    `SELECT * FROM app_navigation WHERE user_type IN(?) `,[result]
  );
  if (navigation.length === 0) {
    return res.status(422).json({ status: "fail", error: "Not Found" });
  }
  // return res.json({navigation})
  async function getNavigation() {
    const navigationTree = await createTree(navigation);
    return res
      .status(200)
      .json({ status: "success", statuscode: "01", data: navigationTree });
  }
  await getNavigation();
  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "fail",
    statuscode: "02",
    message: "Failed to create Remitter",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

});

router.get("/fetch_navigation", TokenAuth, async (req, res) => {
  var unique_id = req.users.unique_id;
  const connection = await poolPromise().getConnection();

  try{
    
  const [users] = await connection.query(
    "SELECT * FROM auths WHERE unique_id = ?",
    [unique_id]
  );
  //  return res.json({users})
  if (users.length === 0) {
    return res
      .status(200)
      .json({ status: "Failed", message: "User not found" });
  }
    const result = getNumbersByUserType(users[0].user_type);
    // return res.json({result})
  const [navigation] = await connection.query(
    `SELECT * FROM services_managers WHERE user_type IN(?) `,[result]
    );
    //return res.json({navigation})
  if (navigation.length === 0) {
    return res.status(422).json({ status: "fail", error: "Not Found" });
  }


    // const navigationTree = await createTreeT(navigation);
     const navigationTree = await createTreeN(navigation);
    // const processedData = preprocessData(navigation);
    // const navigationTree = createTree(navigation, 0,processedData);
    return res
      .status(200)
      .json({ status: "success", statuscode: "01", data: navigationTree });
  

  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "fail",
    statuscode: "02",
    message: "Failed to create Remitter",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

});
// router.get("/fetch-app-navigation", TokenAuth, async (req, res) => {
//   const connection = await poolPromise().getConnection();

  

//   try {
//     const navigation_result = getNumbersByUserType(req.users.user_type)

//     const [services] = await connection.query(
//       "SELECT * FROM services_managers WHERE user_type IN (?) AND status='Enable'",
//       [navigation_result]
//     );
//     console.log(services, req.users.user_type, "req.users.user_type");
    
    
//     const tree = await createTree(services);
//     res.json({
//       status: "success",
//       statuscode: "01",
//       data: services,
//     });
//   } catch (error) {
//     console.log("Error:", error);
//     res.status(422).json({ status: "fail", message: "Something went wrong!" });
//   } finally {
//     await connection.release();
//   }
// });

router.get("/get-profile", TokenAuth, async (req, res) => {
  const { unique_id, mobile,status , profile_photo} = req.users;
  // return res.json({user:req.users})
  const connection = await poolPromise().getConnection();

  const [userstable] = await connection.query(
    "SELECT customer_id , authorized_person_name as name, email,  entity_name as shop_name, office_address as address FROM merchants WHERE unique_id = ?",
    [unique_id]
  );
  // return res.json({userstable})

  if (userstable.length === 0) {
    await connection.release();
    return res
      .status(422)
      .json({ status: "fail", message: "No Merchant is found" });
  }

  var profileimg;
  if (
   profile_photo === "" || profile_photo === null
  ) {
    profileimg =
      `${process.env.BASE_URL}/assets/userdocs/` + userstable[0].profile_photo;
  } else {
    profileimg = `${process.env.BASE_URL}/assets/userdocs/default-user.png`;
  }

 

  
  const user = {
    customer_id:userstable[0].customer_id,
    Photo:profileimg ,
    "status":status == "1" ? "Active" : "e-KYC Pending",
    name: userstable[0].name,
    mobile_no: mobile,
    "email_id ": userstable[0].email,
    shop_name:userstable[0].shop_name,
    address:userstable[0].address,

  };

  await connection.release();
  return res.json(user);
});
router.get("/get-balance", TokenAuth, async (req, res) => {
  var unique_id = req.users.unique_id;
  var secretToken = req.secretkey;
  // return res.json({secretToken,s:req.users})
  const connection = await poolPromise().getConnection();

  try{
    
  const [users] = await connection.query(
    "SELECT * FROM auths WHERE unique_id = ?",
    [unique_id]
  );

  if (users[0].app_secret === secretToken) {
    const [wallets] = await connection.query(
      `SELECT * FROM wallets WHERE unique_id = ?`,
      [unique_id]
    );
    console.log(unique_id);
    console.log(wallets);
    var balance = wallets[0].wallet;

    return res.status(200).json({
      statuscode: "1",
      status: "success",
      data: {
        wallet: balance,
        hold: wallets[0].hold,
        unsettle: wallets[0].unsettle,
        status:wallets[0].status
      }
     
     
    });
  } else {
    return res
      .status(422)
      .json({ status: false, statuscode: "2", message: "Token expired" });
  }

  }catch (error) {
      console.error(error);
      return res.status(500).json({
      status: "fail",
      statuscode: "02",
      message: "Failed to create Remitter",
    });
  }finally {
    if (connection) {
      await connection.release();
    }
  }

});
router.post("/get-wallet-summary", TokenAuth, async (req, res) => {
  const { from_date, to_date, page, limit } = req.body;

  if (!from_date || !to_date || !page || !limit) {
    return res
      .status(404)
      .json({ message: "Requried from_date, to_date, page, limit" });
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { unique_id } = req.users;
  let query;
  let values;
  const connection = await poolPromise().getConnection();
 
  try{
    if (from_date && to_date) {
      query = `SELECT tran_id, type, amount, status, description, closing_balance, tran_at FROM walletsummary WHERE unique_id = ? AND tran_at BETWEEN ? AND ? ORDER BY tran_at DESC LIMIT ?, ?`;
      values = [
        unique_id,
        from_date + " 00:00:00",
        to_date + " 23:59:59",
        offset,
        parseInt(limit),
      ];
    } else {
      query = `SELECT tran_id, type, amount, status, description, closing_balance, tran_at FROM walletsummary WHERE unique_id = ? ORDER BY tran_at DESC  LIMIT ?, ?`;
      values = [unique_id, offset, parseInt(limit)];
    }
  
    const [results] = await connection.query(query, values);
  
    if (results.length > 0) {
      const formattedResults = results.map((result) => {
        const utcTimestamp = result.tran_at;
        const localDate = moment
          .utc(utcTimestamp)
          .local()
          .format("YYYY-MM-DD HH:mm:ss");
        return {
          ...result,
          tran_at: localDate,
        };
      });
  
      return res.status(200).json({
        status: "success",
        statuscode: "1",
        results: formattedResults,
      });
    } else {
      return res.status(200).json({
        status: "fail",
        statuscode: "0",
        message: "History is not available.",
      });
    }

  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "fail",
    statuscode: "02",
    message: "Failed to create Remitter",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

 
});

router.get("/get-tpin-status", TokenAuth, async (req, res) => {
  const apikey = req.headers.key;
  const { unique_id } = req.users;

  if (!apikey) {
    return res
      .status(422)
      .json({ status: "fail", message: "Please Provide API KEY." });
  }

  const connection = await poolPromise().getConnection();
  try{
    const sql = "SELECT id FROM secret_key WHERE secret_key = ?";
    const value = [apikey];
    const [fetchedKey] = await connection.query(sql, value);
  
    if (fetchedKey.length === 0) {
      return res
        .status(422)
        .json({ status: "fail", message: "INVALID API KEY." });
    } else {
      const sql1 = "SELECT tpin FROM auths WHERE unique_id = ?";
      const value1 = [unique_id];
      const [tpinstatus] = await connection.query(sql1, value1);
      const tpinStatus = tpinstatus[0].tpin;
  
      if (tpinStatus) {
        return res.json({
          status: "success",
          statusCode: "1",
          message: "Tpin is available.",
        });
      } else {
        return res.json({
          status: "success",
          statusCode: "0",
          message: "Tpin is not available.",
        });
      }
    }
  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "fail",
    statuscode: "02",
    message: "Failed to create Remitter",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}


});

router.post("/setpin", TokenAuth, async (req, res) => {
  const apikey = req.headers.key;
  const { unique_id } = req.users;
  const { tpin } = req.body;

  if (!apikey) {
    return res
      .status(422)
      .json({ status: "fail", message: "Please provide apikey" });
  }
  const connection = await poolPromise().getConnection();
  
  try{
    if (isNumeric(tpin)) {
      if (tpin.length === 6) {
  
        const sql = "SELECT id FROM secret_key WHERE secret_key = ?";
        const value = [apikey];
        const [fetchedKey] = await connection.query(sql, value);
  
        if (fetchedKey.length === 0) {
          return res
            .status(422)
            .json({ status: "fail", message: "INVALID API KEY." });
        } else {
          const sql1 = "SELECT tpin FROM auths WHERE unique_id = ?";
          const value1 = [unique_id];
          const [getTpin] = await connection.query(sql1, value1);
          const tpinStatus = getTpin[0].tpin;
  
          if (tpinStatus === null) {
            const [updatetpin] = await connection.query(
              "UPDATE auths SET tpin = ? WHERE unique_id = ?",
              [tpin, unique_id]
            );
  
            return res.json({
              status: "success",
              message: "Successfully set transfer pin.",
            });
          } else {
            return res.status(422).json({
              status: "fail",
              message: "Transfer Pin is already set.",
            });
          }
        }
      } else {
        return res.status(422).json({
          status: "fail",
          message: "TPIN must be exactly 6 characters long.",
        });
      }
    } else {
      return res.status(422).json({
        status: "fail",
        message: "TPIN must contain only numeric characters.",
      });
    }
  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "fail",
    statuscode: "02",
    message: "Failed to create Remitter",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

});

router.post("/change-tpin", TokenAuth, async (req, res) => {
  const apikey = req.headers.key;
  const { unique_id } = req.users;
  const { tpin, ctpin, oldPin } = req.body;

  if (!tpin || !ctpin) {
    return res
      .status(422)
      .json({ status: "fail", message: "Please provide Transfer Pin" });
  }

  if (tpin !== ctpin) {
    return res
      .status(422)
      .json({ status: "fail", message: "Transfer Pin & Confirm Pin mismatch" });
  }
  const connection = await poolPromise().getConnection();

  try{
    if (isNumeric(tpin)) {

      const sql = "SELECT id FROM secret_key WHERE secret_key = ?";
      const value = [apikey];
      const [fetchedKey] = await connection.query(sql, value);
  
      if (fetchedKey.length === 0) {
        return res
          .status(422)
          .json({ status: "fail", message: "INVALID API KEY." });
      } else {
        const sql1 = "SELECT tpin FROM auths WHERE unique_id = ?";
        const value1 = [unique_id];
        const [getTpin] = await connection.query(sql1, value1);
        //console.log(`getTpin ${getTpin[0].tpin} old ${oldPin} ${JSON.parse(oldPin)} ${getTpin[0].tpin === oldPin}`)
        if (getTpin[0].tpin === oldPin) {
          const [updatetpin] = await connection.query(
            "UPDATE auths SET tpin = ? WHERE unique_id = ?",
            [tpin, unique_id]
          );
  
          return res.json({
            status: "success",
            message: "Successfully set transfer pin.",
          });
        } else {
          return res
            .status(422)
            .json({ status: "fail", message: "Transfer pin is not matched." });
        }
      }
    } else {
      return res.status(422).json({
        status: "fail",
        message: "Value contains non-numeric characters",
      });
    }
  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "fail",
    statuscode: "02",
    message: "Failed to create Remitter",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

});


// router.post("/redeem-voucher", TokenAuth, async (req, res) => {
//   // var { apiKey, token, app_version, app_id } = req.headers;
//   var unique_id = req.users.unique_id;

//   //(if Passing device Id then passing devices type. If passing mac id then OS)

//   const {
//     voucher_code,
//     ip_address,
//     coordinates,
//     device_Id,//remove pending
//     mac_id, //==device_Id
//     device_type,//os
//   } = req.body;
//  console.log( "voucher_code",voucher_code,
//     ip_address,
//     coordinates,
//     // device_Id,
//     mac_id,
//     device_type)
//   const redeem_at = Date.now().toString();
//   if (
//     !voucher_code ||
//     !ip_address ||
//     !coordinates ||
//     // !device_Id ||
//     !mac_id ||
//     !device_type
//   ) {
//     return res.status(404).json({
//       statuscode: "2",
//       status: false,
//       message: "All value required",
//     });
//   }

//   const connection = await poolPromise().getConnection();

//   try{
//     const [users] = await connection.query(
//       "SELECT * FROM auths WHERE unique_id = ?",
//       [unique_id]
//     );
  
//     if (users.length === 0) {
//       return res
//         .status(200)
//         .json({ status: "Failed", message: "User not found" });
//     }
  
//     const [wallet] = await connection.execute(
//       "SELECT * FROM wallet WHERE unique_id = ?",
//       [unique_id]
//     );
  
//     if (mac_id === users[0].mac_id) {
  
//       const [voucher] = await connection.query(
//         "SELECT * FROM voucher WHERE voucher_code = ?", //doubt status Active
//         [voucher_code]
//       );
//       if (voucher.length === 0) {
//         return res.status(404).json({ 
//           "status": false,
//           "statuscode": "2",
//           "message": "Invalid Voucher" });
//       }
//       //console.log(voucher,"voucher",voucher[0].expiry,"voucher.expiry", typeof(voucher.expiry),typeof(Date.now()),voucher[0].status === 'Redeem',voucher[0].status)
      
//       // Date.now() > Number(voucher[0].expiry means voucher expired or  voucher[0].status === 'Redeem'
//       if(Date.now() > Number(voucher[0].expiry) || voucher[0].status === 'Redeem' || voucher[0].status === 'Expired'){
  
//        if(voucher[0].status !== 'Redeem'){
//         const [updatevoucher] = await connection.query(
//           "UPDATE voucher SET  status = ? WHERE voucher_code = ?",
//           [
//             "Expired"
//           ]
//         ); 
//             return res.status(404).json({
//               "status": false,
//               "statuscode": "2",
//               "message": `Voucher is Already Expired`
//               });
//        } 
//         return res.status(404).json({
//           "status": false,
//           "statuscode": "2",
//           "message": `Voucher is Already ${voucher[0].status}`
//       });
  
//       }
  
      
//       const [updatevoucher] = await connection.query(
//         "UPDATE voucher SET redeem_at = ?, status = ?, device_id = ?, os = ?, coordinates= ?, ip_address = ? WHERE voucher_code = ?",
//         [
//           redeem_at,
//           "Redeem",
//           // device_Id = mac_id
//           mac_id,
//           device_type,
//           coordinates,
//           ip_address,
//           voucher_code,
//         ]
//       );
  
//       let amount = wallet[0].wallet + voucher[0].amount;
  
//       let [[max_tran_id]] = await connection.query(
//         "SELECT MAX(`tran_id`) AS max_tran_id FROM walletsummary"
//       );
//       var tran_id = Number(max_tran_id.max_tran_id) + 0;
//       tran_id = Number(tran_id) + 1;
  
//       let description = {
//         voucher_id: voucher[0].voucher_id,
//         amount: voucher[0].amount,
//         status: voucher[0].status,
//       };
  
//       const [walletsummary] = await connection.query(
//         "INSERT INTO walletsummary (unique_id, tran_id, type, amount, status, description, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?)",
//         [
//           unique_id,
//           tran_id,
//           "CR",
//           voucher[0].amount,
//           "Success",
//           JSON.stringify(description),
//           amount,
//         ]
//       );
//         //added UPDATE wallet balances
//       await connection.query(
//         "UPDATE wallet SET wallet = ? WHERE unique_id = ?",
//         [amount, unique_id]
//       );
      
  
//       return res.status(200).json({
//         statuscode: "01",
//         status: "Success",
//         message: `Voucher Redeem Successfully, Balances ${amount}`,// changed 0 to amount
//       });
//     } else {
  
//      // changed res { message: "Mac id not matched!" } 
//       return res.status(200).json({ 
//         "status": false,
//         "statuscode": "2",
//         "message": "Token expired"
//     }); 
//     }
  
//     // console.log(users[0].customer_id);
//     // console.log(users[0].user_type);
//     // console.log(users[0].coordinates);
//     // console.log(users[0].device_Id);
//     // console.log(users[0].os);
//   }catch (error) {
//     console.error(error);
//     return res.status(500).json({
//     status: "fail",
//     statuscode: "02",
//     message: "Failed to create Remitter",
//   });
// }finally {
//   if (connection) {
//     await connection.release();
//   }
// }

// });

// Inter Group Transfer

router.post("/Fetch-Users", TokenAuth, async (req, res) => {
  const apikey = req.headers.key;
  const { unique_id } = req.users;
  const { mobile_number } = req.body;

  if (!apikey) {
    return res
      .status(422)
      .json({ status: "fail", message: "Please provide apikey" });
  }
  if (!mobile_number) {
    return res
      .status(422)
      .json({ status: "fail", message: "Please provide mobile number" });
  }
  const connection = await poolPromise().getConnection();
  
  try{
    if (isNumeric(mobile_number)) {
      if (String(mobile_number).length === 10) {
  
        const sql = "SELECT id FROM secret_key WHERE secret_key = ?";
        const value = [apikey];
        const [fetchedKey] = await connection.query(sql, value);
        // return res.json({fetchedKey})
        if (fetchedKey.length === 0) {
          return res
            .status(422)
            .json({ status: "fail", message: "INVALID API KEY." });

        } else {

          const key = Date.now();
          const sql1 = "SELECT * FROM auths WHERE unique_id = ?";
          const value1 = [unique_id];
          const [sender] = await connection.query(sql1, value1);
          console.log("sender",sender,"sender")
          const sql2 = "SELECT * FROM auths WHERE mobile = ?";
          const value2 = [mobile_number];
          const [receiver] = await connection.query(sql2, value2);
          const [merchant_result] = await connection.query("SELECT * FROM merchants WHERE unique_id = ?", [unique_id]);
          // return res.json({merchant_result})
          console.log("receiver",receiver,"receiver")
          
          if (receiver.length > 0 && sender[0].user_type === "Merchant" || (receiver[0].user_type !== "Merchant" && sender[0].user_type === "User" )) {
            const receiver_unique_id = receiver[0].unique_id;
            const receiver_name = receiver[0].name;
            const [results] = await connection.query(
              "SELECT MAX(`tnxid`) as tnxid FROM intergroup_transfer"
            );
        // return res.json({results})
    
            var tran_id_ = Number(results[0].tnxid) || 0;
            var tnxid = tran_id_ + 1
            try
            {
              
            // return res.json({receiver})
            const [intergroup_transfer2] = await connection.query(
              "INSERT INTO intergroup_transfer (`tnxid`,`sender_unique_id`, `receiver_unique_id`, `receiver_name`,`key`,`status`) VALUES (?, ?, ?, ?, ?, ?)",
              [
                tnxid,
                unique_id,
                receiver_unique_id,
                merchant_result[0].authorized_person_name,
                key,
                "Search",
              ]
            );
          }
          catch (error)
          {
            console.log(error);
            }
            // return res.json({intergroup_transfer2})
            return res.status(200).json({
              statuscode: "1",
              status: "success",
              data: {
                key,
                name: merchant_result[0].authorized_person_name,
                mobile:mobile_number
              }
            });

          } else {
            return res.status(422).json({
              status: "Failed",
              message: "users data not found.",
            });
          }
        }
      } else {
        return res.status(422).json({
          status: "Failed",
          message: "mobile number must be exactly 10 characters long.",
        });
      }
    } else {
      return res.status(422).json({
        status: "Failed",
        message: "mobile number must contain only numeric characters.",
      });
    }
  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "Failed",
    statuscode: "02",
    message: "Failed to create intergroup_transfer",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

});

router.post("/Intergroup-transfer", TokenAuth, async (req, res) => {
  const apikey = req.headers.key;
  // const { unique_id } = req.users;
  const { order_id, Key, Amount } = req.body; //pending  order_id unique
 console.log("Key1703590261799",!order_id||!Key||!Amount)
  if (!apikey) {
    return res
      .status(422)
      .json({ status: "fail", message: "Please provide apikey" });
  }
  const connection = await poolPromise().getConnection();
  
  try{

    if (!order_id || !Key || !Amount) {
      return res.status(422).json({
        status: "Failed",
        message: "Please provide order_id, Key and Amount ",
      }); 
    } else {
      const sql = "SELECT id FROM secret_key WHERE secret_key = ?";
      const value = [apikey];
      const [fetchedKey] = await connection.query(sql, value);
      if (fetchedKey.length === 0) {
        return res
        .status(422)
        .json({ status: "fail", message: "INVALID API KEY." });
      } else {
        const sql4 = "SELECT * FROM intergroup_transfer WHERE order_id = ?";
        const value4 = [order_id];
        const [intergroup_transfer4] = await connection.query(sql4, value4);

          const sql3 = "SELECT * FROM intergroup_transfer WHERE `key` = ?";
          const value3 = [Key];
        const [intergroup_transfer1] = await connection.query(sql3, value3);
        //console.log(`${intergroup_transfer1.length > 0 && intergroup_transfer4.length !== 0}`)
         return res.json({intergroup_transfer1,intergroup_transfer4})
          if(intergroup_transfer1.length > 0 && intergroup_transfer4.length !== 0 && intergroup_transfer1[0].status !== "Success"){
              var sender_unique_id = intergroup_transfer1[0].sender_unique_id;
              var receiver_unique_id = intergroup_transfer1[0].receiver_unique_id;
              //sender 
              const sql1 = "SELECT * FROM auths a LEFT JOIN merchants m  on a.unique_id = m.unique_id   WHERE a.unique_id = ?";
              const value1 = [sender_unique_id];
            const [sender] = await connection.query(sql1, value1);
              console.log("sender",sender,"sender");
              const sendcustomer_id = sender[0].customer_id;
              const sender_mobile = sender[0].mobile;
              const sender_name = sender[0].authorized_person_name;

              //receiver
              const sql2 = "SELECT * FROM auths a LEFT JOIN merchants m  on a.unique_id = m.unique_id   WHERE a.unique_id = ?";
              const value2 = [receiver_unique_id];
              const [receiver] = await connection.query(sql2, value2);
              console.log("receiver",receiver,"receiver")
              const customer_id = String(receiver[0].customer_id);
              const mobile = receiver[0].mobile;
              const receiver_name = receiver[0].authorized_person_name;
            // return res.json({sender,receiver})
              // generate transaction_at
              const transaction_id  = Date.now().toString();

              const [users_services] = await connection.query(
                "SELECT * FROM user_services WHERE unique_id = ? and service_id = ?",
                [sender[0].unique_id,2]
            );
            
            // return res.json({users_services})
            // return res.json({users_services,sendcustomer_id})
                console.log("users_services",users_services,"users_services");

              const [wallet] = await connection.query(
                "SELECT * FROM wallets WHERE unique_id = ?",
                [sender_unique_id]
            );
            //  return res.json({wallet})
            
          
              if (wallet[0].status === "Disable" || wallet[0].status === "Freeze"){
                return res.status(422).json({
                  status: "Failed",
                  message: `wallet Status is ${wallet[0].status}`,
                });
              }
              if (users_services[0].status === "Disable"){
                return res.status(422).json({
                  status: "Failed",
                  message: "users_services Status is Disable",
                });
              }
              
            //console.log(`${ sender[0].user_type === "Merchant" || (receiver[0].user_type !== "Merchant" && sender[0].user_type === "User" ) }`)
          if ( sender[0].user_type === "Merchant" || (receiver[0].user_type !== "Merchant" && sender[0].user_type === "User" ) ) {

            if ( Number(wallet[0].wallet) >= Number(Amount)){

              const [sende_wallet] = await connection.query( // doubt which wallet
                "UPDATE wallet SET wallet = wallet - ? WHERE unique_id = ? ",
                [Number(Amount), sender_unique_id]
              );
              if(sende_wallet.affectedRows === 1){
                // walletsummary creation 
                const [results] = await connection.query(
                  "SELECT MAX(`tran_id`) as max_tran_id FROM walletsummary"
                );
                // return res.json({results})
                var tran_id_ = results[0].max_tran_id || 0;
                var tran_id_w_ = tran_id_ + 1;
                var description_ = `Rs.${Number(Amount)}/- Successful Transfer to ${receiver_name} | ${mobile}`;
        
                 //fetching sender_clo_bal from wallet

                 var [sender_wallet] = await connection.query(
                  "SELECT * FROM wallets WHERE unique_id = ?",
                  [sender_unique_id]
                );
                // return res.json({sender_wallet})

                var sender_wallet = sender_wallet[0].wallet
        
                await connection.query(
                  "INSERT INTO walletsummary (unique_id, tran_id, type, amount, status, description, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  [
                    sender_unique_id,
                    tran_id_w_,
                    "DR",
                    Number(Amount),
                    "Success",
                    description_,
                    sender_wallet,
                  ]
                );
                const [receiver_wallet] = await connection.query(
                  "UPDATE wallet SET wallet = wallet + ? WHERE unique_id = ? ",
                  [Number(Amount), receiver_unique_id]
                );
                // return res.json({receiver_wallet,receiver_unique_id})

                if(receiver_wallet.affectedRows === 1){

                  // walletsummary creation 
                const [results] = await connection.query(
                  "SELECT MAX(`tran_id`) as max_tran_id FROM walletsummary"
                );
        
                var tran_id_ = results[0].max_tran_id || 0;
                var tran_id_w_ = tran_id_ + 1;
                var description_ = `Rs.${Number(Amount)}/ Receive in your Wallet Send from ${sender_mobile} | ${sender_name}`;
        
                

                  //fetching receiver_clo_bal from wallet
                  
                  const [receiver_wallet] = await connection.query(
                    "SELECT * FROM wallets WHERE unique_id = ?",
                    [receiver_unique_id]
                  );
                 

                var receiver_wallett = receiver_wallet[0].wallet
        
                await connection.query(
                  "INSERT INTO walletsummary (unique_id, tran_id, type, amount, status, description, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  [
                    receiver_unique_id,
                    tran_id_w_,
                    "CR",
                    Number(Amount),
                    "Success",
                    description_,
                    receiver_wallett,
                  ]
                );

                 
                 
                  const [sende_wallet] = await connection.query(
                    "UPDATE intergroup_transfer SET order_id = ?, amount = ?, transaction_at = ?, sender_clo_bal = ?, receiver_clo_bal = ?, status = ? WHERE `key` = ? ",
                    [order_id, Number(Amount), transaction_id, sender_wallet, receiver_wallet[0].wallet,"Success", Key]
                  );

                  if(sende_wallet.affectedRows === 1){
                    return res.status(200).json({
                      statuscode: "1",
                      status: "success",
                      data: { customer_id: `XXXXX${customer_id.slice(-4)}`, mobile:mobile, receiver_name: receiver_name, transfer_amount: Number(Amount), Transaction_id:transaction_id, sender_customer_id:sendcustomer_id , order_id:order_id ,debit : Number(Amount) }
                    });
                  }else{
                    return res.status(422).json({
                      status: "Failed",
                      message: "intergroup_transfer updates failed",
                    });
      
                  }
                 

                }else{
                  return res.status(422).json({
                    status: "Failed",
                    message: "receiver wallet updates failed",
                  });
    
                }

              } else{
                return res.status(422).json({
                  status: "Failed",
                  message: "sende_wallet updates failed",
                });
  
              }
              
            } else{
              return res.status(422).json({
                status: "Failed",
                message: "Insufficient funds",
              });

            }

            } else {
              return res.status(422).json({
                status: "Failed",
                message: "Sender is User and Receiver is a merchant.",
              });
            }
        } else {
            return res.status(422).json({
              status: "Failed",
              message: "users data not found or order id is already exists",
            });
          }
        
      }
      
    }

  }catch (error) {
    console.error(error);
    return res.status(500).json({
    status: "Failed",
    statuscode: "02",
    message: "Failed to create intergroup_transfer",
  });
}finally {
  if (connection) {
    await connection.release();
  }
}

});

//Inter Group Transfer


function createTree(data) {
  const tree = [];
  const nodes = {};
  data.forEach((item) => {
    nodes[item.id] = { ...item, children: [] };
  });
  Object.values(nodes).forEach((node) => {
    if (node.parent_id !== 0) {
      const parent = nodes[node.parent_id];
      if (parent) {
        parent.children.push(node);
      }
    } else {
      tree.push(node);
    }
  });

  return tree;
}
function createTree_service(data, idKey, parentKey) {
  const tree = [];
  const nodes = {};
  data.forEach((item) => {
    nodes[item[idKey]] = { ...item, children: [] };
  });
  Object.values(nodes).forEach((node) => {
    if (node[parentKey] !== 0) {
      const parent = nodes[node[parentKey]];
      if (parent) {
        parent.children.push(node);
      }
    } else {
      tree.push(node);
    }
  });

  return tree;
}
function isNumeric(value) {
  const regex = /^[0-9]+$/;
  return regex.test(value);
}

// Function to get numbers (as strings) based on user type
function getNumbersByUserType(userType) {
  // Normalize and split the userType string into roles
  const roles = userType.toLowerCase().split(" & ").sort();
  
  // Find and return the numbers associated with the matching roles
  return Object.entries(roleMappings).reduce((acc, [key, value]) => {
    // Check if every role in the input is present in the current key
    if (roles.every(role => key.toLowerCase().includes(role))) {
      acc.push(...value);
    }
    return acc;
  }, []);
}
function preprocessData(data) {
  const processedData = {};

  data.forEach(item => {
    const parentId = item.parent_id || 0;
    if (!processedData[parentId]) {
      processedData[parentId] = [];
    }
    processedData[parentId].push(item);
  });

  return processedData;
}

// function createTreeT(data, parentId, processedData) {
//   const tree = processedData[parentId] || [];

//   tree.forEach(node => {
//     if (processedData[node.category_id]) {
//       node.children = createTree(data, node.category_id, processedData);
//     }
//   });

//   return tree;
// }
function createTreeT(data) {
  const tree = [];
  const groupedCategories = {};

  // Group categories by category_group
  data.forEach((item) => {
    if (!groupedCategories[item.category_group]) {
      groupedCategories[item.category_group] = [];
    }
    groupedCategories[item.category_group].push(item);
  });

  // Create tree based on category_group
  Object.values(groupedCategories).forEach((group) => {
    const parentNode = {
      category_group: group[0].category_group,
      children: [],
    };

    group.forEach((item) => {
      parentNode.children.push({
        category_id: item.category_id,
        user_type: item.user_type,
        category_icon: item.category_icon,
        category_name: item.category_name,
        treeview: item.treeview,
        parent_id: item.parent_id,
        order_by: item.order_by,
        status: item.status,
      });
    });

    tree.push(parentNode);
  });

  return tree;
}
function createTreeN(data) {
  const tree = [];

  // Create a dictionary to store categories by their IDs
  const categoryMap = {};

  // Fill the dictionary and initialize children arrays
  data.forEach((item) => {
    categoryMap[item.category_id] = { ...item, children: [] };
  });

  // Traverse the data to link children to their parents
  data.forEach((item) => {
    if (item.parent_id !== 0) {
      const parent = categoryMap[item.parent_id];
      if (parent) {
        parent.children.push(categoryMap[item.category_id]);
      }
    } else {
      // If parent_id is 0, it's a top-level category
      tree.push(categoryMap[item.category_id]);
    }
  });

  return tree;
}
module.exports = router;
