


// const Post = require('../models/PostModel');
// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');

// // Helper function for error responses
// const errorResponse = (res, status, message, errors = null) => {
//   return res.status(status).json({
//     success: false,
//     message,
//     ...(errors && { errors })
//   });

// };


// exports.getPostComments = async (req, res) => {
//   try {
//     const { postId } = req.params;

//     // Validate postId format
//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ success: false, message: 'Invalid post ID' });
//     }

//     // Find the post and populate the comments with author information
//     const post = await Post.findById(postId)
//       .populate({
//         path: 'comments.author',
//         select: 'name avatar' // Only include name and avatar of the author
//       })
//       .select('comments'); // Only return the comments field

//     if (!post) {
//       return res.status(404).json({ success: false, message: 'Post not found' });
//     }

//     res.json({
//       success: true,
//       comments: post.comments
//     });
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
// exports.getAuthorPosts = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { exclude, limit = 3 } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return errorResponse(res, 400, 'Invalid user ID');
//     }

//     const query = { author: userId };
//     if (exclude) {
//       query._id = { $ne: exclude };
//     }

//     const posts = await Post.find(query)
//       .limit(parseInt(limit))
//       .populate('author', 'name avatar')
//       .sort({ createdAt: -1 })
//       .lean();

//     // Transform image URLs
//     const transformedPosts = posts.map(post => ({
//       ...post,
//       imageUrl: post.image?.startsWith('http') ? post.image : 
//                `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`
//     }));

//     res.status(200).json({
//       success: true,
//       data: transformedPosts
//     });
//   } catch (error) {
//     console.error('Get author posts error:', error);
//     errorResponse(res, 500, 'Failed to fetch author posts');
//   }
// };

// exports.getSinglePost = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return errorResponse(res, 400, 'Invalid post ID format');
//     }

//     const post = await Post.findByIdAndUpdate(
//       req.params.id,
//       { $inc: { views: 1 } },
//       { new: true }
//     )
//     .populate('author', 'name avatar bio followers following')
//     .populate({
//       path: 'comments.author',
//       select: 'name avatar'
//     })
//     .populate('likedBy', 'name avatar')
//     .lean();

//     if (!post) {
//       return errorResponse(res, 404, 'Post not found');
//     }

//     // Transform image URL
//     if (post.image && !post.image.startsWith('http')) {
//       post.imageUrl = `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`;
//     }

//     res.status(200).json({
//       success: true,
//       data: post
//     });
//   } catch (error) {
//     console.error('Get Single Post Error:', error);
//     errorResponse(res, 500, 'Failed to fetch post');
//   }
// };

// exports.fetchComments = async (req, res) => {
//   try {
//     const response = await fetch(`/api/blog/${postId}/comments`, {
//       headers: {
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to fetch comments');
//     }

//     const data = await response.json();
//     return data.comments;
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     throw error; // Re-throw to handle in component
//   }
// };

// exports.createPost = async (req, res) => {
//   try {
//     // Ensure required fields are present
//     if (!req.body.author) {
//       req.body.author = req.user._id; // Assuming you want the logged-in user as author
//     }

//     const post = new Post(req.body);
//     await post.save();
//     res.status(201).json(post);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// }


// // In your blogController.js
// exports.getPosts = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const skip = (page - 1) * limit;

//     const [posts, total] = await Promise.all([
//       Post.find({})
//         .populate('author', 'name avatar')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       Post.countDocuments({})
//     ]);

//     // Process image URLs
//     const processedPosts = posts.map(post => ({
//       ...post,
//       imageUrl: post.image 
//         ? `${req.protocol}://${req.get('host')}/uploads/${post.image.replace(/\\/g, '/')}`
//         : null
//     }));

//     res.status(200).json({
//       success: true,
//       data: processedPosts,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     console.error('Get Posts Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch posts'
//     });
//   }
// };
// // Add comment to a post
// exports.addComment = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { text } = req.body;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return errorResponse(res, 400, 'Invalid post ID');
//     }

//     if (!text || text.trim().length < 2) {
//       return errorResponse(res, 400, 'Comment must be at least 2 characters');
//     }

//     const comment = {
//       text: text.trim(),
//       author: userId
//     };

//     const post = await Post.findByIdAndUpdate(
//       postId,
//       { $push: { comments: comment } },
//       { new: true }
//     ).populate({
//       path: 'comments.author',
//       select: 'name avatar'
//     });

//     if (!post) {
//       return errorResponse(res, 404, 'Post not found');
//     }

//     const newComment = post.comments[post.comments.length - 1];

//     res.status(201).json({
//       success: true,
//       message: 'Comment added successfully',
//       comment: newComment
//     });
//   } catch (error) {
//     console.error('Add Comment Error:', error);
//     errorResponse(res, 500, 'Failed to add comment');
//   }
// };

// exports.getComments = async (req, res) => {
//   try {
//     const comments = await Comment.find({ post: req.params.postId })
//       .populate('author', 'name avatar')
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       comments
//     });
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch comments'
//     });
//   }
// };

