// const express = require("express");
// const crypto = require("crypto");
// const router = express.Router();
// const poolPromise = require("../util/connectionPromise");
// const TokenAuth = require("../globalfunction/TokenAuth.js");
// const moment = require("moment-timezone");
// moment().tz("Asia/Calcutta").format();
// process.env.TZ = "Asia/Calcutta";
// const { isEmpty } = require("lodash");
// const multer = require("multer");
// const {
//   fetchRechargePlans,
//   fetchConnectionDetails,
//   statusCheck,
//   fetchViewBill,
//   recharge,
// } = require("../globalfunction/thirdpartyapis");

// router.get("/get-category", async (req, res) => {
//   const connection = await poolPromise().getConnection();
//   try {
    
  
//   const [results] = await connection.query(
//     'SELECT * FROM services_managers WHERE category_group = "Utility" AND status = "Enable"');

//   const tree = createTreeN(results);
//   await connection.release();
//   return res
//     .status(200)
//       .json({ status: "success", statuscode: "01", data: tree });
//     } catch (error) {
//     return res.json({
//       statuscode: "2",
//       status: "failed",
//       message:"Internal Server Error"
//     })
//     }
// });
// router.get("/get-category/:subtype", async (req, res) => {
//   const connection = await poolPromise().getConnection();
//   const subtype = req.params.subtype
//   try
//   {
//     const [results] = await connection.query(
//       'SELECT * FROM services_managers WHERE category_group = ? AND status = "Enable"',[subtype]);
  
//     // const tree = createTreeN(results);
//     await connection.release();
//     return res
//       .status(200)
//       .json({ status: "success", statuscode: "01", data: results });

  
//   } catch (error)
//   {
//     return res.json({
//       statuscode: "2",
//       status: "failed",
//       message:"Internal Server Error"
//     })
//   }
// })
  
// router.get("/get-location", async (req, res) => {
//   const connection = await poolPromise().getConnection();
//   let query = "SELECT * FROM location WHERE status = 'Enable'";
//   const queryValues = [];

//   if (req.query.type) {
//     query += " AND type = ?";
//     queryValues.push(req.query.type);
//   }

//   const [results] = await connection.query(query, queryValues);

//   const updatedArray = results.map(({ status, id, type, ...rest }) => rest);
//   await connection.release();
//   return res
//     .status(200)
//     .json({ status: "success", statuscode: "01", data: updatedArray });
// });

// router.get("/get-operator", async (req, res) => {
//   const connection = await poolPromise().getConnection();

//   const query = "SELECT * FROM operator WHERE cate_id = ? AND status = ? ";
//   const queryValues = [req.query.cate_id, "Enable"];

//   const [results] = await connection.query(query, queryValues);
//   // return res.json({results})
//   const updatedArray = results.map(({ status, id, ...rest }) => rest);

//   await connection.release();
//   return res
//     .status(200)
//     .json({ status: "success", statuscode: "01", data: updatedArray });
// });

// router.get("/get-operator-params", async (req, res) => {
//   // return res.json({op_id})
//   if (!req.query.op_id) {
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Please provide operator",
//     });
//   }

//   const connection = await poolPromise().getConnection();
//   const query = "SELECT * FROM operator_parameters WHERE op_id = ?";
//   const queryValues = [req.query.op_id];

//   const [results] = await connection.query(query, queryValues);

//   if (isEmpty(results)) {
//     await connection.release();
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "No parameters found",
//     });
//   }

//   const updatedArray = results.map(
//     ({
//       status,
//       cat_id,
//       op_id,
//       category,
//       operator_Name,
//       param_id,
//       param_name,
//       regex,
//       param_label,
//       message,
//       id,
//       ...rest
//     }) => ({
//       param_id,
//       param_label,
//       param_name,
//       regex,
//       message,
//     })
//   );
//   await connection.release();
//   return res.status(200).json({
//     status: "success",
//     statuscode: "01",
//     cat_id: results[0].cat_id,
//     category: results[0].category,
//     op_id: results[0].op_id,
//     operator_Name: results[0].operator_Name,
//     data: updatedArray,
//   });
// });

// router.get("/fetch-connection-details/:mob", TokenAuth, async (req, res) => {
//   const mobile_number = req.params.mob;
//   const response = await fetchConnectionDetails(mobile_number);
//   const data = response.data.data;

//   const connection = await poolPromise().getConnection();

//   const query =
//     "SELECT * FROM operator_wish_api,location WHERE operator_wish_api.api_Id = ? and circle_id = ? ";
//   const queryValues = [data.operatorId, data.circleId];

//   const [results] = await connection.query(query, queryValues);

//   const { op_id, operator_name, circle_id, circle_name } = results[0];

//   await connection.release();
//   return res.status(200).json({
//     status: "success",
//     statuscode: "01",
//     data: { op_id, operator_name, circle_id, circle_name },
//   });
// });

// router.get(
//   "/fetch-recharge-plans/:operator/:circle?",
//   TokenAuth,
//   async (req, res) => {
//     const operator = req.params.operator;
//     const circle = req.params.circle;
//     let cn = "";
//     if (req.query.cn) {
//       cn = req.query.cn;
//     }
//     if (!operator) {
//       return res.status(500).json({
//         status: "failed",
//         statuscode: "02",
//         statuscode: "02",
//         message: "Please provide operator",
//       });
//     }

//     const connection = await poolPromise().getConnection();

//     const query = "SELECT * FROM operator_wish_api WHERE op_id = ?";
//     const queryValues = [operator];

//     const [results] = await connection.query(query, queryValues);

//     const response = await fetchRechargePlans(results[0].api_Id, circle, cn);
//     const updatedArray = response.data
//       ? response.data.plans.map(({ operatorId, ...rest }) => rest)
//       : [];
//     if (response.success) {
//       await connection.release();
//       return res.status(200).json({
//         status: "success",
//         statuscode: "01",
//         api_id: results[0].api_Id,
//         data: updatedArray,
//       });
//     } else {
//       await connection.release();
//       return res.status(200).json({
//         status: "failed",
//         statuscode: "01",
//       });
//     }
//   }
// );

// router.post("/fetch-bills", TokenAuth, async (req, res) => {

//   try{

//   const { op_id, accountno, additional_params } = req.body;
//   let types;
//   if (req.body.types) {
//     types = req.body.types;
//   }
// const merchant_result = await connection.query("SELECT * from merchants where unique_id = ? ",[req.users.unique_id])
//  let unique_id   = req.users.unique_id
//  let user_type   = req.users.user_type
//  let customer_id =  merchant_result[0].customer_id
//  let name = merchant_result[0].authorized_person_name;

//   const connection = await poolPromise().getConnection();

//   let query = "SELECT * FROM operator_wish_api WHERE op_id = ? ";
//   if (types) {
//     query += " AND types = '" + types + "'";
//   }
//   const [results] = await connection.query(query, [op_id]);
//   if (!results) {
//     await connection.release();
//     return res.status(200).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Invalid Data",
//     });
//   }
//   const {response , request} = await fetchViewBill(
//     results[0].api_Id,
//     accountno,
//     additional_params
//   );
//   console.log({ response: response.data });

//   // Parse the JSON string into an object
// const responseObject = response

// // Extract billAmount from the data array
// const billAmount =  response.data.data[0].billAmount;
// const userName =  response.data.data[0].userName
// console.log('Bill Amount:', billAmount)

//    //getting data fro operator table
//    let operatorQuery = "SELECT * FROM operator WHERE op_id = ? ";
//   const [operatorData] = await connection.query(operatorQuery, [op_id]);


//   //console.log('operatorData',operatorData)


//   // First, retrieve the maximum order_id from the fetch_bill table
// const [rows] = await connection.query('SELECT MAX(order_id) AS max_order_id FROM fetch_bill');

// // Extract the maximum order_id from the result
// const maxOrderId = rows[0].max_order_id;

// // Increment the maximum order_id by 1
// const newOrderId = parseFloat(maxOrderId) + 1;


//   const sql = `
//   INSERT INTO fetch_bill (unique_id, user_type, customer_name, utility_account_no,ad,operator_id,response,request,date,operator_name,operator_icon,amount,order_id)
//   VALUES (?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?, ? ,?)
// `;

// // Execute the query
// const [result] = await connection.query(sql, [
//   unique_id,
//  user_type,
//  userName,
//  accountno,
//  JSON.stringify(additional_params),
//  op_id,
//  JSON.stringify(response.data),
//  JSON.stringify(request),
//  new Date(),
//  operatorData[0].operator_name,
//  operatorData[0].icon,
//  billAmount,
//  newOrderId
// ]);


//   if (response.data.success) {
//     await connection.release();
//     return res.status(200).json({
//       status: "success",
//       statuscode: "01",
//       data: response.data.data,
//     });
//   } else {
//     await connection.release();
//     return res.status(200).json({
//       status: "failed",
//       statuscode: "02",
//       message: response.data.message.text,
//     });
//   }
//   }catch(error){
//        return res.send({statuscode:'02',status:'failed',message:'internal server error'})
//   }
// });

// router.post("/payment", TokenAuth, async (req, res) => {
//   const parseString = require("xml2js").parseString;
//   const unique_id = req.users.unique_id;
//   const package_id = req.users.package_id;
//   const expiry = req.users.package_expiry;
//   console.log(expiry)
//   let order_id = "";
//   let operator_api_result;
//   let types;
//   const {
//     reqid,
//     op_id,
//     amt,
//     accountno,
//     additional_params,
//     coordinates,
//     client_ref_id,
//     customer_name,
//   } = req.body;
//   if (req.body.types) {
//     types = req.body.types;
//   }

//   let responseG, urlG;
//   const validation_Parameters = {
//     op_id,
//     amt,
//     accountno,
//     coordinates,
//     client_ref_id,
//   };
//   function validateField(value, fieldName) {
//     if (!value) {
//       return "Please provide " + fieldName;
//     }
//     return null;
//   }

//   const validationErrors = [];
//   for (const key in validation_Parameters) {
//     if (Object.hasOwnProperty.call(validation_Parameters, key)) {
//       const element = validation_Parameters[key];
//       const error = validateField(element, key);
//       if (error) {
//         validationErrors.push(error);
//       }
//     }
//   }

