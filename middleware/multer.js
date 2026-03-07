// Multer configuration
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Add authentication middleware to the route
router.post('/create', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null;
    
    // Get user ID from authenticated user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newPost = await Post.create({
      title,
      content,
      image,
      author: req.user._id // Add the author field
    });

    res.status(201).json({
      success: true,
      data: newPost
    });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message,
      validationErrors: error.errors // Include validation details
    });
  }
});