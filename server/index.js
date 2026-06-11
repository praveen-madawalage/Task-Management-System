require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const labelRoutes = require('./routes/labelRoutes');
const commentRoutes = require('./routes/commentRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { scheduleTokenCleanup } = require('./jobs/tokenCleanup');
const { scheduleDeadlineReminders } = require('./jobs/deadlineReminders');
const { initSocket } = require('./sockets/io');

const app = express();
const PORT = process.env.PORT || 8000;

// Security headers
app.use(helmet());

// Rate limiting — applied globally; tighten per-route on auth endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// These routers own nested sub-paths (e.g. /tasks/:id/labels, /tasks/:id/comments).
// Mounted before projects/tasks so those specific sub-paths match here first.
app.use('/api', labelRoutes);
app.use('/api', commentRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// API documentation (Swagger UI + raw OpenAPI spec)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Wrap Express in an HTTP server so REST and WebSockets share the same port.
const server = http.createServer(app);
initSocket(server);

// Background jobs
scheduleTokenCleanup();
scheduleDeadlineReminders();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