//   if (validationErrors.length > 0) {
//     return res.status(400).send({
//       status: "failed",
//       statuscode: "02",
//       message: validationErrors,
//     });
//   }

//   const connection = await poolPromise().getConnection();

//   try {
//     const [[utilityData]] = await connection.query(
//       `SELECT * FROM utility WHERE client_ref_id = ?`,
//       [client_ref_id]
//     );
//     if (utilityData) {
//       return res.status(200).send({
//         status: "failed",
//         statuscode: "02",
//         message: "Duplicate CLIENT_REF_ID",
//       });
//     }
    
//     const expiryDate = new Date(expiry);
//     const now = new Date();
//     if (expiryDate < now) {
//       connection.release();
//       return res.status(200).send({
//         status: "failed",
//         statuscode: "02",
//         message: "Your Plan expired",
//       });
//     }

//     const [[walletResult]] = await connection.query(
//       `SELECT * FROM wallets WHERE unique_id = ? `,
//       [unique_id]
//     );

//     if (walletResult.status === "Disable" || walletResult.status === "Freeze") {
//       return res.status(404).json({
//         status: "failed",
//         statuscode: "02",
//         message: `Your wallet has been ${walletResult.status}`,
//       });
//     }

//     const balance = walletResult.wallet;
//     if (amt > balance) {
//       connection.release();

//       return res.status(200).send({
//         status: "failed",
//         statuscode: "02",
//         message: "Insufficient account balance",
//       });
//     }
//     //op_id get category from operator table
//     // category user_service 
//     // utility duplicate
//     let opQuery = `SELECT * FROM operator_wish_api WHERE op_id = ? AND STATUS="True" `;
//     if (types) {
//       opQuery += "AND types = '" + types + "'";
//     }

//     const [[operatorApiResult]] = await connection.query(opQuery, [op_id]);
//     if (!operatorApiResult) {
//       return res.status(200).json({
//         status: "failed",
//         statuscode: "02",
//         message: "Operator down",
//       });
//     }
//     operator_api_result = operatorApiResult;
//     let [[max_order_id]] = await connection.query(
//       "SELECT MAX(`order_id`) AS max_order_id FROM utility"
//     );
//     let order_id = max_order_id.max_order_id;
//     order_id = parseInt(order_id) + 1;
//     order_id = String(order_id);

//     let holdbalance = walletResult.wallet;
//     if (amt > balance) {
//       connection.release();
//       let utility = {
//         unique_id: unique_id,
//         user_type: req.users.user_type,
//         order_id: order_id,
//         client_ref_id: null,
//         operator_name:
//           operatorApiResult.operator_name + "-" + (types ? types : ""),
//         customer_name,
//         utility_account_no: accountno,
//         ad: JSON.stringify(additional_params),
//         amount: amt,
//         status: "Failed",
//         oprefno: null,
//         earned: null,
//         tds: null,
//         txid: null,
//         coordinates: coordinates,
//         request: null,
//         op_id: op_id,
//         response: "INSUFFICIENT FUNDS",
//       };
//       await connection.query(
//         `INSERT INTO utility (\`${Object.keys(utility).join(
//           "`,`"
//         )}\`) VALUES (${Object.keys(utility)
//           .map((item, key) =>
//             key == Object.keys(utility).length - 1 ? "?" : "?,"
//           )
//           .join("")})`,
//         Object.values(utility)
//       );
//       return res.status(200).send({
//         status: "failed",
//         statuscode: "02",
//         message: "Insufficient account balance",
//       });
//     }

//     const [[utilitySchemeResult]] = await connection.query(
//       `SELECT * FROM utility_scheme WHERE package_id = ? AND op_id = ?`,
//       [package_id, op_id]
//     );

//     const commission_type = utilitySchemeResult.com_type;
//     const commission = utilitySchemeResult.commission;
//     let newAmount = amt;
//     let commissionAmount = 0;
//     let net_debited = 0;
//     if (commission_type === "Fixed") {
//       commissionAmount = commission;
//       newAmount -= commissionAmount;
//       newAmount += (commissionAmount / 100) * 5;
//       holdbalance -= newAmount;
//       net_debited = newAmount;
//     } else {
//       commissionAmount = (newAmount / 100) * commission;
//       newAmount -= commissionAmount;
//       newAmount += (commissionAmount / 100) * 5;
//       holdbalance -= newAmount;
//       net_debited = newAmount;
//     }

//     await connection.query("UPDATE wallets SET wallets = ? WHERE unique_id = ?", [
//       holdbalance,
//       unique_id,
//     ]);

//     let utility = {
//       unique_id: unique_id,
//       user_type: req.users.user_type,
//       order_id: order_id,
//       client_ref_id: client_ref_id,
//       operator_name: operatorApiResult.operator_name,
//       customer_name,
//       utility_account_no: accountno,
//       ad: JSON.stringify(additional_params),
//       amount: amt,
//       net_debited: net_debited,
//       status: "Success",
//       oprefno: null,
//       earned: commissionAmount,
//       tds: (commissionAmount / 100) * 5,
//       txid: null,
//       op_id: op_id,
//       coordinates: coordinates,
//     };
//     await connection.query(
//       `INSERT INTO utility (\`${Object.keys(utility).join(
//         "`,`"
//       )}\`) VALUES (${Object.keys(utility)
//         .map((item, key) =>
//           key == Object.keys(utility).length - 1 ? "?" : "?,"
//         )
//         .join("")})`,
//       Object.values(utility)
//     );
//     let acno = accountno;
//     if (req.query.rsa == 1) {
//       acno = rsaEncryption(accountno);
//     }

//     const { response, url } = await recharge(
//       order_id,
//       acno,
//       operatorApiResult.api_Id,
//       amt,
//       additional_params
//     );
//     urlG = url;

//     let jsonResponse = {};
//     parseString(response.data, function (err, result) {
//       if (err) {
//         console.error(err);
//       } else {
//         jsonResponse = result;
//       }
//     });

//     if (
//       (jsonResponse &&
//         jsonResponse.txStatus &&
//         jsonResponse.txStatus.queryStatus &&
//         jsonResponse.txStatus.queryStatus[0] === "UNEXPECTED ERROR") ||
//       (jsonResponse &&
//         jsonResponse.recharge &&
//         jsonResponse.recharge.status &&
//         jsonResponse.recharge.status[0] === "FAILURE")
//     ) {
//       await connection.query(
//         "UPDATE wallets SET wallet = ? WHERE unique_id = ?",
//         [balance, unique_id]
//       );
//       let utility = {
//         unique_id: unique_id,
//         user_type: req.users.user_type,
//         order_id: order_id,
//         client_ref_id: client_ref_id,
//         operator_name:
//           operatorApiResult.operator_name + "-" + (types ? types : ""),
//         customer_name,
//         utility_account_no: accountno,
//         ad: JSON.stringify(additional_params),
//         amount: amt,
//         status: "Failed",
//         oprefno: null,
//         earned: null,
//         tds: null,
//         txid: null,
//         coordinates: coordinates,
//         request: url,
//         response: JSON.stringify(jsonResponse),
//       };
//       console.log(jsonResponse);

//       await connection.query(
//         `UPDATE utility SET ${Object.keys(utility).join(
//           "= ?,"
//         )}=? WHERE order_id = ?`,
//         [...Object.values(utility), utility.order_id]
//       );

//       if (jsonResponse.recharge?.status[0] === "FAILURE") {
//         return res.status(200).send({
//           status: jsonResponse.recharge.status[0],
//           statuscode: "02",
//           amount: amt,
//           errorMsg: jsonResponse.recharge.errorMsg[0],
//         });
//       } else if (jsonResponse.txStatus?.queryStatus[0] === "UNEXPECTED ERROR") {
//         return res.status(200).send({
//           status: jsonResponse.txStatus.queryStatus[0],
//           statuscode: "02",
//           amount: amt,
//           errorMsg: jsonResponse.txStatus.errorMsg[0],
//         });
//       }
//     } else {
//       if (
//         (jsonResponse &&
//           jsonResponse.recharge &&
//           jsonResponse.recharge.status &&
//           jsonResponse.recharge.status[0] === "SUCCESS") ||
//         (jsonResponse &&
//           jsonResponse.recharge &&
//           jsonResponse.recharge.status &&
//           jsonResponse.recharge.status[0] === "SUCCESSPENDING")
//       ) {
//         let utility = {
//           unique_id: unique_id,
//           user_type: req.users.user_type,
//           order_id: order_id,
//           client_ref_id: client_ref_id,
//           operator_name:
//             operatorApiResult.operator_name + "-" + (types ? types : ""),
//           customer_name,
//           utility_account_no: accountno,
//           ad: JSON.stringify(additional_params),
//           amount: amt,
//           status: "Success",
//           oprefno: jsonResponse.recharge.opRefNo[0],
//           earned: commissionAmount,
//           tds: (commissionAmount / 100) * 5,
//           txid: jsonResponse.recharge.txId[0],
//           coordinates: coordinates,
//           request: url,
//           response: JSON.stringify(jsonResponse),
//         };
//         let [[max_tran_id]] = await connection.query(
//           "SELECT MAX(`tran_id`) AS max_tran_id FROM walletsummary"
//         );
//         let tran_id = max_tran_id.max_tran_id;
//         tran_id = parseInt(tran_id) + 1;
//         const walletSummary = {
//           unique_id: unique_id,
//           tran_id: tran_id,
//           type: "DR",
//           amount: newAmount,
//           status: "Success",
//           description: `For ${operatorApiResult.operator_name} ${
//             operatorApiResult.category
//           } With Rs.${newAmount.toFixed(2)}/- ${accountno}`,
//           closing_balance: holdbalance,
//         };
//         await connection.query(
//           `INSERT INTO walletsummary (\`${Object.keys(walletSummary).join(
//             "`,`"
//           )}\`) VALUES (${Object.keys(walletSummary)
//             .map((item, key) =>
//               key == Object.keys(walletSummary).length - 1 ? "?" : "?,"
//             )
//             .join("")})`,
//           Object.values(walletSummary)
//         );
//         await connection.query(
//           `UPDATE utility SET ${Object.keys(utility).join(
//             "= ?,"
//           )}=? WHERE order_id = ?`,
//           [...Object.values(utility), utility.order_id]
//         );
//         return res.status(200).send({
//           status: "success",
//           statuscode: "01",
//           amount: amt,
//           order_id: order_id,
//           oprefno: jsonResponse.recharge.opRefNo[0],
//         });
//       }
//     }
//   } catch (error) {
//     console.log(error);
//     let utility = {
//       unique_id: unique_id,
//       user_type: req.users.user_type,
//       order_id: order_id,
//       client_ref_id: client_ref_id,
//       operator_name: operator_api_result.operator_name,
//       utility_account_no: accountno,
//       ad: JSON.stringify(additional_params),
//       amount: amt,
//       status: "Failed",
//       oprefno: null,
//       earned: null,
//       tds: null,
//       txid: null,
//       coordinates: coordinates,
//       request: urlG,
//       response: responseG,
//     };
//     await connection.query(
//       `UPDATE utility SET ${Object.keys(utility).join(
//         "= ?,"
//       )}=? WHERE order_id = ?`,
//       [...Object.values(utility), utility.order_id]
//     );
//     return res.status(500).send({
//       status: "fail",
//       statuscode: "02",
//       message: "Something went wrong!",
//     });
//   }finally {
//     if (connection) {
//       await connection.release();
//     }
//   }
// });

