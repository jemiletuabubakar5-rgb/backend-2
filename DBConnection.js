const mongoose = require("mongoose");

const connect_db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)

    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connect_db;