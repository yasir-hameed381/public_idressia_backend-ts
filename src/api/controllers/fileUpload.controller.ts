import { Request, Response, NextFunction } from 'express';
import AWS from 'aws-sdk';
import path from 'path';
import logger from '../../config/logger';

const getS3Client = () =>
  new AWS.S3({
    endpoint: process.env.SPACES_ENDPOINT || process.env.S3_ENDPOINT,
    accessKeyId: process.env.SPACES_KEY || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_SECRET || process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.SPACES_REGION || process.env.AWS_REGION || 'us-east-1',
    s3ForcePathStyle: false,
    signatureVersion: 'v4',
  });

export const createMultipartUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, contentType, directory = 'uploads', private: isPrivate = false } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Filename and contentType are required',
      });
    }
    const s3 = getS3Client();
    const bucket = process.env.SPACES_BUCKET || process.env.S3_BUCKET;
    const fileExtension = path.extname(filename);
    const filenameWithoutExt = path.basename(filename, fileExtension);
    const slugifiedName = filenameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const uploadFileName = `${slugifiedName}-${uniqueId}${fileExtension}`;
    const key = `${directory}/${uploadFileName}`;
    const result = await s3.createMultipartUpload({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ACL: isPrivate ? 'private' : 'public-read',
    }).promise();
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Expires: 3600,
    });
    return res.json({
      success: true,
      message: 'Upload created successfully',
      data: {
        uploadName: uploadFileName,
        uploadId: result.UploadId,
        key: result.Key,
        url: presignedUrl,
      },
    });
  } catch (error) {
    logger.error('Error creating multipart upload:', error);
    return next(error);
  }
};

export const signPart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId, key, partNumber } = req.body;
    if (!uploadId || !key || !partNumber) {
      return res.status(400).json({
        success: false,
        message: 'uploadId, key, and partNumber are required',
      });
    }
    const s3 = getS3Client();
    const bucket = process.env.SPACES_BUCKET || process.env.S3_BUCKET;
    const signedUrl = s3.getSignedUrl('uploadPart', {
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Expires: 3600,
    });
    return res.json({
      success: true,
      message: 'Part signed successfully',
      data: { url: signedUrl },
    });
  } catch (error) {
    logger.error('Error signing part:', error);
    return next(error);
  }
};

export const listParts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId, key } = req.body;
    if (!uploadId || !key) {
      return res.status(400).json({
        success: false,
        message: 'uploadId and key are required',
      });
    }
    const s3 = getS3Client();
    const bucket = process.env.SPACES_BUCKET || process.env.S3_BUCKET;
    const result = await s3
      .listParts({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
      .promise();
    return res.json({
      success: true,
      message: 'Parts listed successfully',
      data: { parts: result.Parts || [] },
    });
  } catch (error) {
    logger.error('Error listing parts:', error);
    return next(error);
  }
};

export const completeMultipartUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId, key, parts } = req.body;
    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return res.status(400).json({
        success: false,
        message: 'uploadId, key, and parts array are required',
      });
    }
    const s3 = getS3Client();
    const bucket = process.env.SPACES_BUCKET || process.env.S3_BUCKET;
    const result = await s3
      .completeMultipartUpload({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
      .promise();
    const publicUrl =
      result.Location ||
      `https://${bucket}.${process.env.SPACES_REGION || 'nyc3'}.digitaloceanspaces.com/${key}`;
    return res.json({
      success: true,
      message: 'Upload completed successfully',
      data: {
        location: result.Location,
        url: publicUrl,
        key,
      },
    });
  } catch (error) {
    logger.error('Error completing multipart upload:', error);
    return next(error);
  }
};

export const abortMultipartUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId, key } = req.body;
    if (!uploadId || !key) {
      return res.status(400).json({
        success: false,
        message: 'uploadId and key are required',
      });
    }
    const s3 = getS3Client();
    const bucket = process.env.SPACES_BUCKET || process.env.S3_BUCKET;
    await s3
      .abortMultipartUpload({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      })
      .promise();
    return res.json({
      success: true,
      message: 'Multipart upload aborted successfully',
    });
  } catch (error) {
    logger.error('Error aborting multipart upload:', error);
    return next(error);
  }
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    const { directory = 'files' } = req.body;
    const file = req.file;
    const s3 = getS3Client();
    const bucket = process.env.SPACES_BUCKET || process.env.S3_BUCKET;
    const fileExtension = path.extname(file.originalname);
    const filenameWithoutExt = path.basename(file.originalname, fileExtension);
    const slugifiedName = filenameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const uploadFileName = `${slugifiedName}-${uniqueId}${fileExtension}`;
    const key = `${directory}/${uploadFileName}`;
    const result = await s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();
    const publicUrl =
      result.Location ||
      `https://${bucket}.${process.env.SPACES_REGION || 'nyc3'}.digitaloceanspaces.com/${key}`;
    return res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        uploadName: uploadFileName,
        path: key,
        key,
        url: publicUrl,
        uploadURL: publicUrl,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    return next(error);
  }
};