// router.get("/utility-history", TokenAuth, async (req, res) => {
//   let limit = req.query.limit ? parseInt(req.query.limit) : 10;
//   let page = req.query.page ? parseInt(req.query.page) : 1;

//   const connection = await poolPromise().getConnection();

//   try{
    
//   const [totalRecords] = await connection.query(
//     `SELECT COUNT(*) AS totalRecords FROM utility WHERE unique_id = ?`,
//     [req.users.unique_id]
//   );

//   const offset = (page - 1) * limit;
//   const totalPages = Math.ceil(totalRecords[0].totalRecords / limit);

//   const [utilityHistory] = await connection.query(
//     `SELECT operator.icon, operator.category, utility.* FROM utility JOIN operator ON utility.op_id = operator.op_id WHERE utility.unique_id = ? ORDER BY \`date\` DESC
//    LIMIT ? OFFSET ?`,
//     [req.users.unique_id, limit, offset]
//   );

//   const updatedData = (item) => {
//     const utcTimestamp = item.date;
//     const localDate = moment
//       .utc(utcTimestamp)
//       .local()
//       .format("YYYY-MM-DD HH:mm:ss");

//     console.log("Local Date:", localDate);
//     return {
//       order_id: item.order_id,
//       date: localDate,
//       category: item.category,
//       icon: item.icon,
//       operator_name: item.operator_name,
//       customer_name: item.customer_name,
//       utility_account_no: item.utility_account_no,
//       amount: item.amount,
//       status: item.status,
//       oprefno: item.oprefno,
//       earn: item.earned,
//     };
//   };
//   return res.status(200).send({
//     status: "success",
//     statusCode: "01",
//     data: {
//       totalRecords: totalRecords[0].totalRecords,
//       totalPages: totalPages,
//       currentPage: page,
//       utilityHistory: utilityHistory.map((item) => updatedData(item)),
//     },
//   });
//   }finally {
//     if (connection) {
//       await connection.release();
//     }
//   }


// });

// router.get("/utility-history/:orderid", TokenAuth, async (req, res) => {
//   if (isEmpty(req.params.orderid)) {
//     return res.status(500).send({
//       status: "fail",
//       statusCode: "02",
//       message: "Please provide order id",
//     });
//   }
//   const connection = await poolPromise().getConnection();

//   const [utilityHistory] = await connection.query(
//     `SELECT operator.icon,utility.* FROM utility JOIN operator ON utility.op_id = operator.op_id WHERE utility.unique_id = ? AND utility.order_id = ?`,
//     [req.users.unique_id, req.params.orderid]
//   );
//   console.log({ utilityHistory });
//   if (isEmpty(utilityHistory)) {
//     await connection.release();
//     return res.status(500).send({
//       status: "fail",
//       statusCode: "02",
//       message: "No records found",
//     });
//   }

//   // const updatedData = (item) => {
//   //   const utcTimestamp = item.date;
//   //   const localDate = moment
//   //     .utc(utcTimestamp)
//   //     .local()
//   //     .format("YYYY-MM-DD HH:mm:ss");
//   //   return {
//   //     order_id: item.order_id,
//   //     client_ref_id: item.client_ref_id,
//   //     date: localDate,
//   //     icon: item.icon,
//   //     operator_name: item.operator_name,
//   //     utility_account_no: item.utility_account_no,
//   //     amount: item.amount,
//   //     status: item.status,
//   //   };
//   // };
//   const updatedData = (Arr) =>
//     Arr.map((item) => {
//       const utcTimestamp = item.date;
//       const localDate = moment
//         .utc(utcTimestamp)
//         .local()
//         .format("YYYY-MM-DD HH:mm:ss");
//       return {
//         order_id: item.order_id,
//         date: localDate,
//         icon: item.icon,
//         operator_name: item.operator_name,
//         utility_account_no: item.utility_account_no,
//         amount: item.amount,
//         status: item.status,
//         oprefno: item.oprefno,
//         earn: item.earned,
//       };
//     });
  
//   await connection.release();
//   return res.status(200).send({
//     status: "success",
//     statusCode: "01",
//     data: updatedData(utilityHistory),
//   });
// });

// router.get("/status-check/:orderId", TokenAuth, async (req, res) => {
//   const parseString = require("xml2js").parseString;

//   const connection = await poolPromise().getConnection();

//   try{
    
// // chaged
//   const [utilityHistory] = await connection.query(
//     `SELECT operator.icon,utility.* FROM utility JOIN operator ON utility.op_id = operator.op_id WHERE utility.unique_id = ? AND utility.order_id = ?`,
//     [req.users.unique_id, req.params.orderId]
//   );
//   console.log(utilityHistory[0].status);

//   if (isEmpty(utilityHistory)) {
//     return res.status(500).send({
//       status: "fail",
//       statusCode: "02",
//       message: "No records found",
//     });
//   }
//   // added condition
//   if (utilityHistory[0].status === "Failed" || utilityHistory[0].status === "Refund") {
//     return res.status(200).send({
//       status: "success",
//       statusCode: "01",
//       data: {
//         order_id: utilityHistory[0].order_id,
//         date: moment.utc(utilityHistory[0].date).local().format("YYYY-MM-DD HH:mm:ss"),
//         icon: utilityHistory[0].icon,
//         operator_name: utilityHistory[0].operator_name,
//         utility_account_no: utilityHistory[0].utility_account_no,
//         amount: utilityHistory[0].amount,
//         status: utilityHistory[0].status,
//         oprefno: utilityHistory[0].oprefno,
//         massage:`Your Recharge is ${utilityHistory[0].status}`
//       },
//     });
//   }

//   const response = await statusCheck(req.params.orderId);
  
//   console.log("response.data",response.data,"response.data");

//   let jsonResponse = {};
//   parseString(response.data, function (err, result) {
//     if (err) {
//       console.error(err);
//     } else {
//       jsonResponse = result;
//     }
//   });
//   console.log("response.data",jsonResponse,"response.data")// console.log(jsonResponse);
//   if (isEmpty(response)) {
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Data not found",
//     });
//   }

// // changed 

//   const updatedData = (Arr) =>
//     Arr.map((item) => {
//       const utcTimestamp = item.date;
//       const localDate = moment
//         .utc(utcTimestamp)
//         .local()
//         .format("YYYY-MM-DD HH:mm:ss");
//       return {
//         order_id: item.order_id,
//         date: localDate,
//         icon: item.icon,
//         operator_name: item.operator_name,
//         utility_account_no: item.utility_account_no,
//         amount: item.amount,
//         status: item.status,
//         oprefno: item.oprefno,
//       };
//     });
//  //changed queryStatus[0] to  status[0]  
//  //jsonResponse.txStatus?.queryStatus[0]?.toString().includes("FAILURE") to jsonResponse.txStatus?.status[0]?.toString().includes("RECHARGEFAILURE")
//   if (jsonResponse.txStatus?.status[0]?.toString().includes("RECHARGEFAILURE")) {
//     const [[result]] = await connection.query(
//       "SELECT * FROM utility JOIN wallets ON wallet.unique_id = utility.unique_id WHERE utility.order_id = ? ",
//       [req.params.orderId]
//     );

//     let utility = {
//       unique_id: result.unique_id,
//       user_type: req.users.user_type,
//       order_id: result.order_id,
//       client_ref_id: result.client_ref_id,
//       operator_name: result.operator_name,
//       utility_account_no: result.utility_account_no,
//       ad: JSON.stringify(result.ad),
//       amount: result.amount,
//       status: "Refund", //"Failed" to Refund
//       oprefno: null,
//       earned: null,
//       tds: null,
//       txid: null,
//       coordinates: result.coordinates,
//       // request: urlG,
//       // response: responseG,
//       refunded: result.net_debited,
//       status_check_response: JSON.stringify(jsonResponse),
//     };
//     await connection.query(
//       `UPDATE utility SET ${Object.keys(utility).join(
//         "= ?,"
//       )}=? WHERE order_id = ?`,
//       [...Object.values(utility), req.params.orderId]
//     );
//     //added
//     await connection.query(
//       "UPDATE wallets SET wallet = wallet + ? WHERE unique_id = ? ",
//       [result.net_debited, result.unique_id]
//     );

//     const [results] = await connection.query(
//       "SELECT MAX(`tran_id`) as max_tran_id FROM walletsummary"
//     );

//     var tran_id_ = results[0].max_tran_id || 0;
//     var tran_id_w_ = tran_id_ + 1;
//     var description_ = `Your Recharge is faild amount Refunded Rs${result.net_debited}/-`;

//     const [update_wallet] = await connection.query(
//       "SELECT * FROM wallets WHERE unique_id = ?",
//       [result.unique_id]
//     );

//     await connection.query(
//       "INSERT INTO walletsummary (unique_id, tran_id, type, amount, status, description, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?)",
//       [
//         result.unique_id,
//         tran_id_w_,
//         "CR",
//         result.net_debited,
//         "Success",
//         description_,
//         update_wallet[0].wallet,
//       ]
//     );


