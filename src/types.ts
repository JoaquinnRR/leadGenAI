export interface Lead {
  id: string;
  name: string;
  industry: string;
  location: string;
  comuna?: string;
  phone: string;
  website: string | null;
  status: 'no_website' | 'old_tech' | 'optimized';
  lastFound: string;
  userId?: string;
  createdAt?: any;
  notes?: string;
  notesList?: Array<{ id: string; content: string; date: string }>;
  crmStatus?: 'new' | 'contacted' | 'pitching' | 'closed' | 'rejected' | 'modern' | 'wait';
  statusHistory?: Array<{ date: string; from: string; to: string }>;
  analysis?: Analysis;
  reminderAt?: string;
  analysisHistory?: Array<{ date: string; analysis: Analysis }>;
  isSimulated?: boolean;
  offeredServices?: string[];
}

export interface Analysis {
  analysis: string;
  useCases: string[];
  pitch: string;
  marketTrends?: string[];
  competitors?: string[];
  isFallback?: boolean;
}
