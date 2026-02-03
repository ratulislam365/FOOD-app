import app from './app';
import config from './config';
import connectDB from './database/db';
import { initJobs } from './jobs/cleanup.job';
import { socketService } from './services/socket.service';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Connect to Database
connectDB();

const server = app.listen(5000, () => {
    console.log(`App running on port ${config.port}...`);
    initJobs();
    socketService.init(server);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