//     return res.status(200).send(updatedData(utilityHistory)[0]);
//   }

//   if (jsonResponse.txStatus.queryStatus[0] == "SUCCESS") {
//     let utility = {
//       status: "SUCCESS",
//       oprefno: jsonResponse.txStatus.operatorrefno[0],
//       refunded: 0,
//       status_check_response: JSON.stringify(jsonResponse),
//     };
//     await connection.query(
//       `UPDATE utility SET ${Object.keys(utility).join(
//         "= ?,"
//       )}=? WHERE order_id = ?`,
//       [...Object.values(utility), req.params.orderId]
//     );
//     return res.status(200).send({
//       status: "success",
//       statusCode: "01",
//       data: updatedData(utilityHistory),
//     });
//   } else {
//     let utility = {
//       status: "Failed",
//       earned: null,
//       tds: null,
//       net_debited: null,
//       refunded: 0,
//       status_check_response: JSON.stringify(jsonResponse),
//     };
//     await connection.query(
//       `UPDATE utility SET ${Object.keys(utility).join(
//         "= ?,"
//       )}=? WHERE order_id = ?`,
//       [...Object.values(utility), req.params.orderId]
//     );
//     return res.status(200).send({
//       status: "success",
//       statusCode: "01",
//       data: updatedData(utilityHistory),
//     });
//   }
//   }catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Something went wrong!",
//     });
//   }finally {
//     if (connection) {
//       await connection.release();
//     }
//   }

// });

// router.post("/add-complaint", TokenAuth, async (req, res) => {
//   const connection = await poolPromise().getConnection();
//   const { txId, reason, description } = req.body;

//   try{
//     const [[complaint_check]] = await connection.query(
//       "SELECT * FROM complaint WHERE txId = ? ",
//       [txId]
//     );
  
//     if (!isEmpty(complaint_check)) {
//       return res.status(200).json({
//         status: "failed",
//         statuscode: "02",
//         msg: "Complaint alredy resistered",
//       });
//     }
//     const merchant_result = await connection.query("SELECT * from merchants where unique_id = ? ",[req.users.unique_id])

//     const complaint = {
//       txId,
//       reason,
//       description,
//       unique_id: req.users.unique_id,
//       customer_name: merchant_result[0].authorized_person_name,
//     };
  
//     const columns = Object.keys(complaint)
//       .map((key) => `\`${key}\``)
//       .join(",");
//     const placeholders = Object.values(complaint)
//       .map(() => "?")
//       .join(",");
  
//     const query = `INSERT INTO complaint (${columns}) VALUES (${placeholders})`;
//     const values = Object.values(complaint);
  
//     await connection.query(query, values);
  
//     return res.status(200).json({
//       status: "success",
//       statuscode: "01",
//       msg: "Complaint resistered successfully",
//     });
//   }catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Something went wrong!",
//     });
//   }finally {
//     if (connection) {
//       await connection.release();
//     }
//   }

// });

// router.get("/get-complaints/:complaintId?", TokenAuth, async (req, res) => {
//   const connection = await poolPromise().getConnection();

//   try{
//     let query = "SELECT * FROM complaint WHERE unique_id = ? ";
//   const queryValues = [req.users.unique_id];
//   if (req.params.complaintId) {
//     query += " AND id = ? ";
//     queryValues[1] = req.params.complaintId;
//   }

//   const [results] = await connection.query(query, queryValues);

//   if (isEmpty(results)) {
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Data not found",
//     });
//   }
//   return res.status(200).json({
//     status: "success",
//     statuscode: "01",
//     data: results.map(
//       ({
//         id,
//         txId,
//         customer_name,
//         reason,
//         description,
//         status,
//         remark,
//         ...elem
//       }) => ({
//         id,
//         txId,
//         customer_name,
//         reason,
//         description,
//         remark,
//         status,
//       })
//     ),
//   });
//   }catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: "failed",
//       statuscode: "02",
//       message: "Something went wrong!",
//     });
//   }finally {
//     if (connection) {
//       await connection.release();
//     }
//   }
  
// });

// const createTree = (data) => {
//   const tree = [];
//   // Create a dictionary to store references to each node by its ID
//   const nodes = {};
//   // Build the initial tree structure with empty children arrays
//   data.forEach((item) => {
//     delete item.user_type;
//     delete item.status;
//     nodes[item.id] = {
//       ...item,
//       id: item.treeview == "True" ? "" : item.id,
//       children: [],
//     };
//   });

//   // Iterate over the nodes and assign each node as a child to its parent
//   Object.values(nodes).forEach((node) => {
//     if (node.parent_id !== 0) {
//       const parent = nodes[node.parent_id];
//       if (parent) {
//         parent.children.push(node);
//       }
//     } else {
//       tree.push(node);
//     }
//   });

//   return tree;
// };

// const calculateExpiry = (createdDate, days) => {
//   const createdDatetime = new Date(createdDate);
//   const expiryDatetime = new Date(
//     createdDatetime.getTime() + days * 24 * 60 * 60 * 1000
//   );
//   const currentDate = new Date();
//   if (expiryDatetime > currentDate) {
//     const expiryDate = expiryDatetime.toISOString().split("T")[0];
//     return expiryDate;
//   } else {
//     return "Expired";
//   }
// };

// const rsaEncryption = (cn) => {
//   const publicKey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz3WXL7tDSfUG6hfqTADnWXzSB4ndgsbQYnVuIV23FWpwzS/ZPC27rxTcOHPoh7NERAYmIUL0xlKhwqalyGvYx5Uvj7gJ6W6oF9t1dvsNU4p4kxBh5DUfKQ/DfAc1qiY70Dm88QPW3OYitEVAO64zS++PqZllegz/vHxsThdVfM6/43XCjLKBkmD+kCYk3Nu7DhA2GZp0VGo4BkKlklT7Yejs7VHs9Z4lfiwxlPZPWN99i3twUD1PdjqNd0eKwb5LOpOXdAw7kKZ1nI8+IAaXtPEEAbeDRzw8DIfwAMs++ruSaB6g+FVN0XAD2LJCNN+Fqb999Lf2OV3PiVdXxJpWTwIDAQAB`;
//   // Encrypt the message
//   const encrypted = crypto.publicEncrypt(
//     {
//       key: publicKey,
//       padding: crypto.constants.RSA_PKCS1_PADDING, // Use PKCS1 padding
//     },
//     Buffer.from(cn)
//   );
//   const encryptedData = encrypted.toString("base64");
//   return encryptedData;
// };
// function createTreeN(data) {
//   const tree = [];

//   // Create a dictionary to store categories by their IDs
//   const categoryMap = {};

//   // Fill the dictionary and initialize children arrays
//   data.forEach((item) => {
//     categoryMap[item.category_id] = { ...item, children: [] };
//   });

//   // Traverse the data to link children to their parents
//   data.forEach((item) => {
//     if (item.parent_id !== 0) {
//       const parent = categoryMap[item.parent_id];
//       if (parent) {
//         parent.children.push(categoryMap[item.category_id]);
//       }
//     } else {
//       // If parent_id is 0, it's a top-level category
//       tree.push(categoryMap[item.category_id]);
//     }
//   });

//   return tree;
// }

// module.exports = router;
const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const poolPromise = require("../util/connectionPromise");
const TokenAuth = require("../globalfunction/TokenAuth.js");
const moment = require("moment-timezone");
moment().tz("Asia/Calcutta").format();
process.env.TZ = "Asia/Calcutta";
const { isEmpty } = require("lodash");
const multer = require("multer");
const {
  fetchRechargePlans,
  fetchConnectionDetails,
  statusCheck,
  fetchViewBill,
  recharge,
  thirdfetchbill,
  generateRequestHash,
  thirdpaybillEko,
} = require("../globalfunction/thirdpartyapis");

router.get("/get-category", async (req, res) => {
  const connection = await poolPromise().getConnection();
  const [results] = await connection.query(
    'SELECT * FROM services_managers WHERE category_group = "Utility" AND status = "Enable"'
  );

  const tree = createTree(results);
  await connection.release();
  return res
    .status(200)
    .json({ status: "success", statuscode: "01", data: tree });
});

router.get("/get-location", async (req, res) => {
  const connection = await poolPromise().getConnection();
  let query = "SELECT * FROM location WHERE status = 'Enable'";
  const queryValues = [];

  if (req.query.type) {
    query += " AND type = ?";
    queryValues.push(req.query.type);
  }

  const [results] = await connection.query(query, queryValues);

  const updatedArray = results.map(({ status, id, type, ...rest }) => rest);
  await connection.release();
  return res
    .status(200)
    .json({ status: "success", statuscode: "01", data: updatedArray });
});

router.get("/get-operator", async (req, res) => {
  const connection = await poolPromise().getConnection();

  const query = "SELECT * FROM operator WHERE cate_id = ? AND status = ? ";
  const queryValues = [req.query.cate_id, "Enable"];

  const [results] = await connection.query(query, queryValues);

  const updatedArray = results.map(({ status, id, ...rest }) => rest);

  await connection.release();
  return res
    .status(200)
    .json({ status: "success", statuscode: "01", data: updatedArray });
});

router.get("/get-operator-params", async (req, res) => {
  if (!req.query.op_id) {
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "Please provide operator",
    });
  }

  const connection = await poolPromise().getConnection();

  const query = "SELECT * FROM operator_parameters WHERE op_id = ?";
  const queryValues = [req.query.op_id];

  const [results] = await connection.query(query, queryValues);

  if (isEmpty(results)) {
    await connection.release();
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "No parameters found",
    });
  }

  const updatedArray = results.map(
    ({
      status,
      cat_id,
      op_id,
      category,
      operator_Name,
      param_id,
      param_name,
      regex,
      param_label,
      message,
      id,
      ...rest
    }) => ({
      param_id,
      param_label,
      param_name,
      regex,
      message,
    })
  );
  await connection.release();
  return res.status(200).json({
    status: "success",
    statuscode: "01",
    cat_id: results[0].cat_id,
    category: results[0].category,
    op_id: results[0].op_id,
    operator_Name: results[0].operator_Name,
    data: updatedArray,
  });
});

