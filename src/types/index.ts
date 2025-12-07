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

type SessionResponse = {
  token: string;
};

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
}

type Metadata = {
  [key: string]: string;
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
  ApiResponse,
  PresignResponse,
  S3ObjectList,
  S3ObjectMetadata,
  ObjectACLResponse,
  UploadItem,
  UploadState,
  SessionResponse,
  Session,
  ObjectHead,
  Grant,
  SessionState,
  UploadStatus,
  ApiSuccess,
  ApiError,
};
