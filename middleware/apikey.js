const poolUser = require("../util/connectionPromise");


module.exports = (async (req, res, next) => {
    try {
      var key = req.headers.key;
      console.log(`key ${key}`)
      if (!key) {
        return res.status(422).json({ error: "Please provide an API key" });
      }
  
      const connection = await poolUser().getConnection();
  
      try {
        const [fetchedKey] = await connection.query(
          "SELECT id FROM secret_key WHERE secret_key = ? AND status='Active' ",
          [key]
        );
  
        if (fetchedKey.length === 0) {
          return res.status(422).json({
            status: "fail",
            message: "INVALID API KEY",
          });
        } else {
          next();
        }
      } catch (err) {
        return res.status(422).json({ status: "fail", error: err });
      } finally {
        connection.release();
      }
    } catch (error) {
      return res.status(422).json({
        status: "fail",
        message: "INVALID API KEY",
      });
    }
  });