router.get("/fetch-connection-details/:mob", TokenAuth, async (req, res) => {
  const mobile_number = req.params.mob;
  // return res.json({mobile_number})
  const response = await fetchConnectionDetails(mobile_number);
  const data = response.data.data;

  const connection = await poolPromise().getConnection();

  const query =
    "SELECT * FROM operator_wish_api,location WHERE operator_wish_api.api_Id = ? and circle_id = ? ";
  const queryValues = [data.operatorId, data.circleId];

  const [results] = await connection.query(query, queryValues);

  const { op_id, operator_name, circle_id, circle_name } = results[0];

  await connection.release();
  return res.status(200).json({
    status: "success",
    statuscode: "01",
    data: { op_id, operator_name, circle_id, circle_name },
  });
});

router.get(
  "/fetch-recharge-plans/:operator/:circle?",
  TokenAuth,
  async (req, res) => {
    const operator = req.params.operator;
    const circle = req.params.circle;
    let cn = "";
    if (req.query.cn) {
      cn = req.query.cn;
    }
    if (!operator) {
      return res.status(500).json({
        status: "failed",
        statuscode: "02",
        statuscode: "02",
        message: "Please provide operator",
      });
    }

    const connection = await poolPromise().getConnection();

    const query = "SELECT * FROM operator_wish_api WHERE op_id = ?";
    const queryValues = [operator];

    const [results] = await connection.query(query, queryValues);

    const response = await fetchRechargePlans(results[0].api_Id, circle, cn);
    const updatedArray = response.data
      ? response.data.plans.map(({ operatorId, ...rest }) => rest)
      : [];
    if (response.success) {
      await connection.release();
      return res.status(200).json({
        status: "success",
        statuscode: "01",
        api_id: results[0].api_Id,
        data: updatedArray,
      });
    } else {
      await connection.release();
      return res.status(200).json({
        status: "failed",
        statuscode: "01",
      });
    }
  }
);
router.post("/fetch-bills", TokenAuth, async (req, res) => {
  const { op_id, accountno, additional_params } = req.body;
  let types;
  if (req.body.types) {
    types = req.body.types;
  }

  //getting unique_id from headers 
  unique_id = req.unique_id
  console.log('key',unique_id)
  const connection = await poolPromise().getConnection();

 // is data ko store fetch bill me request body me store krna he 
 // operor_id se operator table se 
 // operator icon and operator name niklna he isko muje fetch bill me store krna he 


  // Get a database connection
  // const connection = await poolPromise().getConnection();

  // Query to fetch operator details


// here getting operator_name and icon from operator table based on op_id

  let query1 = "SELECT * FROM operator WHERE op_id = ? ";
  if (types) {
    query += " AND types = '" + types + "'";
  }
  const [operatorResults] = await connection.query(query1, [op_id]);

  if (!operatorResults || !operatorResults.length) {
    await connection.release();
    return res.status(400).json({
      status: "failed",
      statuscode: "02",
      message: "Invalid operator ID",
    });
  }

  const operator = operatorResults[0];
  const { operator_name, icon } = operator;

  // return res.send({status : true, data : operator_name, icon : icon})
//above working

  // here getting fetch_bill table order_id  and increaseing order_id by one 
  //  Query to fetch all order_ids from fetch_bills table
   const [orderIdsResults] = await connection.query("SELECT order_id FROM fetch_bill");
   // Extract order_ids from the results
   const orderIds = orderIdsResults.map(result => result.order_id);
   // Find the maximum order_id
   const maxOrderId = orderIds.length > 0 ? Math.max(...orderIds) : 0;
  //  Increment the maximum order_id by one to generate a new order_id
   const newOrderId = maxOrderId + 1;
// const newOrderId="23456787654"
   //getting userType from users table 
   const [userTypeSearchResult] = await connection.query("SELECT user_type FROM auths  WHERE unique_id = ?", [req.users.unique_id]);

   // Extract order_ids from the results
 

  //  return res.send({status : true, data : newOrderId, icon : icon, user_type:userTypeSearchResult[0].user_type})


  // Store the request data along with operator details in the fetch-bills table
//  var adValue = ';'
//   if(additional_params){
//   adValue = additional_params ? JSON.stringify(additional_params) : null;
//   }
//   const fetchBillRequestData = {
//     utility_account_no: accountno,
//     unique_id: unique_id,
//     // ad: adValue,
//     order_id : newOrderId,
//     operator_name: operator_name,
//     operator_icon: icon,
//     request: JSON.stringify(req.body), // Store the entire request body as a JSON string
//   };

//   // Insert the data into the fetch-bills table
//   await connection.query("INSERT INTO fetch_bill SET ?", fetchBillRequestData);

//   // Release the database connection
//   await connection.release();

  //query 

  let query = "SELECT * FROM operator_wish_api WHERE op_id = ? ";
  if (types) {
    query += " AND types = '" + types + "'";
  }
  const [results] = await connection.query(query, [op_id]);
  console.log('gettind api_id',results)
  if (!results) {
    await connection.release();
    return res.status(200).json({
      status: "failed",
      statuscode: "02",
      message: "Invalid Data",
    });
  }

 var mobikwik = false
 var  eko = false
  // Assuming the array is stored in a variable called operators
for (const operator of results) {
  if (operator.status === 'True') {
      if (operator.s_p_name === 'Mobikwik') {
          // Call Mobikwik function
          mobikwik = true
      } else if (operator.s_p_name === 'Eko') {
          // Call Eko function
          eko  = true;
      }
  }
}

// return res.send({status: false,msg: mobikwik, eko: eko})
// const { request, response } = (mobikwik) ? await fetchViewBill(api_Id, accountno, additional_params) : await thirdfetchbill(api_Id, accountno, additional_params);

if(mobikwik){
  const { request, response } = await fetchViewBill(
    results[0].api_Id,
    accountno,
    additional_params
  );
  // return res.json({D:response.data.data[0]})
  // return res.json({d:(response && response.data && response.data.success)})
// console.log({ responseinside : response.data})

  // return res.send({status : true, response: response.data})

  // return res.json({d:response.data.data[0]})
  if (response && response.data && response.data.success) {

    //if response is coming then store that response in fetch_bill table again

    //extracting all data here
    const { billAmount, billnetamount, billdate, dueDate, acceptPayment, acceptPartPay, cellNumber, userName } = response.data.data[0];
    // console.log(`billAmount ${billAmount}   `)
    
    const fetchBillRequestData = {
      utility_account_no: accountno,
      unique_id: req.users.unique_id,
      // ad: additional_params ? JSON.stringify(additional_params) : '',
      order_id : newOrderId,
      operator_name: operator_name,
      operator_icon: icon,
      customer_name:userName,
      operator_id : op_id,
      user_type : 'csp',
      status: response.data.success,
      amount:billAmount,

      request: JSON.stringify(request),
      response: JSON.stringify(response.data), // Store the entire request body as a JSON string
    };
    // return res.json({ fetchBillRequestData })
    try {
    await connection.query("INSERT INTO fetch_bill SET ?", fetchBillRequestData);
      
    } catch (error) {
      console.log(error)
    }
    // Insert the data into the fetch-bills table
  
    // Release the database connection
    await connection.release();
    return res.status(200).json({
      status: "success",
      statuscode: "01",
      data: response.data.data,
    });
  } else {
    await connection.release();
    return res.status(200).json({
      status: "failed",
      statuscode: "02",
      message: response && response.data && response.data.message.text,
    });
  }
}else if(eko){
     
  //generating secret key and time stamp 

  const generateSecretKeyAndTimestamp = () => {
    const key = "b977803d-0218-456e-a676-79de8c42f4b6";
    const encodedKey = Buffer.from(key).toString("base64");
    const Timestamp = Date.now().toString();
    const signature = crypto
      .createHmac("sha256", encodedKey)
      .update(Timestamp)
      .digest("binary");
    const secretKey = Buffer.from(signature, "binary").toString("base64");
      return { secretKey: secretKey, secretKeyTimestamp: Timestamp };
  };
  
  const { secretKey, secretKeyTimestamp } = generateSecretKeyAndTimestamp();
  console.log('Secret Key:', secretKey);
  console.log('Timestamp:', secretKeyTimestamp);
  const header = {
    secretKey: secretKey,
    secretKeyTimestamp: secretKeyTimestamp
};

const { request, response } = await thirdfetchbill(secretKey, secretKeyTimestamp);
// console.log('Request:', request);
console.log('Response:', response.data);

if (response && response.data) {

  //if response is coming then store that response in fetch_bill table again

  //extracting all data here
  const { 
  amount,
  billerstatus,
  bbpstrxnrefid,
  ifsc_status,
  utilitycustomername,
  postalcode,
  billfetchresponse,
  geocode,
  billdate,
  customer_id,
  billDueDate,
  billername,
} = response.data.data
  const fetchBillRequestData = {
    utility_account_no: accountno,
    unique_id: unique_id,
    // ad: additional_params ? JSON.stringify(additional_params) : '',
    order_id : newOrderId,
    operator_name: operator_name,
    operator_icon: icon,
    operator_id : op_id,
    customer_name:utilitycustomername,
    user_type : 'get user type for users table based in unique_id',
    status: 'success',
    amount:amount,
    user_type :userTypeSearchResult[0].user_type,
    request: JSON.stringify(request),
    response: JSON.stringify(response.data), // Store the entire request body as a JSON string
  };

  // Insert the data into the fetch-bills table
  await connection.query("INSERT INTO fetch_bill SET ?", fetchBillRequestData);

  // Release the database connection
  await connection.release();
  return res.status(200).json({
    status: "success",
    statuscode: "01",
    data: {
      "billAmount": amount,
      "billnetamount": amount,
      "billdate": billdate,
      "dueDate": billDueDate,
      "acceptPayment": true,
      "acceptPartPay": false,
      "cellNumber": customer_id,
      "userName":utilitycustomername
    },
  });
} else {
  await connection.release();
  return res.status(200).json({
    status: "failed",
    statuscode: "02",
    message: response && response.data && response.data.message.text,
  });
}

  // return res.status(200).json({ message: 'success'});

}else{
  return res.send({status :'failed', message: 'both status for mobikwik and eko are false'})
}
});


