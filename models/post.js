const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        require: true
    },
    content: {
        type: String,
        require: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true}
);


module.exports = mongoose.model('Post', postSchema);