const express = require('express');
const {body} = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.post('/signup', [
    body('email')
    .isEmail()
    .normalizeEmail()
    .custom((value, {req})=>{
        return User.findOne({email: value})
        .then((user)=>{
            if(user){
                return Promise.reject("User already exists!");
            }
        });
    }),
    body('name')
    .trim()
    .isLength({min: 5})
    .not()                                 // to negate the result of another validation function(here .isEmpty()) before which it is used
    .isEmpty(),
    body('password')
    .trim()
    .isLength({min: 6})
    .isAlphanumeric() 
],
authController.postSignup);

router.post('/login', authController.postLogin);

module.exports = router;