router.post("/payment", TokenAuth, async (req, res) => {
  const parseString = require("xml2js").parseString;
  const unique_id = req.users.unique_id;
  const package_id = req.users.package_id;
  const expiry = req.users.package_expiry;
  console.log(expiry)
  let order_id = "";
  let operator_api_result;
  let types;
  const {
    reqid,
    op_id,
    amt,
    accountno,
    additional_params,
    coordinates,
    client_ref_id,
    customer_name,
  } = req.body;

  //types is optional if coming then store in type varaible mathc in db for further use case
  if (req.body.types) {
    types = req.body.types;
  }

  //making global so we can use this in any block scope code
  var responseG, urlG;
  const validation_Parameters = {
    op_id,
    amt,
    accountno,
    coordinates,
    client_ref_id,
  };
  function validateField(value, fieldName) {
    if (!value) {
      return "Please provide " + fieldName;
    }
    return null;
  }

  const validationErrors = [];
  for (const key in validation_Parameters) {
    if (Object.hasOwnProperty.call(validation_Parameters, key)) {
      const element = validation_Parameters[key];
      const error = validateField(element, key);
      if (error) {
        validationErrors.push(error);
      }
    }
  }

  if (validationErrors.length > 0) {
    return res.status(400).send({
      status: "failed",
      statuscode: "02",
      message: validationErrors,
    });
  }

  const connection = await poolPromise().getConnection();

  try {
    const [[utilityData]] = await connection.query(
      `SELECT * FROM utility WHERE client_ref_id = ?`,
      [client_ref_id]
    );
    // if (utilityData) {
    //   return res.status(200).send({
    //     status: "failed",
    //     statuscode: "02",
    //     message: "Duplicate CLIENT_REF_ID",
    //   });
    // }
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    if (expiryDate < now) {
      connection.release();
      return res.status(200).send({
        status: "failed",
        statuscode: "02",
        message: "Your Plan expired",
      });
    }

    const [[walletResult]] = await connection.query(
      `SELECT * FROM wallets WHERE unique_id = ? `,
      [unique_id]
    );

    if (walletResult.status === "Disable" || walletResult.status === "Freeze") {
      return res.status(404).json({
        status: "failed",
        statuscode: "02",
        message: `Your wallet has been ${walletResult.status}`,
      });
    }

    const balance = walletResult.wallet;
    if (amt > balance) {
      connection.release();

      return res.status(200).send({
        status: "failed",
        statuscode: "02",
        message: "Insufficient account balance",
      });
    }

    let opQuery = `SELECT * FROM operator_wish_api WHERE op_id = ? AND STATUS="True" `;
    if (types) {
      opQuery += "AND types = '" + types + "'";
    }

    const [[operatorApiResult]] = await connection.query(opQuery, [op_id]);
    if (!operatorApiResult) {
      return res.status(200).json({
        status: "failed",
        statuscode: "02",
        message: "Operator down",
      });
    }


    //checking which api to call
console.log('operator api result ',operatorApiResult)


// return res.send({message : 'wow'})

    operator_api_result = operatorApiResult;
    let [[max_order_id]] = await connection.query(
      "SELECT MAX(`order_id`) AS max_order_id FROM utility"
    );
    let order_id = max_order_id.max_order_id;
    order_id = parseInt(order_id) + 1;
    order_id = String(order_id);

    let holdbalance = walletResult.wallet;
    if (amt > balance) {
      connection.release();
      let utility = {
        unique_id: unique_id,
        user_type: req.users.user_type,
        order_id: order_id,
        client_ref_id: null,
        operator_name:
          operatorApiResult.operator_name + "-" + (types ? types : ""),
        customer_name,
        utility_account_no: accountno,
        ad: JSON.stringify(additional_params),
        amount: amt,
        status: "Failed",
        oprefno: null,
        earned: null,
        tds: null,
        txid: null,
        coordinates: coordinates,
        request: null,
        op_id: op_id,
        response: "INSUFFICIENT FUNDS",
      };
      await connection.query(
        `INSERT INTO utility (\`${Object.keys(utility).join(
          "`,`"
        )}\`) VALUES (${Object.keys(utility)
          .map((item, key) =>
            key == Object.keys(utility).length - 1 ? "?" : "?,"
          )
          .join("")})`,
        Object.values(utility)
      );
      return res.status(200).send({
        status: "failed",
        statuscode: "02",
        message: "Insufficient account balance",
      });
    }

    const [[utilitySchemeResult]] = await connection.query(
      `SELECT * FROM utility_scheme WHERE package_id = ? AND op_id = ?`,
      [package_id, op_id]
    );

    const commission_type = utilitySchemeResult.com_type;
    const commission = utilitySchemeResult.commission;
    let newAmount = amt;
    let commissionAmount = 0;
    let net_debited = 0;
    if (commission_type === "Fixed") {
      commissionAmount = commission;
      newAmount -= commissionAmount;
      newAmount += (commissionAmount / 100) * 5;
      holdbalance -= newAmount;
      net_debited = newAmount;
    } else {
      commissionAmount = (newAmount / 100) * commission;
      newAmount -= commissionAmount;
      newAmount += (commissionAmount / 100) * 5;
      holdbalance -= newAmount;
      net_debited = newAmount;
    }

    await connection.query("UPDATE wallets SET wallet = ? WHERE unique_id = ?", [
      holdbalance,
      unique_id,
    ]);

    let utility = {
      unique_id: unique_id,
      user_type: req.users.user_type,
      order_id: order_id,
      client_ref_id: client_ref_id,
      operator_name: operatorApiResult.operator_name,
      customer_name,
      utility_account_no: accountno,
      ad: JSON.stringify(additional_params),
      amount: amt,
      net_debited: net_debited,
      status: "Success",
      oprefno: null,
      earned: commissionAmount,
      tds: (commissionAmount / 100) * 5,
      txid: null,
      op_id: op_id,
      coordinates: coordinates,
    };
    await connection.query(
      `INSERT INTO utility (\`${Object.keys(utility).join(
        "`,`"
      )}\`) VALUES (${Object.keys(utility)
        .map((item, key) =>
          key == Object.keys(utility).length - 1 ? "?" : "?,"
        )
        .join("")})`,
      Object.values(utility)
    );
    let acno = accountno;
    if (req.query.rsa == 1) {
      acno = rsaEncryption(accountno);
    }


    //here we are calling payment gateway api's based on true or false

    //for mobikwik api call
    if(operatorApiResult.s_p_name  ===  'Mobikwik'){
      const { response, url } = await recharge(
        order_id,
        acno,
        operatorApiResult.api_Id,
        amt,
        additional_params
      );
      urlG = url;
      responseG = response


      let jsonResponse = {};
      parseString(responseG.data, function (err, result) {
        if (err) {
          console.error(err);
        } else {
          jsonResponse = result;
        }
      });


      if (
        (jsonResponse &&
          jsonResponse.txStatus &&
          jsonResponse.txStatus.queryStatus &&
          jsonResponse.txStatus.queryStatus[0] === "UNEXPECTED ERROR") ||
        (jsonResponse &&
          jsonResponse.recharge &&
          jsonResponse.recharge.status &&
          jsonResponse.recharge.status[0] === "FAILURE")
      ) {
        await connection.query(
          "UPDATE wallets SET wallet = ? WHERE unique_id = ?",
          [balance, unique_id]
        );
        let utility = {
          unique_id: unique_id,
          user_type: req.users.user_type,
          order_id: order_id,
          client_ref_id: client_ref_id,
          operator_name:
            operatorApiResult.operator_name + "-" + (types ? types : ""),
          customer_name,
          utility_account_no: accountno,
          ad: JSON.stringify(additional_params),
          amount: amt,
          status: "Failed",
          oprefno: null,
          earned: null,
          tds: null,
          txid: null,
          coordinates: coordinates,
          request: urlG,
          response: JSON.stringify(jsonResponse),
        };
        console.log(jsonResponse);
  
        await connection.query(
          `UPDATE utility SET ${Object.keys(utility).join(
            "= ?,"
          )}=? WHERE order_id = ?`,
          [...Object.values(utility), utility.order_id]
        );
  
        if (jsonResponse.recharge?.status[0] === "FAILURE") {
          return res.status(200).send({
            status: jsonResponse.recharge.status[0],
            statuscode: "02",
            amount: amt,
            errorMsg: jsonResponse.recharge.errorMsg[0],
          });
        } else if (jsonResponse.txStatus?.queryStatus[0] === "UNEXPECTED ERROR") {
          return res.status(200).send({
            status: jsonResponse.txStatus.queryStatus[0],
            statuscode: "02",
            amount: amt,
            errorMsg: jsonResponse.txStatus.errorMsg[0],
          });
        }
      } else {
        if (
          (jsonResponse &&
            jsonResponse.recharge &&
            jsonResponse.recharge.status &&
            jsonResponse.recharge.status[0] === "SUCCESS") ||
          (jsonResponse &&
            jsonResponse.recharge &&
            jsonResponse.recharge.status &&
            jsonResponse.recharge.status[0] === "SUCCESSPENDING")
        ) {
          let utility = {
            unique_id: unique_id,
            user_type: req.users.user_type,
            order_id: order_id,
            client_ref_id: client_ref_id,
            operator_name:
              operatorApiResult.operator_name + "-" + (types ? types : ""),
            customer_name,
            utility_account_no: accountno,
            ad: JSON.stringify(additional_params),
            amount: amt,
            status: "Success",
            oprefno: jsonResponse.recharge.opRefNo[0],
            earned: commissionAmount,
            tds: (commissionAmount / 100) * 5,
            txid: jsonResponse.recharge.txId[0],
            coordinates: coordinates,
            request: url,
            response: JSON.stringify(jsonResponse),
          };
          let [[max_tran_id]] = await connection.query(
            "SELECT MAX(`tran_id`) AS max_tran_id FROM walletsummary"
          );
          let tran_id = max_tran_id.max_tran_id;
          tran_id = parseInt(tran_id) + 1;
          const walletSummary = {
            unique_id: unique_id,
            tran_id: tran_id,
            type: "DR",
            amount: newAmount,
            status: "Success",
            description: `For ${operatorApiResult.operator_name} ${
              operatorApiResult.category
            } With Rs.${newAmount.toFixed(2)}/- ${accountno}`,
            closing_balance: holdbalance,
          };
          await connection.query(
            `INSERT INTO walletsummary (\`${Object.keys(walletSummary).join(
              "`,`"
            )}\`) VALUES (${Object.keys(walletSummary)
              .map((item, key) =>
                key == Object.keys(walletSummary).length - 1 ? "?" : "?,"
              )
              .join("")})`,
            Object.values(walletSummary)
          );
          await connection.query(
            `UPDATE utility SET ${Object.keys(utility).join(
              "= ?,"
            )}=? WHERE order_id = ?`,
            [...Object.values(utility), utility.order_id]
          );
          return res.status(200).send({
            status: "success",
            statuscode: "01",
            amount: amt,
            order_id: order_id,
            oprefno: jsonResponse.recharge.opRefNo[0],
          });
        }else{
          return res.send({status: false,message: 'not matching any of the status'})
        }
      }
    }
    
    //for eko api call
   
    
    if(operatorApiResult.s_p_name  ===  'Eko'){
      const user_code = 31739001;
      console.log('Eko')

      const header = await generateRequestHash(amt, user_code, acno)

    const req = {
        body: {
            "source_ip":"103.190.242.3",
            "user_code":user_code,
            "amount":amt ,
            "client_ref_id": order_id,
            "utility_acc_no":acno,
            "confirmation_mobile_no":acno,
            "sender_name":"",
            "operator_id":  operatorApiResult.api_Id,
            "latlong":coordinates,
             "hc_channel":"1" ,
        }
      };
      const { request, response } = await thirdpaybillEko(header,req)
      // console.log('paybill',paybill)

      console.log('response from eko url call', response.data)
      // return res.send({status: response.data.status, message: response.data.message,response_type_id : response.data.response_type_id })

      if (response&&
          response.data.response_type_id == 333 &&
          response.data.status == 0
      ) {
        let utility = {
          unique_id: unique_id,
          // user_type: req.users.user_type,
          order_id: order_id,
          client_ref_id: client_ref_id,
          operator_name:
            operatorApiResult.operator_name + "-" + (types ? types : ""),
          customer_name,
          utility_account_no: accountno,
          ad: JSON.stringify(additional_params),
          amount: amt,
          status: "Success",
          oprefno: response.data.reference_tid,
          earned: commissionAmount,
          tds: (commissionAmount / 100) * 5,
          txid: response.data.tid,
          coordinates: coordinates,
          request: JSON.stringify(request),
          response: JSON.stringify(response.data),
        };
        let [[max_tran_id]] = await connection.query(
          "SELECT MAX(`tran_id`) AS max_tran_id FROM walletsummary"
        );
        let tran_id = max_tran_id.max_tran_id;
        tran_id = parseInt(tran_id) + 1;
        //hekcing wallet summry
        console.log('wallet summary ',{
          unique_id: unique_id,
          tran_id: tran_id,
          type: "DR",
          amount: newAmount,
          status: "Success",
          description: `For ${operatorApiResult.operator_name} ${
            operatorApiResult.category
          } With Rs.${newAmount.toFixed(2)}/- ${accountno}`,
          closing_balance: holdbalance,
        })
        const walletSummary = {
          unique_id: unique_id,
          tran_id: tran_id,
          type: "DR",
          amount: newAmount,
          status: "Success",
          description: `For ${operatorApiResult.operator_name} ${
            operatorApiResult.category
          } With Rs.${newAmount.toFixed(2)}/- ${accountno}`,
          closing_balance: holdbalance,
        };
        await connection.query(
          `INSERT INTO walletsummary (\`${Object.keys(walletSummary).join(
            "`,`"
          )}\`) VALUES (${Object.keys(walletSummary)
            .map((item, key) =>
              key == Object.keys(walletSummary).length - 1 ? "?" : "?,"
            )
            .join("")})`,
          Object.values(walletSummary)
        );
        await connection.query(
          `UPDATE utility SET ${Object.keys(utility).join(
            "= ?,"
          )}=? WHERE order_id = ?`,
          [...Object.values(utility), utility.order_id]
        );
        return res.status(200).send({
          status: "success",
          statuscode: "01",
          amount: amt,
          order_id: order_id,
          message : response.data.message,
          oprefno: response.data.reference_tid,
        });
      }else{
        // return res.send({status: false,message: 'not matching any of the status'})
          await connection.query(
            "UPDATE wallets SET wallet = ? WHERE unique_id = ?",
            [balance, unique_id]
          );
          let utility = {
            unique_id: unique_id,
            // user_type: req.users.user_type,
            order_id: order_id,
            client_ref_id: client_ref_id,
            operator_name:
              operatorApiResult.operator_name + "-" + (types ? types : ""),
            customer_name,
            utility_account_no: accountno,
            ad: JSON.stringify(additional_params),
            amount: amt,
            status: "Failed",
            oprefno: null,
            earned: null,
            tds: null,
            txid: null,
            coordinates: coordinates,
            request: JSON.stringify(request),
            response: JSON.stringify(response.data),
          };
          
          await connection.query(
            `UPDATE utility SET ${Object.keys(utility).join(
              "= ?,"
            )}=? WHERE order_id = ?`,
            [...Object.values(utility), utility.order_id]
          );
          return res.status(200).send({
                status: response.data.status,
                statuscode: "02",
                amount: amt,
                errorMsg: response.data.message,
              });
      }
    }
  } catch (error) {
    console.log(error);
    // let utility = {
    //   unique_id: unique_id,
    //   user_type: req.users.user_type,
    //   order_id: order_id,
    //   client_ref_id: client_ref_id,
    //   operator_name: operator_api_result.operator_name,
    //   utility_account_no: accountno,
    //   ad: JSON.stringify(additional_params),
    //   amount: amt,
    //   status: "Failed",
    //   oprefno: null,
    //   earned: null,
    //   tds: null,
    //   txid: null,
    //   coordinates: coordinates,
    //   request: urlG,
    //   response: responseG,
    // };
    // await connection.query(
    //   `UPDATE utility SET ${Object.keys(utility).join(
    //     "= ?,"
    //   )}=? WHERE order_id = ?`,
    //   [...Object.values(utility), utility.order_id]
    // );
    return res.status(500).send({
      status: "fail",
      statuscode: "02",
      message: "Something went wrong!",
    });
  }finally {
    if (connection) {
      await connection.release();
    }
  }
});

