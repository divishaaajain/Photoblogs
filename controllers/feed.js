/* TO DELETE - DELETED POST FROM THE USERS COLLECTION:-

User.updateOne({_id: req.userId}, {$pull: {posts: postId}}).then().catch();
                       |             |       |       |
                find the user      pull    array    item to pull(remove)
                     by id        operator


$pull - pull operator - to specify which item to pull(remove) from the array                                                      



NOTE:- IMPORTANT

1. Starting with 'version 14.3 of Node.js', we can use 'await' keyword OUTSIDE OF 'async' functions on the top-level of module (in the main context) -            TOP-LEVEL AWAIT

2. Functions of mongoose like 'Post.find.countDocuments()', etc. doesnot return a real promise but returns a promise like object (doesnot really matter because async/await, then-catch behaves exactly same with these as they do with real promises).

To make these functions a real promise add '.exec()' to them:-          Post.find().countDocuments().exec()
*/


const fs = require('fs');
const path = require('path');
const {validationResult} = require('express-validator');

const Post = require('../models/post'); 
const User = require('../models/user'); 
const io = require('../socket');                            

const POSTS_PER_PAGE = 2;

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator', 'name')
      .sort({createdAt: -1})                                  // to sort in descending order on the basis of createdAt
      .skip((currentPage-1)*POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE)
    
    if (!posts){
      const error = new Error("Posts not found!");
      error.statusCode = 404;
      throw error;
    }
    return res.status(200).json({message: "Posts retrieved successfully", posts: posts, totalItems: totalItems});
  } catch(err){
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postPost = (req, res, next) => {                                                 // createPost
  const title = req.body.title;
  const content = req.body.content;
  const image = req.file
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    const error = new Error("Validation failed, entered data is incorrect!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;               // inside sync code snippet - no need to use next(), it will automatically look for error-handling middleware
  }

  // Create post in db
  if(!image){
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\" ,"/");                         // To ensure that images can be loaded correctly on the frontend
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId                                                       // req.userId = decoded.userId;     ('is-auth.js')
  });
  post.save()
  .then((result)=>{
    return User.findById(req.userId)
    .then((user)=>{
      user.posts.push(result);
      return user.save()
      .then((userResult)=>{
        io.getIO().emit('posts', {action: 'create', post: result});
        res.status(201).json({                                                     // 201 = resource successfully created
          message: "Post created successfully!",
          post: result,
          creator: {_id: user._id.toString(), name: user.name}
        });
      });  
    });
  })
  .catch((err)=>{
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);                                                          // inside async code snippet - next(); required
  });
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try{
    const post = await Post.findById(postId);
    if(!post){
      const error = new Error('Post not found!');                        // in async code snippet - still not using 'next();'
      error.statusCode = 404;                                            // throw error; - will move the error to the catch block
      throw error;                                                       // and there it will move to 'next(err)';
    }
    const populatedPost = await post.populate('creator', 'name');                   // to retrieve only 'name' field
    res.status(200).json({message: "Post found", post: populatedPost});
  } catch (err) {
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  };
};

exports.updatePost = (req, res, next) => {                                           // Edit Post
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    const error = new Error("Validation failed, entered data is incorrect!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error; 
  }
  const postId = req.params.postId;
  const updatedTitle = req.body.title;
  const updatedContent = req.body.content;
  let updatedImageUrl = req.body.image;
  const image = req.file;
  if(image){
    updatedImageUrl = req.file.path;
  }
  if(!updatedImageUrl){
    const error = new Error("No file picked!");
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId).populate('creator')
  .then((post) => {
    if(!post){
      const error = new Error("Post not found!");
      error.statusCode = 404;
      throw error;
    }
    if(post.creator._id.toString() !== req.userId){
      const error = new Error("Not authorized to edit this post")
      error.statusCode = 403;                                          // 403 = forbidden
      throw error;
    }
    if(updatedImageUrl !== post.imageUrl){
      clearImage(post.imageUrl);
    }
    post.title = updatedTitle;
    post.content = updatedContent;
    post.imageUrl = updatedImageUrl;
    return post.save();
  })
  .then((result)=>{
    io.getIO().emit('posts', {action: 'update', post: result});
    return res.status(200).json({message: "Post updated successfully", post: result});
  })
  .catch((err)=>{
    if(!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  // to check whether the logged in user created the post 
  Post.findById(postId)
  .then((post)=>{
    if(!post){
      const error = new Error("Post not found!");
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId){
      const error = new Error("Not authorized to delete this post")
      error.statusCode = 403;                                          // 403 = forbidden
      throw error;
    }
    clearImage(post.imageUrl);
    return Post.findByIdAndDelete(postId);
  })
  .then((result)=>{
    return User.updateOne({_id: req.userId}, {$pull: {posts: postId}})
    .then(()=>{
      io.getIO().emit('posts', {action: 'delete', post: result});
      res.status(200).json({message:"Post deleted successfully", post: postId});
    })
    
  })
  .catch((err)=>{
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '../', filePath);
  fs.unlink(filePath, (err)=>{
    if(err){
      console.log(err);
    }
  });
};

exports.getStatus = (req, res, next)=>{
  User.findById(req.userId)
  .then((user)=>{
    if(!user){
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({status: user.status});
  })
  .catch((err)=>{
      if(!err.statusCode){
          err.statusCode = 500;
      }
      next(err);
  });
};

exports.updateStatus = (req, res, next)=>{
  const status = req.body.status;
  User.findById(req.userId)
  .then((user)=>{
    if(!user){
      const error = new Error("User not found!");
      error.statusCode = 404;
      throw error;
    }
    user.status = status;
    return user.save()
    .then(()=>{
      res.status(200).json({message: "Status updated!", status: user.status});
    });
  })
  .catch((err)=>{
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  });
};
