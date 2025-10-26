import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createApp } from './app.js';

const startServer = async () => {
  try {
    await connectDatabase();

    const app = createApp();
    const port = config.PORT;

    const server = app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`📝 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${port}/api/health`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);

      server.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          await disconnectDatabase();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
