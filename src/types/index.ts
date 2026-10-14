export * from "./user.types";

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

interface ObjectACLResponse {
  Grants: Grant[];
  Owner: OwnerObject;
}

interface Grant {
  Grantee: Grantee;
  Permission: string;
}

interface Grantee {
  Type: "Group" | "CanonicalUser";
  ID?: string;
  DisplayName?: string;
  URI?: string;
  EmailAddress?: string;
}

interface PresignResponse {
  url: string;
  /** Seconds, as a string — the API echoes back what it signed for. */
  expiration: string;
}

/**
 * One entry from GET /folder — a recursive listing of everything under a folder.
 * ⚠️ snake_case (aws.Object), unlike the PascalCase S3 shapes above.
 */
type FolderObject = {
  key: string;
  size: number;
  last_modified: string;
};

// Generic success response
type ApiSuccess<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
  /** Present on capped listings (GET /objects, /folders). */
  pagination?: ListTruncation;
};

/** openbucket-api's `pagination` block for listings capped at `limit` entries. */
type ListTruncation = {
  truncated: boolean;
  limit: number;
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
  id: number;
  bucket: string;
  nickname: string;
  region: string;
  endpoint: string;
  inserted_at: string;
  updated_at: string;
};

type ObjectHead = {
  AcceptRanges?: string;
  ArchiveStatus?: string;
  BucketKeyEnabled?: boolean;
  CacheControl?: string;
  ChecksumCRC32?: string;
  ChecksumCRC32C?: string;
  ChecksumSHA1?: string;
  ChecksumSHA256?: string;
  ContentDisposition?: string;
  ContentEncoding?: string;
  ContentLanguage?: string;
  ContentLength: number;
  ContentType: string;
  DeleteMarker?: boolean;
  ETag: string;
  Expiration?: string;
  Expires?: string;
  LastModified: string;
  Metadata: Metadata;
  MissingMeta?: number;
  ObjectLockLegalHoldStatus?: string;
  ObjectLockMode?: string;
  ObjectLockRetainUntilDate?: string;
  PartsCount?: number;
  ReplicationStatus?: string;
  RequestCharged?: string;
  Restore?: string;
  SSECustomerAlgorithm?: string;
  SSECustomerKeyMD5?: string;
  SSEKMSKeyId?: string;
  ServerSideEncryption?: string;
  StorageClass?: string;
  VersionId?: string;
  WebsiteRedirectLocation?: string;
};

type Metadata = {
  [key: string]: string;
};

type UploadStatus = "uploading" | "success" | "error" | "canceled";

type UploadItem = {
  id: string;
  fileName: string;
  /** Bytes. */
  size?: number;
  /** Prefix the file is going into ("" = bucket root). */
  prefix?: string;
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
  isInitialized: boolean;
}

type BulkACLResult = {
  key: string;
  success: boolean;
};

// Union type for API responses
type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type {
  ApiResponse,
  PresignResponse,
  FolderObject,
  S3ObjectList,
  S3ObjectMetadata,
  ObjectACLResponse,
  UploadItem,
  UploadState,
  Session,
  ObjectHead,
  Grant,
  SessionState,
  UploadStatus,
  BulkACLResult,
  ApiSuccess,
  ApiError,
  ListTruncation,
};