router.get("/utility-history", TokenAuth, async (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 10;
  let page = req.query.page ? parseInt(req.query.page) : 1;

  const connection = await poolPromise().getConnection();

  try{
    
  const [totalRecords] = await connection.query(
    `SELECT COUNT(*) AS totalRecords FROM utility WHERE unique_id = ?`,
    [req.users.unique_id]
  );

  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(totalRecords[0].totalRecords / limit);

  const [utilityHistory] = await connection.query(
    `SELECT operator.icon, operator.category, utility.* FROM utility JOIN operator ON utility.op_id = operator.op_id WHERE utility.unique_id = ? ORDER BY \`date\` DESC
   LIMIT ? OFFSET ?`,
    [req.users.unique_id, limit, offset]
  );

  const updatedData = (item) => {
    const utcTimestamp = item.date;
    const localDate = moment
      .utc(utcTimestamp)
      .local()
      .format("YYYY-MM-DD HH:mm:ss");

    console.log("Local Date:", localDate);
    return {
      order_id: item.order_id,
      date: localDate,
      category: item.category,
      icon: item.icon,
      operator_name: item.operator_name,
      customer_name: item.customer_name,
      utility_account_no: item.utility_account_no,
      amount: item.amount,
      status: item.status,
      oprefno: item.oprefno,
      earn: item.earned,
    };
  };
  return res.status(200).send({
    status: "success",
    statusCode: "01",
    data: {
      totalRecords: totalRecords[0].totalRecords,
      totalPages: totalPages,
      currentPage: page,
      utilityHistory: utilityHistory.map((item) => updatedData(item)),
    },
  });
  }finally {
    if (connection) {
      await connection.release();
    }
  }


});

router.get("/utility-history/:orderid", TokenAuth, async (req, res) => {
  if (isEmpty(req.params.orderid)) {
    return res.status(500).send({
      status: "fail",
      statusCode: "02",
      message: "Please provide order id",
    });
  }
  const connection = await poolPromise().getConnection();

  const [utilityHistory] = await connection.query(
    `SELECT operator.icon,utility.* FROM utility JOIN operator ON utility.op_id = operator.op_id WHERE utility.unique_id = ? AND utility.order_id = ?`,
    [req.users.unique_id, req.params.orderid]
  );
  console.log({ utilityHistory });
  if (isEmpty(utilityHistory)) {
    await connection.release();
    return res.status(500).send({
      status: "fail",
      statusCode: "02",
      message: "No records found",
    });
  }

  // const updatedData = (item) => {
  //   const utcTimestamp = item.date;
  //   const localDate = moment
  //     .utc(utcTimestamp)
  //     .local()
  //     .format("YYYY-MM-DD HH:mm:ss");
  //   return {
  //     order_id: item.order_id,
  //     client_ref_id: item.client_ref_id,
  //     date: localDate,
  //     icon: item.icon,
  //     operator_name: item.operator_name,
  //     utility_account_no: item.utility_account_no,
  //     amount: item.amount,
  //     status: item.status,
  //   };
  // };
  const updatedData = (Arr) =>
    Arr.map((item) => {
      const utcTimestamp = item.date;
      const localDate = moment
        .utc(utcTimestamp)
        .local()
        .format("YYYY-MM-DD HH:mm:ss");
      return {
        order_id: item.order_id,
        date: localDate,
        icon: item.icon,
        operator_name: item.operator_name,
        utility_account_no: item.utility_account_no,
        amount: item.amount,
        status: item.status,
        oprefno: item.oprefno,
        earn: item.earned,
      };
    });
  
  await connection.release();
  return res.status(200).send({
    status: "success",
    statusCode: "01",
    data: updatedData(utilityHistory),
  });
});

