const express = require('express');
const {body} = require('express-validator');

const feedController = require('../controllers/feed');

const router = express.Router();
const isAuth = require('../middleware/is-auth');

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth, [                                                   // createPost
    body('title')
    .trim()
    // .isString()
    .isLength({min:5}),
    body('content')
    .trim()
    // .isString()
    .isLength({min:5})
],
feedController.postPost);                                                     

router.get('/post/:postId', isAuth, feedController.getPost);

router.put('/post/:postId', isAuth, [                                                 // method = PUT - to create or overwrite a resource
    body('title')
    .trim()
    .isLength({min: 5}),
    body('content')
    .trim()
    .isLength({min: 5})
],
feedController.updatePost);

router.delete('/post/:postId', isAuth, feedController.deletePost);

router.get('/status', isAuth, feedController.getStatus);

router.put('/status', isAuth, body('status').trim().not().isEmpty(), feedController.updateStatus);              // to update status

module.exports = router;