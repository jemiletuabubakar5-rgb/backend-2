// // LOGIN USER CONTROLLER

// async function loginUser(req, res){
//   try {
//     const user = await UserModel.findOne({email: req.body.email, password: req.body.password});
//     if(!user) return res.status(404).send({success: false, message: "Invalid email or password"})
//     res.status(200).send({success: true, message: "Login successful", data: { id: user._id }})
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "An error occured",
//       data: error
//     })
//   }
// }

// async function loginUser(req, res) {
//   try {
//     // Find user by email only first
//     const user = await UserModel.findOne({ email: req.body.email });
    
//     if (!user) {
//       return res.status(404).send({ 
//         success: false, 
//         message: "Invalid email or password" 
//       });
//     }

//     // Compare passwords (in a real app, use bcrypt.compare)
//     if (user.password !== req.body.password) {
//       return res.status(401).send({ 
//         success: false, 
//         message: "Invalid email or password" 
//       });
//     }

//     // Generate JWT token
//     const token = generateToken(user);

//     // Return user data (excluding password) and token
//     const userData = user.toObject();
//     delete userData.password;

//     res.status(200).send({
//       success: true,
//       message: "Login successful",
//       token: token,
//       user: userData
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).send({
//       success: false,
//       message: "An error occurred during login",
//       error: error.message
//     });
//   }
// }


// // In your login controller
// const generateToken = (user) => {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) throw new Error('JWT_SECRET not configured');

//   // Handle hex format secret consistently
//   const signingKey = /^[0-9a-fA-F]{64}$/.test(secret) 
//     ? Buffer.from(secret, 'hex') 
//     : secret;

//   return jwt.sign(
//     {
//       id: user._id.toString(),
//       iat: Math.floor(Date.now() / 1000),
//       exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
//     },
//     signingKey,
//     { algorithm: 'HS256' }
//   );
// };






const jwt = require('jsonwebtoken');
const UserModel = require('../models/User'); // adjust path
// bcrypt is already used in your schema

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Find user by email only
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).send({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data excluding password
    const userData = user.toObject();
    delete userData.password;

    return res.status(200).send({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).send({
      success: false,
      message: 'An error occurred during login',
      error: error.message
    });
  }
}

// JWT generation function (unchanged)
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  const signingKey = /^[0-9a-fA-F]{64}$/.test(secret) 
    ? Buffer.from(secret, 'hex') 
    : secret;

  return jwt.sign(
    {
      id: user._id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    signingKey,
    { algorithm: 'HS256' }
  );
};

module.exports = { loginUser };