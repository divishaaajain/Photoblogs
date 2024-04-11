/* AUTHENTICATION IN REST APIs

The client sends authentication data(email/pw) to the server, here we don't use sessions anymore to store the auth data because REST APIs ARE STATELES(strict decoupling of server and client).

Here, the server returns a token to client which is generated oon the server which is then stored on the client(in browser-local storage), the client then attaches this token with everu subsequent request it sends to the server. 

So, THIS TOKEN IS THEN ATTACHED TO EVERY REQUEST THAT TARGETS A RESOURCE ON THE SERVER WHICH REQUIRES AUTHENTICATION. This token can only be validated by the server who created it and if anybody tries to manipulate/forge the token on the frontend, it will be detected.



CONTENT/DATA OF TOKEN:-

Token    =    JSON Data        +        Signature         +          JSON Web Token(JWT)   
                                            |                                |
                        generated on the server with a special         returned to the client(stored here)    
                    private key which is only stored on the server 
                (can only be verified by the server via 'secret key')



TO CREATE JSON WEB TOKEN(JWT):-

STEP-1: Install 'jsonwebtoken' package              --              npm install --save jsonwebtoken

STEP-2: Import it where you want to use it          --              const jwt = require('jsonwebtoken');


jwt.sign(parameters) - method used to generate a JSON web token based on a payload and a secret private key

Parameters:-

1. Payload:- (JSON OBJECT) - user data you want to encode in the token

2. secret or private key:- (String/Buffer) - e.g., 'secret', 'somesecretkey', etc.

3. options:- (OBJECT)

(i) 'expiresIn' - (String/Number) - for the expiration of the token
- Numeric value (in seconds) or a string in the format described by zeit/ms module i.e. '1d', '2h' for 1 day, 2 hours resp.

(ii) 'notBefore' - (String/Number) - the not before date/time of the token                       (Same format as above)

... etc.                                                                                                                        



In exports.postSignup:-

const token = jwt.sign({
    email: user.email,                                                            - payload(JSON Data)
    userId: user._id.toString()
}, 'privatesecretkey', {                                                          - private key
    expiresIn: '1h'                                                               - option:- 'expiresIn'
});
res.status(200).json({token: token, userId: user._id.toString()});                - sending token to the client



NOTE:- 1. We can find token information in the browser - Application - local storage
       2. To learn more about token - jwt.io                                                                                  */  


const {validationResult} = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.postSignup = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error; 
    }
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    bcryptjs.hash(password, 12)
    .then((hashedPassword)=>{
        const user = new User({
            email: email, 
            name: name,
            password: hashedPassword,
            posts: []
        });
        return user.save();
    })
    .then((result)=>{
        res.status(201).json({message: "New user created", userId: result._id.toString()});
    })
    .catch((err)=>{
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email})
    .then((user)=>{
        if(!user){
            const error = new Error("User doesnot exist");
            error.statusCode = 401;                               // not authenticated
            throw error;
        }
        return bcryptjs.compare(password, user.password)
        .then((result) => {
            if(result){
                const token = jwt.sign({
                    email: user.email,
                    userId: user._id.toString()
                }, 'privatesecretkey', {
                    expiresIn: '1h'
                });
                return res.status(200).json({token: token, userId: user._id.toString()});
            }
            const error = new Error("User doesnot exist");
            error.statusCode = 401;                               // not authenticated
            throw error;
        });
    })
    .catch((err)=>{
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
};