// // Get author's posts
// exports.getAuthorPosts = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { exclude, limit = 3 } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return errorResponse(res, 400, 'Invalid user ID');
//     }

//     const query = { author: userId };
//     if (exclude) {
//       query._id = { $ne: exclude };
//     }

//     const posts = await Post.find(query)
//       .limit(parseInt(limit))
//       .populate('author', 'name avatar')
//       .sort({ createdAt: -1 })
//       .lean();

//     // Transform image URLs
//     const transformedPosts = posts.map(post => ({
//       ...post,
//       imageUrl: post.image?.startsWith('http') ? post.image : 
//                `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`
//     }));

//     res.status(200).json({
//       success: true,
//       data: transformedPosts
//     });
//   } catch (error) {
//     console.error('Get author posts error:', error);
//     errorResponse(res, 500, 'Failed to fetch author posts');
//   }
// };

// // Increment views (dedicated endpoint)
// exports.incrementViews = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
//       return errorResponse(res, 400, 'Invalid post ID');
//     }

//     const post = await Post.findByIdAndUpdate(
//       req.params.postId,
//       { $inc: { views: 1 } },
//       { new: true }
//     );

//     if (!post) {
//       return errorResponse(res, 404, 'Post not found');
//     }

//     res.status(200).json({
//       success: true,
//       views: post.views
//     });
//   } catch (error) {
//     console.error('Increment Views Error:', error);
//     errorResponse(res, 500, 'Failed to increment views');
//   }
// };


// // Get comments for a post
// exports.getComments = async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.postId)
//       .select('comments')
//       .populate('comments.author', 'name avatar');

//     if (!post) {
//       return errorResponse(res, 404, 'Post not found');
//     }

//     res.status(200).json({
//       success: true,
//       comments: post.comments
//     });
//   } catch (error) {
//     console.error('Get Comments Error:', error);
//     errorResponse(res, 500, 'Failed to fetch comments');
//   }
// };

// exports.addComment = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { content } = req.body;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid post ID' 
//       });
//     }

//     if (!content || content.trim().length < 2) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Comment must be at least 2 characters' 
//       });
//     }

//     const comment = {
//       text: content.trim(),
//       author: userId
//     };

//     const post = await Post.findByIdAndUpdate(
//       postId,
//       { $push: { comments: comment } },
//       { new: true }
//     ).populate('comments.author', 'name avatar');

//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Post not found' 
//       });
//     }

//     const newComment = post.comments[post.comments.length - 1];

//     res.status(201).json({
//       success: true,
//       message: 'Comment added successfully',
//       comment: newComment
//     });
//   } catch (error) {
//     console.error('Add comment error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to add comment',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };


// exports.likePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid post ID' 
//       });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Post not found' 
//       });
//     }

//     // Check if already liked
//     const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString());
//     if (alreadyLiked) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Post already liked' 
//       });
//     }

//     // Add like
//     post.likedBy.push(userId);
//     post.likes = post.likedBy.length;
//     await post.save();

//     res.status(200).json({
//       success: true,
//       likes: post.likes,
//       likedBy: post.likedBy
//     });
//   } catch (error) {
//     console.error('Like error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error' 
//     });
//   }
// };

// exports.unlikePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid post ID' 
//       });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Post not found' 
//       });
//     }

//     // Check if not already liked
//     const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString());
//     if (!alreadyLiked) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Post not liked' 
//       });
//     }

//     // Remove like
//     post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
//     post.likes = post.likedBy.length;
//     await post.save();

//     res.status(200).json({
//       success: true,
//       likes: post.likes,
//       likedBy: post.likedBy
//     });
//   } catch (error) {
//     console.error('Unlike error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error' 
//     });
//   }
// };


// exports.getAllComments = async (req, res) => {
//   try {
//     const comments = await Comment.find()
//       .populate('author', 'name avatar')
//       .populate('post', 'title')
//       .sort({ createdAt: -1 })
//       .limit(50); // Limit to prevent overloading

//     res.json({
//       success: true,
//       comments
//     });
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch comments'
//     });
//   }
// };


// exports.deleteComment = async (req, res) => {
//   try {
//     const { postId, commentId } = req.params;
//     const userId = req.user.id; // From auth middleware

//     // Validate ObjectIds
//     if (!mongoose.Types.ObjectId.isValid(postId) || 
//         !mongoose.Types.ObjectId.isValid(commentId)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid ID format' 
//       });
//     }

//     // Find the post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Post not found' 
//       });
//     }

//     // Find the comment
//     const commentIndex = post.comments.findIndex(
//       c => c._id.equals(commentId) && 
//            (c.author.equals(userId) || req.user.isAdmin)
//     );

//     if (commentIndex === -1) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Comment not found or unauthorized' 
//       });
//     }

//     // Remove the comment
//     post.comments.splice(commentIndex, 1);
//     await post.save();

//     res.json({ 
//       success: true,
//       message: 'Comment deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete comment error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to delete comment',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };


// exports.deletePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user.id;

//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(postId)) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Invalid post ID' 
//       });
//     }

//     // Find the post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Post not found' 
//       });
//     }

