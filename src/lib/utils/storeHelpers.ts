/**
 * Store 안정성 헬퍼 함수들
 * 
 * 동시성 문제 해결 및 데이터 일관성 유지
 */

/**
 * 배열에서 중복 없이 아이템 추가
 */
export function addUniqueItem<T>(array: T[], item: T): T[] {
  if (array.includes(item)) {
    return array;
  }
  return [...array, item];
}

/**
 * 배열에서 아이템 안전하게 제거
 */
export function removeItem<T>(array: T[], item: T): T[] {
  return array.filter((i) => i !== item);
}

/**
 * 배열에서 여러 아이템 추가 (중복 제거)
 */
export function addUniqueItems<T>(array: T[], items: T[]): T[] {
  const existingSet = new Set(array);
  const newItems = items.filter((item) => !existingSet.has(item));
  return [...array, ...newItems];
}

/**
 * 현재 타임스탬프 생성
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * ID 생성 (더욱 안전한 unique ID)
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}${random2}`;
}

/**
 * 객체 배열에서 ID로 아이템 찾기 (타입 안전)
 */
export function findById<T extends { id: string }>(array: T[], id: string): T | undefined {
  return array.find((item) => item.id === id);
}

/**
 * 객체 배열에서 ID로 아이템 업데이트 (불변성 유지)
 */
export function updateById<T extends { id: string }>(
  array: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return array.map((item) =>
    item.id === id
      ? { ...item, ...updates, updatedAt: getCurrentTimestamp() } as T
      : item
  );
}

/**
 * 객체 배열에서 ID로 아이템 삭제
 */
export function deleteById<T extends { id: string }>(array: T[], id: string): T[] {
  return array.filter((item) => item.id !== id);
}

/**
 * 배열의 마지막 N개 아이템 가져오기
 */
export function getLastN<T>(array: T[], n: number): T[] {
  return array.slice(-n);
}

/**
 * 조건에 맞는 아이템들 필터링
 */
export function filterBy<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return array.filter(predicate);
}

/**
 * 배열이 비어있는지 확인
 */
export function isEmpty<T>(array: T[]): boolean {
  return array.length === 0;
}

/**
 * 배열에 아이템이 존재하는지 확인
 */
export function exists<T extends { id: string }>(array: T[], id: string): boolean {
  return array.some((item) => item.id === id);
}

/**
 * 중복 제거 (ID 기준)
 */
export function removeDuplicatesById<T extends { id: string }>(array: T[]): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * 안전한 배열 업데이트 (예외 처리 포함)
 */
export function safeArrayUpdate<T>(
  currentArray: T[],
  updateFn: (array: T[]) => T[]
): T[] {
  try {
    const newArray = updateFn([...currentArray]);
    return newArray;
  } catch (error) {
    console.error('Array update failed:', error);
    return currentArray; // 실패 시 원본 반환
  }
}

/**
 * 배열의 특정 인덱스 아이템 업데이트
 */
export function updateAtIndex<T>(array: T[], index: number, updates: Partial<T>): T[] {
  if (index < 0 || index >= array.length) {
    return array;
  }
  return array.map((item, i) => (i === index ? { ...item, ...updates } : item));
}

/**
 * 배열을 청크로 나누기 (배치 처리용)
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
