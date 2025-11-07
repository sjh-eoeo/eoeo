/**
 * 자동 백업 시스템
 * 
 * - 1시간마다 모든 Zustand store 데이터를 localStorage에 백업
 * - 최대 7일(168시간) 보관
 * - 오래된 백업 자동 삭제
 */

const BACKUP_PREFIX = 'eoeo_backup_';
const BACKUP_INTERVAL = 60 * 60 * 1000; // 1시간 (밀리초)
const MAX_BACKUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7일 (밀리초)

interface BackupData {
  timestamp: number;
  data: {
    creators?: any;
    projects?: any;
    brands?: any;
    reachOuts?: any;
    negotiations?: any;
    productions?: any;
    payments?: any;
  };
}

/**
 * 모든 스토어 데이터를 백업
 */
export function createBackup(): void {
  try {
    const timestamp = Date.now();
    const backupKey = `${BACKUP_PREFIX}${timestamp}`;
    
    // localStorage에서 모든 스토어 데이터 수집
    const backup: BackupData = {
      timestamp,
      data: {
        creators: localStorage.getItem('seeding-creator-store'),
        projects: localStorage.getItem('seeding-project-store'),
        brands: localStorage.getItem('seeding-brand-store'),
        reachOuts: localStorage.getItem('seeding-reach-out-store'),
        negotiations: localStorage.getItem('seeding-negotiation-store'),
        productions: localStorage.getItem('seeding-production-store'),
        payments: localStorage.getItem('seeding-payment-store'),
      },
    };
    
    // 백업 저장
    localStorage.setItem(backupKey, JSON.stringify(backup));
    console.log(`✅ Backup created: ${new Date(timestamp).toLocaleString('ko-KR')}`);
    
    // 오래된 백업 정리
    cleanOldBackups();
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
  }
}

/**
 * 7일 이상 된 백업 삭제
 */
export function cleanOldBackups(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    // 모든 백업 키 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        try {
          const backup: BackupData = JSON.parse(localStorage.getItem(key) || '{}');
          const age = now - backup.timestamp;
          
          // 7일 이상 된 백업 표시
          if (age > MAX_BACKUP_AGE) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // 파싱 실패한 백업도 삭제
          keysToRemove.push(key);
        }
      }
    }
    
    // 오래된 백업 삭제
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Old backup removed: ${key}`);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`✅ Cleaned ${keysToRemove.length} old backup(s)`);
    }
  } catch (error) {
    console.error('❌ Backup cleanup failed:', error);
  }
}

/**
 * 모든 백업 목록 조회
 */
export function listBackups(): Array<{ key: string; timestamp: number; date: string }> {
  const backups: Array<{ key: string; timestamp: number; date: string }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        try {
          const backup: BackupData = JSON.parse(localStorage.getItem(key) || '{}');
          backups.push({
            key,
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp).toLocaleString('ko-KR'),
          });
        } catch (e) {
          // 파싱 실패한 백업은 무시
        }
      }
    }
    
    // 최신순으로 정렬
    backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
  }
  
  return backups;
}

/**
 * 특정 백업으로 복원
 */
export function restoreBackup(backupKey: string): boolean {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      console.error('❌ Backup not found:', backupKey);
      return false;
    }
    
    const backup: BackupData = JSON.parse(backupData);
    
    // 각 스토어 데이터 복원
    if (backup.data.creators) {
      localStorage.setItem('seeding-creator-store', backup.data.creators);
    }
    if (backup.data.projects) {
      localStorage.setItem('seeding-project-store', backup.data.projects);
    }
    if (backup.data.brands) {
      localStorage.setItem('seeding-brand-store', backup.data.brands);
    }
    if (backup.data.reachOuts) {
      localStorage.setItem('seeding-reach-out-store', backup.data.reachOuts);
    }
    if (backup.data.negotiations) {
      localStorage.setItem('seeding-negotiation-store', backup.data.negotiations);
    }
    if (backup.data.productions) {
      localStorage.setItem('seeding-production-store', backup.data.productions);
    }
    if (backup.data.payments) {
      localStorage.setItem('seeding-payment-store', backup.data.payments);
    }
    
    console.log(`✅ Backup restored: ${new Date(backup.timestamp).toLocaleString('ko-KR')}`);
    console.log('🔄 Please refresh the page to apply changes');
    
    return true;
  } catch (error) {
    console.error('❌ Backup restoration failed:', error);
    return false;
  }
}

/**
 * 자동 백업 시작
 */
export function startAutoBackup(): () => void {
  console.log('🚀 Auto-backup system started (1-hour interval, 7-day retention)');
  
  // 즉시 첫 백업 생성
  createBackup();
  
  // 1시간마다 백업
  const intervalId = setInterval(() => {
    createBackup();
  }, BACKUP_INTERVAL);
  
  // cleanup 함수 반환
  return () => {
    clearInterval(intervalId);
    console.log('🛑 Auto-backup system stopped');
  };
}

/**
 * 백업 통계 조회
 */
export function getBackupStats(): {
  totalBackups: number;
  oldestBackup: string | null;
  newestBackup: string | null;
  totalSize: number;
} {
  const backups = listBackups();
  
  let totalSize = 0;
  backups.forEach(backup => {
    const data = localStorage.getItem(backup.key);
    if (data) {
      totalSize += new Blob([data]).size;
    }
  });
  
  return {
    totalBackups: backups.length,
    oldestBackup: backups.length > 0 ? backups[backups.length - 1].date : null,
    newestBackup: backups.length > 0 ? backups[0].date : null,
    totalSize: Math.round(totalSize / 1024), // KB
  };
}