router.get("/status-check/:orderId", TokenAuth, async (req, res) => {
  const parseString = require("xml2js").parseString;

  const connection = await poolPromise().getConnection();

  try{
    
// chaged
  const [utilityHistory] = await connection.query(
    `SELECT operator.icon,utility.* FROM utility JOIN operator ON utility.op_id = operator.op_id WHERE utility.unique_id = ? AND utility.order_id = ?`,
    [req.users.unique_id, req.params.orderId]
  );
  console.log(utilityHistory[0].status);

  if (isEmpty(utilityHistory)) {
    return res.status(500).send({
      status: "fail",
      statusCode: "02",
      message: "No records found",
    });
  }
  // added condition
  if (utilityHistory[0].status === "Failed" || utilityHistory[0].status === "Refund") {
    return res.status(200).send({
      status: "success",
      statusCode: "01",
      data: {
        order_id: utilityHistory[0].order_id,
        date: moment.utc(utilityHistory[0].date).local().format("YYYY-MM-DD HH:mm:ss"),
        icon: utilityHistory[0].icon,
        operator_name: utilityHistory[0].operator_name,
        utility_account_no: utilityHistory[0].utility_account_no,
        amount: utilityHistory[0].amount,
        status: utilityHistory[0].status,
        oprefno: utilityHistory[0].oprefno,
        massage:`Your Recharge is ${utilityHistory[0].status}`
      },
    });
  }

  const response = await statusCheck(req.params.orderId);
  
  console.log("response.data",response.data,"response.data");

  let jsonResponse = {};
  parseString(response.data, function (err, result) {
    if (err) {
      console.error(err);
    } else {
      jsonResponse = result;
    }
  });
  console.log("response.data",jsonResponse,"response.data")// console.log(jsonResponse);
  if (isEmpty(response)) {
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "Data not found",
    });
  }

// changed 

  const updatedData = (Arr) =>
    Arr.map((item) => {
      const utcTimestamp = item.date;
      const localDate = moment
        .utc(utcTimestamp)
        .local()
        .format("YYYY-MM-DD HH:mm:ss");
      return {
        order_id: item.order_id,
        date: localDate,
        icon: item.icon,
        operator_name: item.operator_name,
        utility_account_no: item.utility_account_no,
        amount: item.amount,
        status: item.status,
        oprefno: item.oprefno,
      };
    });
 //changed queryStatus[0] to  status[0]  
 //jsonResponse.txStatus?.queryStatus[0]?.toString().includes("FAILURE") to jsonResponse.txStatus?.status[0]?.toString().includes("RECHARGEFAILURE")
  if (jsonResponse.txStatus?.status[0]?.toString().includes("RECHARGEFAILURE")) {
    const [[result]] = await connection.query(
      "SELECT * FROM utility JOIN wallets ON wallet.unique_id = utility.unique_id WHERE utility.order_id = ? ",
      [req.params.orderId]
    );

    let utility = {
      unique_id: result.unique_id,
      user_type: req.users.user_type,
      order_id: result.order_id,
      client_ref_id: result.client_ref_id,
      operator_name: result.operator_name,
      utility_account_no: result.utility_account_no,
      ad: JSON.stringify(result.ad),
      amount: result.amount,
      status: "Refund", //"Failed" to Refund
      oprefno: null,
      earned: null,
      tds: null,
      txid: null,
      coordinates: result.coordinates,
      // request: urlG,
      // response: responseG,
      refunded: result.net_debited,
      status_check_response: JSON.stringify(jsonResponse),
    };
    await connection.query(
      `UPDATE utility SET ${Object.keys(utility).join(
        "= ?,"
      )}=? WHERE order_id = ?`,
      [...Object.values(utility), req.params.orderId]
    );
    //added
    await connection.query(
      "UPDATE wallets SET wallet = wallet + ? WHERE unique_id = ? ",
      [result.net_debited, result.unique_id]
    );

    const [results] = await connection.query(
      "SELECT MAX(`tran_id`) as max_tran_id FROM walletsummary"
    );

    var tran_id_ = results[0].max_tran_id || 0;
    var tran_id_w_ = tran_id_ + 1;
    var description_ = `Your Recharge is faild amount Refunded Rs${result.net_debited}/-`;

    const [update_wallet] = await connection.query(
      "SELECT * FROM wallets WHERE unique_id = ?",
      [result.unique_id]
    );

    await connection.query(
      "INSERT INTO walletsummary (unique_id, tran_id, type, amount, status, description, closing_balance) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        result.unique_id,
        tran_id_w_,
        "CR",
        result.net_debited,
        "Success",
        description_,
        update_wallet[0].wallet,
      ]
    );


    return res.status(200).send(updatedData(utilityHistory)[0]);
  }

  if (jsonResponse.txStatus.queryStatus[0] == "SUCCESS") {
    let utility = {
      status: "SUCCESS",
      oprefno: jsonResponse.txStatus.operatorrefno[0],
      refunded: 0,
      status_check_response: JSON.stringify(jsonResponse),
    };
    await connection.query(
      `UPDATE utility SET ${Object.keys(utility).join(
        "= ?,"
      )}=? WHERE order_id = ?`,
      [...Object.values(utility), req.params.orderId]
    );
    return res.status(200).send({
      status: "success",
      statusCode: "01",
      data: updatedData(utilityHistory),
    });
  } else {
    let utility = {
      status: "Failed",
      earned: null,
      tds: null,
      net_debited: null,
      refunded: 0,
      status_check_response: JSON.stringify(jsonResponse),
    };
    await connection.query(
      `UPDATE utility SET ${Object.keys(utility).join(
        "= ?,"
      )}=? WHERE order_id = ?`,
      [...Object.values(utility), req.params.orderId]
    );
    return res.status(200).send({
      status: "success",
      statusCode: "01",
      data: updatedData(utilityHistory),
    });
  }
  }catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "Something went wrong!",
    });
  }finally {
    if (connection) {
      await connection.release();
    }
  }

});

router.post("/add-complaint", TokenAuth, async (req, res) => {
  const connection = await poolPromise().getConnection();
  const { txId, reason, description } = req.body;

  try{
    const [[complaint_check]] = await connection.query(
      "SELECT * FROM complaint WHERE txId = ? ",
      [txId]
    );
  
    if (!isEmpty(complaint_check)) {
      return res.status(200).json({
        status: "failed",
        statuscode: "02",
        msg: "Complaint alredy resistered",
      });
    }
    const [merchant_result] = await connection.query("SELECT * from merchants where unique_id = ?", [req.users.unique_id])
    // const customer_id = merchant_result[0].customer_id
       const complaint = {
      txId,
      reason,
      description,
      unique_id: req.users.unique_id,
      customer_name: req.users.authorized_person_name,
    };
  
    const columns = Object.keys(complaint)
      .map((key) => `\`${key}\``)
      .join(",");
    const placeholders = Object.values(complaint)
      .map(() => "?")
      .join(",");
  
    const query = `INSERT INTO complaint (${columns}) VALUES (${placeholders})`;
    const values = Object.values(complaint);
  
    await connection.query(query, values);
  
    return res.status(200).json({
      status: "success",
      statuscode: "01",
      msg: "Complaint resistered successfully",
    });
  }catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "Something went wrong!",
    });
  }finally {
    if (connection) {
      await connection.release();
    }
  }

});

router.get("/get-complaints/:complaintId?", TokenAuth, async (req, res) => {
  const connection = await poolPromise().getConnection();

  try{
    let query = "SELECT * FROM complaint WHERE unique_id = ? ";
  const queryValues = [req.users.unique_id];
  if (req.params.complaintId) {
    query += " AND id = ? ";
    queryValues[1] = req.params.complaintId;
  }

  const [results] = await connection.query(query, queryValues);

  if (isEmpty(results)) {
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "Data not found",
    });
  }
  return res.status(200).json({
    status: "success",
    statuscode: "01",
    data: results.map(
      ({
        id,
        txId,
        customer_name,
        reason,
        description,
        status,
        remark,
        ...elem
      }) => ({
        id,
        txId,
        customer_name,
        reason,
        description,
        remark,
        status,
      })
    ),
  });
  }catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      statuscode: "02",
      message: "Something went wrong!",
    });
  }finally {
    if (connection) {
      await connection.release();
    }
  }
  
});

const createTree = (data) => {
  const tree = [];
  // Create a dictionary to store references to each node by its ID
  const nodes = {};
  // Build the initial tree structure with empty children arrays
  data.forEach((item) => {
    delete item.user_type;
    delete item.status;
    nodes[item.id] = {
      ...item,
      id: item.treeview == "True" ? "" : item.id,
      children: [],
    };
  });

  // Iterate over the nodes and assign each node as a child to its parent
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
};

const calculateExpiry = (createdDate, days) => {
  const createdDatetime = new Date(createdDate);
  const expiryDatetime = new Date(
    createdDatetime.getTime() + days * 24 * 60 * 60 * 1000
  );
  const currentDate = new Date();
  if (expiryDatetime > currentDate) {
    const expiryDate = expiryDatetime.toISOString().split("T")[0];
    return expiryDate;
  } else {
    return "Expired";
  }
};

const rsaEncryption = (cn) => {
  const publicKey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz3WXL7tDSfUG6hfqTADnWXzSB4ndgsbQYnVuIV23FWpwzS/ZPC27rxTcOHPoh7NERAYmIUL0xlKhwqalyGvYx5Uvj7gJ6W6oF9t1dvsNU4p4kxBh5DUfKQ/DfAc1qiY70Dm88QPW3OYitEVAO64zS++PqZllegz/vHxsThdVfM6/43XCjLKBkmD+kCYk3Nu7DhA2GZp0VGo4BkKlklT7Yejs7VHs9Z4lfiwxlPZPWN99i3twUD1PdjqNd0eKwb5LOpOXdAw7kKZ1nI8+IAaXtPEEAbeDRzw8DIfwAMs++ruSaB6g+FVN0XAD2LJCNN+Fqb999Lf2OV3PiVdXxJpWTwIDAQAB`;
  // Encrypt the message
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING, // Use PKCS1 padding
    },
    Buffer.from(cn)
  );
  const encryptedData = encrypted.toString("base64");
  return encryptedData;
};

module.exports = router;
