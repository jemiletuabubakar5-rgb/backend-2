// // // In your auth routes
// // router.post('//users/login', async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

 
// //     const user = await User.findOne({ email });
// //     if (!user) {
// //       return res.status(401).json({ 
// //         success: false,
// //         message: 'Invalid credentials' 
// //       });
// //     }

// //     const isMatch = await user.comparePassword(password);
// //     if (!isMatch) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Invalid credentials'
// //       });
// //     }

// //     const token = user.generateAuthToken();

  
// //     res.status(200).json({
// //       success: true,
// //       token,
// //       user: {
// //         _id: user._id,
// //         name: `${user.first_name} ${user.last_name}`,
// //         email: user.email
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Login error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error during login'
// //     });
// //   }
// // });







// // const jwt = require('jsonwebtoken');
// // require('dotenv').config();

// // // Updated login route handler
// // router.post('/login', async (req, res) => {
// //   try {
// //     const { email, password } = req.body;
    
// //     // 1. Find user
// //     const user = await User.findOne({ email });
// //     if (!user) {
// //       return res.status(401).json({ success: false, message: 'Invalid credentials' });
// //     }

// //     // 2. Verify password (plain text comparison - upgrade to bcrypt later)
// //     if (user.password !== password) {
// //       return res.status(401).json({ success: false, message: 'Invalid credentials' });
// //     }

// //     // 3. Generate token
// //     if (!process.env.JWT_SECRET) {
// //       throw new Error('JWT_SECRET not configured');
// //     }

// //     const token = jwt.sign(
// //       { id: user._id, email: user.email },
// //       process.env.JWT_SECRET,
// //       { expiresIn: '1h' }
// //     );

// //     // 4. Return success with token
// //     res.json({
// //       success: true,
// //       message: 'Login successful',
// //       token,
// //       user: {
// //         id: user._id,
// //         email: user.email,
// //         first_name: user.first_name,
// //         last_name: user.last_name
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Login error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: error.message || 'Login failed'
// //     });
// //   }
// // });













// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/UserModel');

// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 1. Find user
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

//     // 2. Compare hashed password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

//     // 3. Generate JWT
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // 4. Return user without password
//     const userData = { ...user.toObject() };
//     delete userData.password;

//     res.json({ success: true, token, user: userData });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ success: false, message: 'Server error during login' });
//   }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2. Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 3. Generate JWT
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set in .env');

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Return user data without password
    const userData = { ...user.toObject() };
    delete userData.password;

    res.json({ success: true, token, user: userData });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

module.exports = router;