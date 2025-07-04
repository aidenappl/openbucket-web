// S3 Object
interface S3Object {
  AcceptRanges?: string;
  Body?: object;
  BucketKeyEnabled?: boolean | null;
  CacheControl?: string | null;
  ChecksumCRC32?: string | null;
  ChecksumCRC32C?: string | null;
  ChecksumSHA1?: string | null;
  ChecksumSHA256?: string | null;
  ContentDisposition?: string | null;
  ContentEncoding?: string | null;
  ContentLanguage?: string | null;
  ContentLength?: number;
  ContentRange?: string | null;
  ContentType?: string | null;
  DeleteMarker?: boolean | null;
  ETag?: string;
  Expiration?: string | null;
  Expires?: string | null;
  LastModified?: string;
  Metadata?: { [key: string]: string } | null;
  MissingMeta?: number | null;
  ObjectLockLegalHoldStatus?: string | null;
  ObjectLockMode?: string | null;
  ObjectLockRetainUntilDate?: string | null;
  PartsCount?: number | null;
  ReplicationStatus?: string | null;
  RequestCharged?: string | null;
  Restore?: string | null;
  SSECustomerAlgorithm?: string | null;
  SSECustomerKeyMD5?: string | null;
  SSEKMSKeyId?: string | null;
  ServerSideEncryption?: string | null;
  StorageClass?: string | null;
  TagCount?: number | null;
  VersionId?: string | null;
  WebsiteRedirectLocation?: string | null;
}

interface PresignResponse {
  url: string;
  expires_in: string;
}


// Generic success response
type ApiSuccess<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
};

// Generic error response
type ApiError = {
  success: false;
  status: number;
  error: string;
  error_message: string;
  error_code: number;
};

// Union type for API responses
type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type { S3Object, ApiResponse, PresignResponse };