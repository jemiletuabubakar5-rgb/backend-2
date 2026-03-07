




require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const Post = require('../models/PostModel'); 
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/AuthController');
const {
  getUser,
  getsingleUser,
  updatUser,
  deletsingleUser,
  followUser,
  unfollowUser,
  getUserPosts,
} = require('../controllers/UserControler');

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};


router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Create new user
    const user = await User.create({ 
      email, 
      password,
      first_name,
      last_name
    });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.post('/login', async (req, res) => {
    console.log('Request body:', req.body); 
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Return user without password
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});
router.post('/:userId/follow', authMiddleware, followUser);

router.post('/:userId/unfollow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
   

    const [userToUnfollow, currentUser] = await Promise.all([
      User.findById(userId),
      User.findById(req.user._id)
    ]);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove follower without transaction
    userToUnfollow.followers.pull(req.user._id);
    currentUser.following.pull(userId);

    // Save both documents
    await Promise.all([userToUnfollow.save(), currentUser.save()]);

    res.json({
      success: true,
      message: 'Unfollowed successfully',
      data: {
        followersCount: userToUnfollow.followers.length
      }
    });

  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;
    const currentUserId = req.user._id;

    // Your follow/unfollow logic here
    // ...

    res.json({
      success: true,
      message: `${action} successful`,
      followersCount: updatedUser.followers.length,
      isFollowing: action === 'follow',
      updatedFollowers: updatedUser.followers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/:userId/follow-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const isFollowing = user.followers.includes(req.user._id);
    res.json({ isFollowing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// In your post fetching route
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name avatar followers following')
      .lean();
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ensure author.followers is always an array
    post.author.followers = post.author.followers || [];
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:userId/posts', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ObjectId format if using MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch posts
    const posts = await Post.find({ author: userId })
      .sort('-createdAt')
      .select('title createdAt views');
    
    res.json({ success: true, posts });
    
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ 
      message: 'Server error while fetching posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Basic CRUD routes
router.get('/me', authMiddleware, getUser);
router.get('/:id', authMiddleware, getsingleUser);
router.put('/', authMiddleware, updatUser);
router.delete('/', authMiddleware, deletsingleUser);

module.exports = router;




