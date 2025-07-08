import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
    errorMessage: {
        type: String,
        required: true,
    },
    errorType: {
        type: String,
        enum: ['unknown', 'Error page'],
        default: 'unknown',
    },
    stackTrace: {
        type: String,
    },
    url: {
        type: String,
        required: true,
    },
    screenshot: {
        type: Buffer,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

export default ErrorLog; 