


const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST ROUTES
router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, content, categories = [] } = req.body;
    const author = req.user._id;
    const image = req.file ? req.file.filename : null;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Title and content are required'
      });
    }

    const newPost = await Post.create({
      title,
      content,
      author,
      image,
      categories
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatar');

    const total = await Post.countDocuments();

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

router.patch('/:id/views', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).select('views');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: {
        views: post.views
      }
    });
  } catch (error) {
    console.error('Update views error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

router.post('/:postId/like', authMiddleware, async (req, res) => {
  try {
    // 1. Validate postId
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ValidationError',
        message: 'Invalid post ID format' 
      });
    }

    // 2. Find post and check if already liked
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    if (post.likedBy.includes(req.user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already liked this post' 
      });
    }

    // 3. Update post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { 
        $inc: { likes: 1 },
        $push: { likedBy: req.user._id }
      },
      { new: true }
    );

    // 4. Return response
    res.json({ 
      success: true, 
      data: updatedPost 
    });

  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

router.post('/:postId/unlike', authMiddleware, async (req, res) => {
  try {
    // 1. Validate postId
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ValidationError',
        message: 'Invalid post ID format' 
      });
    }

    // 2. Find post and check if not liked
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    if (!post.likedBy.includes(req.user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have not liked this post' 
      });
    }

    // 3. Update post
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { 
        $inc: { likes: -1 },
        $pull: { likedBy: req.user._id }
      },
      { new: true }
    );

    // 4. Return response
    res.json({ 
      success: true, 
      data: updatedPost 
    });

  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});


// Add this to your routes
router.get('/:postId/like-status', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    const hasLiked = post.likedBy.includes(req.user._id);
    res.json({ 
      success: true, 
      hasLiked 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const author = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid post ID format'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Comment content is required'
      });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            author,
            text: content
          }
        },
        $inc: { commentCount: 1 }
      },
      { new: true }
    ).populate('comments.author', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

// In your backend routes
router.get('/:postId/comments', async (req, res) => {
  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(req.params.postId)
      .populate('comments.author', 'name avatar')
      .select('comments');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      comments: post.comments || []
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid ID format'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Comment not found'
      });
    }

    // Check if user is author or admin
    if (!comment.author.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to delete this comment'
      });
    }

    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: { _id: commentId } },
      $inc: { commentCount: -1 }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});


// GET all comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(postId)
      .populate('comments.author', 'name avatar')
      .select('comments');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post.comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});
// USER POSTS ROUTES
router.get('/users/:id/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'User not found'
      });
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatar');

    const total = await Post.countDocuments({ author: userId });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

// DELETE POST
router.delete('/:id/delete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    // Check if user is author or admin
    if (!post.author.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar')
      .populate('likedBy', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Post not found'
      });
    }

    // Increment view count
    await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message
    });
  }
});

module.exports = router;