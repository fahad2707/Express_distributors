import '../load-env';
import mongoose, { type ConnectOptions } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/express_distributors';

/** If set, overrides the database segment of MONGODB_URI (same cluster, different DB). */
function mongoConnectOptions(): ConnectOptions {
  const dbName = process.env.MONGODB_DB_NAME?.trim();
  return {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryReads: true,
    retryWrites: true,
    ...(dbName ? { dbName } : {}),
  };
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongoConnectOptions());
    const hostMatch = MONGODB_URI.match(/@([^/?]+)/);
    const hostHint = hostMatch?.[1];
    console.log(
      `✅ MongoDB connected successfully (database: ${mongoose.connection.name}` +
        (hostHint ? `, host: ${hostHint})` : ')')
    );
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

let reconnecting = false;
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
  if (!reconnecting) {
    reconnecting = true;
    setTimeout(async () => {
      try {
        console.log('🔄 Attempting MongoDB reconnection…');
        await mongoose.connect(MONGODB_URI, mongoConnectOptions());
        console.log('✅ MongoDB reconnected successfully');
      } catch (err) {
        console.error('❌ MongoDB reconnection failed:', err);
      } finally {
        reconnecting = false;
      }
    }, 3000);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

export default connectDB;