//     // Check if user is author or admin
//     if (post.author.toString() !== userId && !req.user.isAdmin) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Unauthorized to delete this post' 
//       });
//     }

//     // Delete the post
//     await Post.findByIdAndDelete(postId);

//     // Optionally: Delete associated comments or files
//     // await Comment.deleteMany({ post: postId });

//     res.json({ 
//       success: true,
//       message: 'Post deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete post error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Failed to delete post',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };



const Post = require('../models/PostModel');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper function for error responses
const errorResponse = (res, status, message, errors = null) => {
  return {
    status,
    data: {
      success: false,
      message,
      ...(errors && { errors })
    }
  };
};

// Helper function for success responses
const successResponse = (res, status, data) => {
  return {
    status,
    data: {
      success: true,
      ...data
    }
  };
};

exports.createPost = async (postData, req) => {
  try {
    const { title, content, image, author } = postData;
    
    if (!title || !content) {
      return errorResponse(null, 400, 'Title and content are required');
    }

    const newPost = await Post.create({
      title,
      content,
      image,
      author
    });

    // Transform image URL if exists
    if (newPost.image) {
      newPost.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${newPost.image}`;
    }

    return successResponse(null, 201, { post: newPost });
  } catch (error) {
    console.error('Create post error:', error);
    return errorResponse(null, 500, 'Failed to create post');
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({})
        .populate('author', 'name avatar')
        .populate('likedBy', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({})
    ]);

    // Process image URLs
    const processedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.image 
        ? `${req.protocol}://${req.get('host')}/uploads/${post.image}`
        : null
    }));

    return res.status(200).json({
      success: true,
      data: processedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Posts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
};

// In your postController.js
exports.getSinglePost = async (req, res) => {
  try {
    // Always set JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid post ID format' 
      });
    }

    const post = await Post.findById(id)
      .populate('author', 'name avatar bio followers following')
      .populate({
        path: 'comments.author',
        select: 'name avatar'
      })
      .populate('likedBy', 'name avatar');

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Construct proper image URL
    if (post.image) {
      post.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${post.image}`;
    }

    return res.status(200).json({
      success: true,
      data: post
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getAuthorPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { exclude, limit = 3 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID' 
      });
    }

    const query = { author: userId };
    if (exclude) {
      query._id = { $ne: exclude };
    }

    const posts = await Post.find(query)
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Transform image URLs
    const transformedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.image 
        ? `${req.protocol}://${req.get('host')}/uploads/${post.image}`
        : null
    }));

    return res.status(200).json({
      success: true,
      data: transformedPosts
    });
  } catch (error) {
    console.error('Get author posts error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch author posts' 
    });
  }
};

exports.incrementViews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    return res.status(200).json({
      success: true,
      views: post.views
    });
  } catch (error) {
    console.error('Increment Views Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to increment views' 
    });
  }
};


exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    if (!text || text.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Comment must be at least 2 characters' 
      });
    }

    const comment = {
      text: text.trim(),
      author: userId
    };

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: comment } },
      { new: true }
    ).populate({
      path: 'comments.author',
      select: 'name avatar'
    });

    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    const newComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to add comment' 
    });
  }
};

exports.getAllComments = async (req, res) => {
  try {
    const posts = await Post.find()
      .select('comments')
      .populate({
        path: 'comments.author',
        select: 'name avatar'
      })
      .limit(50);

    const allComments = posts.flatMap(post => 
      post.comments.map(comment => ({
        ...comment.toObject(),
        postId: post._id,
        postTitle: post.title
      }))
    );

    return res.json({
      success: true,
      comments: allComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if already liked
    if (post.likedBy.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post already liked',
        likes: post.likes,
        likedBy: post.likedBy
      });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { likes: 1 },
        $addToSet: { likedBy: userId }
      },
      { new: true }
    ).select('likes likedBy');

    return res.json({
      success: true,
      message: 'Post liked successfully',
      likes: updatedPost.likes,
      likedBy: updatedPost.likedBy
    });
  } catch (error) {
    console.error('Like error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if not liked
    if (!post.likedBy.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post not liked yet',
        likes: post.likes,
        likedBy: post.likedBy
      });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { likes: -1 },
        $pull: { likedBy: userId }
      },
      { new: true }
    ).select('likes likedBy');

    return res.json({
      success: true,
      message: 'Post unliked successfully',
      likes: updatedPost.likes,
      likedBy: updatedPost.likedBy
    });
  } catch (error) {
    console.error('Unlike error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId) || 
        !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid ID format' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.equals(commentId) && 
           (c.author.equals(userId) || req.user.isAdmin)
    );

    if (commentIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found or unauthorized' 
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return res.json({ 
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to delete comment'
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    if (post.author.toString() !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to delete this post' 
      });
    }

    // Delete associated image if exists
    if (post.image) {
      const imagePath = path.join(__dirname, '../uploads', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Post.findByIdAndDelete(postId);

    return res.json({ 
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to delete post'
    });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId)
      .populate({
        path: 'comments.author',
        select: 'name avatar'
      })
      .select('comments');

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    return res.json({
      success: true,
      comments: post.comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
};