import mongoose from "mongoose";

const catalogUploadSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  textLength: {
    type: Number,
    required: true
  },
  productsExtracted: {
    type: Number,
    default: 0
  },
  sessionId: {
    type: String,
    index: true
  },
  userId: {
    type: String,
    default: 'anonymous',
    index: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processed', 'failed'],
    default: 'uploaded'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

catalogUploadSchema.index({ createdAt: -1 });

const CatalogUpload = mongoose.model('CatalogUpload', catalogUploadSchema);

export default CatalogUpload;
