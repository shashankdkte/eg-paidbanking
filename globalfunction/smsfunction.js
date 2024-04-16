const axios = require("axios");
const poolPromise = require("../util/connectionPromise");

const smsfunction = async (mobile, otp, func) => {
  let connection;
  try {
    connection = await poolPromise().getConnection();
    console.log(mobile, "mobile");

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/9888340b-ef24-11e8-a895-0200cd936042/SMS/${mobile}/${otp}/${func}`,
      headers: {}
    };

    const response = await axios.request(config);

    console.log(`data : ${JSON.stringify(response.data)}`);
    const IsoDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dateToInsert = new Date(dateToInsert).toLocaleString();
    const [smshistoryRows] = await connection.execute(
      "INSERT INTO sms_histories (request, response, status, status_code, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [
        JSON.stringify(config),
        JSON.stringify(response.data),
        response.data.Status,
        response.data.Details,
        dateToInsert
      ]
    );
    return response.data;
  } catch (error) {
    console.log(`error -> ${JSON.stringify(error.response.data)}`);
    return error.response.data;
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

async function sendSMS(mobile, text) {
  const connection = await poolPromise().getConnection();
  const { var_1: customer_name, var_2: account_type, var_3:unique_id } = text;
  const apiUrl = 'https://bhashsms.com/api/sendmsg.php';

  // Prepare your data for the POST request
  const postData = {
      user: 'SUBHOJITT',
      pass: '123456',
      sender: 'EGPAID',
      phone: mobile,
      text: `Dear ${customer_name}, Welcome To EgPaid Family. Your ${account_type} has been Successfully Activated. More Click http://bit.ly/42BBl`,
      priority: 'ndnd',
      stype: 'normal'
  };

  try
  {
    const response = await axios.post(apiUrl, new URLSearchParams(postData).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Response:', response.data);

    let result = response.data;
    console.log(`result ${result.toString()[0]}`);
    const data = {
      status_code: unique_id,
      status: 'Sucess',
      request: JSON.stringify(postData),
      response: response.data
    };
    
    if (result[0] === 'S')
    {
      try
      {
        
     
        await connection.query('INSERT into sms_histories SET ?', data)
      }
      catch (error)
      {
        console.log(error)
      }
    
    }
    else
    {
      
      await connection.query('INSERT into sms_histories SET ?', data)
    }
  }
   catch (error)
    {
      console.error('Error:', error);
  }
}


module.exports = {smsfunction,sendSMS};









