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

type S3ObjectMetadata = {
  ChecksumAlgorithm: string | null;
  ETag: string;
  Key: string;
  LastModified: string; // ISO date string
  Owner: OwnerObject | null; // Can be refined if Owner structure is known
  RestoreStatus: string | null; // Can be refined if structure is known
  Size: number;
  StorageClass: string;
};

type OwnerObject = {
  DisplayName: string | null;
  ID: string | null;
};

type S3ObjectList = S3ObjectMetadata[];


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

type Session = {
  bucket: string;
  nickname: string;
  region: string;
  endpoint: string;
  token: string;
  exp: number;
};

type UploadStatus = "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

interface UploadState {
  uploads: UploadItem[];
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
}

// Union type for API responses
type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type {
  S3Object,
  ApiResponse,
  PresignResponse,
  S3ObjectList,
  S3ObjectMetadata,
  UploadItem,
  UploadState,
  Session,
  SessionState,
  UploadStatus,
  ApiSuccess,
  ApiError,
};
