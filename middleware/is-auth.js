/* To check the existence and validity of the token sent to us (as 'Authorization' header) by the client with the incoming request:-


1. jwt.verify(token, 'privatekey', (err, decoded)=>{...});    -    To verify + decode(payload)                 (Async)
                |         |
              string    string/buffer  

This method is used to verify the validity of a JWT and decode its payload(JSON Object). It verifies the signature and the expiration date of the token and returns the decoded payload if the token is valid.


2. jwt.decode(token);    -    Only decode(payload)

Only decodes the payload of a JWT without verifying its signature or the expiration date.                                        */


const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {                                      
    const tokenHeader = req.get('Authorization');                       // token from frontend = Authorization: 'Bearer '+this.props.token
    if(!tokenHeader){
        const error = new Error("Not authorized")
        error.statusCode = 401;
        throw error;
    }
    const token = tokenHeader.split(' ')[1];                            // extracting incoming token from the 'Authorization' header
    jwt.verify(token, 'privatesecretkey', (err, decoded)=>{
        if(err){                                                        // technical error                         
            throw err;
        }
        if(!decoded){                                                   // didnot fail technically, but unable to verify the token
            const error = new Error('Authorization failed');
            error.statusCode = 401;
            throw error;
        }
        req.userId = decoded.userId;                                    // valid token on successful verification (decoded = payload)
        next();
    });
};