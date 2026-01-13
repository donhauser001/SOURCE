/**
 * S3 客户端封装
 * 支持 AWS S3 和兼容的对象存储服务（如 MinIO、Cloudflare R2）
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 客户端实例
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // 兼容 MinIO
});

const BUCKET = process.env.S3_BUCKET || 'source-attachments';
const CDN_URL = process.env.S3_CDN_URL; // 可选的 CDN 前缀

/**
 * 允许的文件类型
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * 最大文件大小（10MB）
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 生成唯一的文件名
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || '';
  return `${timestamp}-${random}.${ext}`;
}

/**
 * 生成上传预签名 URL
 */
export async function generateUploadUrl(options: {
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const { filename, contentType, folder = 'tickets' } = options;
  
  const key = `${folder}/${generateFilename(filename)}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300, // 5 分钟有效
  });
  
  // 构建最终文件 URL
  const fileUrl = CDN_URL 
    ? `${CDN_URL}/${key}`
    : `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
  
  return { uploadUrl, fileUrl, key };
}

/**
 * 删除文件
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  
  await s3Client.send(command);
}

/**
 * 验证文件
 */
export function validateFile(file: { size: number; type: string; name: string }): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件大小不能超过 10MB' };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: '不支持的文件类型' };
  }
  
  return { valid: true };
}
