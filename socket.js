let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer);              // establishing a socket.io server
        return io;
    },
    getIO: () => {                     // we will use this socket.io object where we need it
        if(!io){
            throw new Error('socket.io not initialized');
        }
        return io;
    }
}