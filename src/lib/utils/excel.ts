/**
 * 엑셀 Import/Export 유틸리티
 * 크리에이터 엑셀 업로드, 프로젝트 데이터 다운로드
 */

import type { Creator, Project } from '../../types/negotiation';

/**
 * CSV를 JSON으로 파싱
 */
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const obj: any = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    data.push(obj);
  }

  return data;
}

/**
 * 크리에이터 CSV 데이터를 Creator 객체로 변환
 */
export function parseCreatorsFromCSV(csvData: any[]): Omit<Creator, 'id' | 'createdAt' | 'updatedAt' | 'stats'>[] {
  return csvData.map((row) => ({
    name: row.name || row.Name || '',
    email: row.email || row.Email || '',
    country: row.country || row.Country || '',
    socialHandles: {
      tiktok: row.tiktok || row.TikTok || row['TikTok Handle'] || '',
      instagram: row.instagram || row.Instagram || row['Instagram Handle'] || '',
      youtube: row.youtube || row.YouTube || row['YouTube Channel'] || '',
    },
    contactInfo: row.contact || row.Contact || row['Contact Info'] || '',
    tags: (row.tags || row.Tags || '').split('|').filter(Boolean),
    blacklisted: false,
    notes: row.notes || row.Notes || '',
  }));
}

/**
 * 프로젝트 데이터를 CSV로 변환
 */
export function projectsToCSV(projects: Project[]): string {
  const headers = [
    'Creator Name',
    'Creator Email',
    'Brand',
    'Project Name',
    'Product Line',
    'Status',
    'Proposed Amount',
    'Agreed Amount',
    'Payment Status',
    'Email Sent',
    'Response Received',
    'Last Updated',
    'Created At',
  ];

  const rows = projects.map((project) => [
    project.creatorName,
    project.creatorEmail,
    project.category.brand,
    project.category.projectName,
    project.category.productLine || '',
    project.status,
    project.initialOffer.amount,
    project.agreement?.finalAmount || '',
    project.payment?.paid ? 'Paid' : 'Pending',
    project.emailSent ? 'Yes' : 'No',
    project.responseReceived ? 'Yes' : 'No',
    new Date(project.lastUpdatedAt).toLocaleDateString(),
    new Date(project.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  
  // BOM 추가 (Excel에서 UTF-8 인식)
  return '\uFEFF' + csv;
}

/**
 * CSV 다운로드
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * 파일 읽기
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * 크리에이터 템플릿 CSV 생성
 */
export function getCreatorTemplateCSV(): string {
  const headers = [
    'Name',
    'Email',
    'Country',
    'TikTok Handle',
    'Instagram Handle',
    'YouTube Channel',
    'Contact Info',
    'Tags',
    'Notes',
  ];

  const sampleRow = [
    'John Doe',
    'john@example.com',
    'US',
    '@johndoe',
    '@johndoe_insta',
    '@johndoe_yt',
    '+1-555-0123',
    'beauty|lifestyle',
    'Top creator in US market',
  ];

  const csv = [headers.join(','), sampleRow.join(',')].join('\n');
  return '\uFEFF' + csv;
}

/**
 * 프로젝트 상세 데이터를 CSV로 변환 (확장 버전)
 */
export function projectsToDetailedCSV(projects: Project[]): string {
  const headers = [
    'Creator Name',
    'Creator Email',
    'Brand',
    'Project Name',
    'Product Line',
    'Region',
    'Status',
    'Contract Type',
    'Proposed Amount',
    'Agreed Amount',
    'Currency',
    'Video Count',
    'Email Sent At',
    'Response Received',
    'Response Type',
    'Agreed At',
    'Payment Method',
    'Payment Info',
    'Payment Status',
    'Paid At',
    'Published Videos',
    'Draft Count',
    'Unread Comments',
    'Assigned To',
    'Team Location',
    'Created At',
    'Last Updated',
    'Completed At',
    'Termination Info',
  ];

  const rows = projects.map((project) => [
    project.creatorName,
    project.creatorEmail,
    project.category.brand,
    project.category.projectName,
    project.category.productLine || '',
    project.category.region || '',
    project.status,
    project.contractType || '',
    project.initialOffer.amount,
    project.agreement?.finalAmount || '',
    project.initialOffer.currency,
    project.initialOffer.videoCount,
    project.emailSentAt || '',
    project.responseReceived ? 'Yes' : 'No',
    project.responseType || '',
    project.agreedAt || '',
    project.agreement?.paymentMethod || '',
    project.agreement?.paymentInfo || '',
    project.payment?.paid ? 'Paid' : 'Pending',
    project.payment?.paidAt || '',
    project.publishedVideos.map((v) => v.url).join(' | '),
    project.draftCount,
    project.unreadCommentCount,
    project.assignedToName,
    project.teamLocation,
    new Date(project.createdAt).toLocaleDateString(),
    new Date(project.lastUpdatedAt).toLocaleDateString(),
    project.completedAt ? new Date(project.completedAt).toLocaleDateString() : '',
    project.terminationInfo
      ? `${project.terminationInfo.terminatedBy}: ${project.terminationInfo.reasons?.join(', ')}`
      : '',
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return '\uFEFF' + csv;
}
