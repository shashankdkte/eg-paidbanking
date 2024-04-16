const jwt = require("jsonwebtoken");
const poolPromise = require("../util/connectionPromise");

module.exports = async (req, res, next) => {
  const { authorization, key } = req.headers;
  if (!key) {
    return res.status(422).json({ error: "Please provide an API key" });
  }
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
    const { id, secret } = payload;

    var unique_id = id;
    var secretToken = secret;

    const connection = await poolPromise().getConnection();
    console.log(`unique_id ${unique_id}`)
    const [users] = await connection.query(
      "SELECT * FROM auths WHERE unique_id = ?",
      [unique_id]
    );
    
    // const [users] = await connection.query(
    //   "SELECT * FROM auths WHERE unique_id = ?",
    //   ['e254504a-3d41-4497-93e3-7acc7aeef1ed']
    // );
    if (users.length === 0) {
      connection.release();
      return res
        .status(400)
        .json({ status: "fail", message: "No users is found" });
    }
    console.log(`secreToken ${secretToken}`)
    if (users[0].app_secret === secretToken) {
      connection.release();
      req.users = users[0];
      req.secretkey = secretToken;
      next();
    } else {
      return res
        .status(422)
        .json({ status: false, statuscode: "2", message: "Token expired" });
    }
  });
};
