const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let upload;
let isS3Enabled = false;

const hasS3Creds = 
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_S3_BUCKET;

if (hasS3Creds) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const multerS3 = require('multer-s3');

    const s3 = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION || 'us-east-1',
    });

    upload = multer({
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        key: function (req, file, cb) {
          cb(null, `evidence/${Date.now()}-${file.originalname}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    });
    isS3Enabled = true;
    console.log('✅ AWS S3 Storage Provider configured successfully.');
  } catch (error) {
    console.error('⚠️ Failed to initialize S3 upload provider. Falling back to local disk storage.', error.message);
  }
}

if (!isS3Enabled) {
  // Setup local storage fallback
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  upload = multer({
    storage: localStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });
  console.log('ℹ️ Local Disk Storage Provider configured at backend/uploads/');
}

// Helper function to resolve evidence URL in routes
const getEvidenceUrl = (req, file) => {
  if (!file) return null;
  if (isS3Enabled && file.location) {
    return file.location; // S3 absolute URL
  }
  
  // Local path served statically
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/${file.filename}`;
};

module.exports = {
  upload,
  getEvidenceUrl,
  isS3Enabled
};
