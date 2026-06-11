const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Single shared Socket.IO instance, accessed elsewhere via getIO().
let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        },
    });

    // Authenticate every connection during the handshake using the same JWT as
    // the REST API. The client sends its access token in `auth.token`.
    io.use((socket, next) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            socket.user = jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user.userId;

        // Each user has a private room named after their id. Membership is set
        // from the verified token, so a client can't subscribe to anyone else's
        // notifications.
        socket.join(`user:${userId}`);

        // Flush anything that accumulated while the user was offline.
        try {
            const notificationService = require('../services/notificationService');
            await notificationService.deliverPending(userId);
        } catch (err) {
            console.error('Pending notification delivery failed:', err.message);
        }
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.IO has not been initialised');
    return io;
};

module.exports = { initSocket, getIO };
