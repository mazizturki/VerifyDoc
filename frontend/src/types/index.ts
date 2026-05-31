export interface Admin {
  id: string;
  email: string;
  name: string;
}

export interface ReportVersion {
  id: string;
  reportId: string;
  version: string;
  platformVersion: string;
  generatedAt: string;
  sha256Hash: string;
  fileId: string;
  createdAt: string;
  file?: { originalName: string; size: number };
}

export interface Report {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  supervisors: string[];
  university: string;
  hostCompany?: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
  currentVersionId?: string;
  versions: ReportVersion[];
}

export interface PaginatedReports {
  data: Report[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface VerifyResult {
  match: boolean;
  providedHash: string;
  officialHash: string;
  version: string;
}
