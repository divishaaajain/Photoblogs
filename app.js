const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv').config();

const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, 'images');
    },

    filename: (req, file, cb) => {
        return cb(null, new Date().toISOString().replace(/:/g, '-')+ '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        return cb(null, true);
    }
    cb(null, false);
};

// app.use(bodyParser.urlencoded());                               // x-www-form-urlencoded <form> format
app.use(bodyParser.json());                                        // application/json format - to parse json data
app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {                                      // Setting CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);

app.use((error, req, res, next)=>{
    const status = error.statusCode;
    const message = error.message;                            // default property (hold the error message)
    const data = error.data
    res.status(status).json({message: message, data: data});
});

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster1.digrd5x.mongodb.net/${process.env.MONGO_DEFAULT_DATABSE}?retryWrites=true&w=majority&appName=Cluster1`)
.then((result)=>{                                                        
    const httpServer = app.listen(process.env.PORT || 8080);                                 // database name = messages
    const io = require('./socket').init(httpServer);
    io.on('connection', (socket) => {
        console.log("Connected to client");
    });
})
.catch((err)=>{
    console.log(err);
});
