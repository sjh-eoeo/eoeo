import type { Creator, CreatorCSVExport } from '../../types/seeding';

/**
 * CSV 파싱 유틸리티
 */
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    // 간단한 CSV 파싱 (따옴표 처리 포함)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  });
}

/**
 * CSV에서 크리에이터 데이터 파싱
 * 
 * 예상 형식:
 * user id, profile link, email, followers, posts, likes, reasonable rate, offer rate, category
 */
export function parseCreatorsFromCSV(csvData: string[][]): Partial<Creator>[] {
  if (csvData.length === 0) return [];
  
  // 첫 줄이 헤더인지 확인 (숫자가 아니면 헤더로 간주)
  const hasHeader = isNaN(Number(csvData[0][3])); // followers가 숫자가 아니면 헤더
  const dataRows = hasHeader ? csvData.slice(1) : csvData;
  
  const validCategories = ['뷰티', '헤어', '푸드', 'Health', 'Diet', 'Lifestyle', 'Vlog'];
  
  return dataRows
    .filter(row => row.length >= 8 && row[0]) // 최소 8개 컬럼 + userId 필수
    .map(row => {
      const category = row[8]?.trim();
      return {
        userId: row[0]?.trim() || '',
        profileLink: row[1]?.trim() || '',
        email: row[2]?.trim() || '',
        followers: parseInt(row[3]) || 0,
        posts: parseInt(row[4]) || 0,
        likes: parseInt(row[5]) || 0,
        reasonableRate: parseFloat(row[6]) || 0,
        offerRate: parseFloat(row[7]) || 0,
        category: (category && validCategories.includes(category) ? category : '미분류') as any,
        country: row[9]?.trim() || undefined,
        tags: row[10] ? row[10].split('|').map(t => t.trim()).filter(Boolean) : [],
        notes: row[11]?.trim() || undefined,
      };
    });
}

/**
 * 크리에이터 CSV 템플릿 생성
 */
export function getCreatorTemplateCSV(): string {
  const headers = [
    'user id',
    'profile link',
    'email',
    'followers',
    'posts',
    'likes',
    'reasonable rate',
    'offer rate',
    'category (뷰티/헤어/푸드/Health/Diet/Lifestyle/Vlog)',
    'country (optional)',
    'tags (optional, | separated)',
    'notes (optional)'
  ];
  
  const example = [
    '@johndoe',
    'https://www.tiktok.com/@johndoe',
    'john@example.com',
    '150000',
    '250',
    '5000000',
    '500',
    '450',
    '뷰티',
    'United States',
    'Fashion|Lifestyle|Beauty',
    'Top creator in fashion niche'
  ];
  
  return [
    headers.join(','),
    example.join(','),
  ].join('\n');
}

/**
 * 크리에이터 목록을 CSV 다운로드 형식으로 변환
 * 
 * 다운로드 형식: user id, email, offer rate
 */
export function creatorsToCSV(creators: Creator[]): string {
  const headers = ['user id', 'email', 'offer rate'];
  
  const rows = creators.map(creator => [
    creator.userId,
    creator.email,
    creator.offerRate.toString(),
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

/**
 * CSV 파일 다운로드
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 파일을 텍스트로 읽기
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
 * 숫자를 K, M 단위로 포맷팅
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * 금액 포맷팅 (USD)
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
