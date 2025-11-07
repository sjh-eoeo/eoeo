# Toast Notification System 사용 가이드

## 📋 개요

`react-hot-toast` 기반의 안정적이고 일관된 알림 시스템입니다.
기존 `alert()`, `confirm()` 대신 사용하여 더 나은 UX를 제공합니다.

## 🚀 기본 사용법

### Import

```typescript
import { 
  showSuccess, 
  showError, 
  showInfo, 
  showWarning,
  showLoading,
  showPromise,
  showConfirm,
  dismissToast,
  dismissAllToasts
} from '@/lib/utils/toast';
```

### 1. Success Toast

```typescript
// 크리에이터 추가 성공
showSuccess('크리에이터가 성공적으로 추가되었습니다!');

// CSV 업로드 성공
showSuccess(`${count}명의 크리에이터가 업로드되었습니다!`);
```

### 2. Error Toast

```typescript
// 에러 처리
try {
  await uploadFile(file);
} catch (error) {
  showError('파일 업로드 중 오류가 발생했습니다.');
}

// Firestore 에러
showError('Permission denied. 관리자에게 문의하세요.');
```

### 3. Info Toast

```typescript
// 정보 알림
showInfo('이메일 템플릿이 복사되었습니다.');
showInfo('자동 백업이 시작되었습니다.');
```

### 4. Warning Toast

```typescript
// 경고 메시지
showWarning('입력하지 않은 필드가 있습니다.');
showWarning('API 할당량이 부족합니다.');
```

### 5. Loading Toast

```typescript
// 로딩 표시 (수동 제어)
const toastId = showLoading('업로드 중...');

try {
  await uploadData();
  dismissToast(toastId);
  showSuccess('업로드 완료!');
} catch (error) {
  dismissToast(toastId);
  showError('업로드 실패');
}
```

### 6. Promise Toast (자동 로딩 처리)

```typescript
// Promise 기반 작업 (가장 권장)
await showPromise(
  uploadCreators(data),
  {
    loading: '크리에이터를 업로드하는 중...',
    success: '모든 크리에이터가 업로드되었습니다!',
    error: '업로드 중 오류가 발생했습니다.'
  }
);
```

### 7. Confirm Dialog

```typescript
// 삭제 확인
const confirmed = await showConfirm('정말 삭제하시겠습니까?');
if (confirmed) {
  deleteCreator(id);
  showSuccess('삭제되었습니다.');
}

// 프로젝트 완료 확인
const proceed = await showConfirm('프로젝트를 완료 처리하시겠습니까?');
if (proceed) {
  completeProject(projectId);
}
```

## 🔄 Migration Guide (alert → toast)

### Before (alert 사용)

```typescript
// ❌ 이전 방식
try {
  addCreator(creator);
  alert('크리에이터가 추가되었습니다!');
} catch (error) {
  alert('오류가 발생했습니다: ' + error.message);
}

if (confirm('삭제하시겠습니까?')) {
  deleteItem(id);
}
```

### After (toast 사용)

```typescript
// ✅ 새로운 방식
try {
  await addCreator(creator);
  showSuccess('크리에이터가 추가되었습니다!');
} catch (error) {
  showError(`오류가 발생했습니다: ${error.message}`);
}

if (await showConfirm('삭제하시겠습니까?')) {
  deleteItem(id);
  showSuccess('삭제되었습니다.');
}
```

## 📍 실제 적용 예시

### 크리에이터 추가 (CreatorsPage.tsx)

```typescript
const handleAddCreator = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!newCreator.userId || !newCreator.email) {
    showWarning('User ID와 Email은 필수입니다.');
    return;
  }

  try {
    const creator = createCreatorObject(newCreator);
    addCreator(creator);
    setIsAddModalOpen(false);
    showSuccess('크리에이터가 추가되었습니다!');
    resetForm();
  } catch (error) {
    showError('크리에이터 추가 중 오류가 발생했습니다.');
  }
};
```

### CSV 업로드 (CreatorsPage.tsx)

```typescript
const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  await showPromise(
    processCSV(file),
    {
      loading: 'CSV 파일을 처리하는 중...',
      success: (count) => `${count}명의 크리에이터가 추가되었습니다!`,
      error: 'CSV 파일 처리 중 오류가 발생했습니다.'
    }
  );
  
  setIsUploadModalOpen(false);
};
```

### 프로젝트 완료 (ProjectsPage.tsx)

```typescript
const handleCompleteProject = async (projectId: string) => {
  const confirmed = await showConfirm(
    '프로젝트를 완료 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
  );
  
  if (!confirmed) return;

  try {
    await updateProject(projectId, { status: 'completed' });
    showSuccess('프로젝트가 완료 처리되었습니다!');
  } catch (error) {
    showError('프로젝트 업데이트 중 오류가 발생했습니다.');
  }
};
```

### 결제 추가 (PaymentsPage.tsx)

```typescript
const handleAddPayment = async (paymentData: PaymentData) => {
  setIsSubmitting(true);
  
  try {
    await showPromise(
      addPayment(paymentData),
      {
        loading: '결제 정보를 저장하는 중...',
        success: '결제가 성공적으로 추가되었습니다!',
        error: '결제 추가 중 오류가 발생했습니다.'
      }
    );
    
    setSelectedProfile(null);
  } finally {
    setIsSubmitting(false);
  }
};
```

## 🎨 커스터마이징

### Duration 변경

```typescript
// 3초 표시
showSuccess('저장되었습니다!', 3000);

// 10초 표시 (긴 메시지)
showError('오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.', 10000);
```

### 여러 Toast 제어

```typescript
// 모든 toast 닫기
dismissAllToasts();

// 특정 toast 닫기
const id = showLoading('처리 중...');
// ... 작업 완료 후
dismissToast(id);
```

## ⚠️ 주의사항

1. **alert() 대신 showSuccess/showError 사용**
   - 더 나은 UX
   - 비동기 작업과 잘 작동
   - 스타일 일관성

2. **confirm() 대신 showConfirm 사용**
   - Promise 기반이므로 `await` 필요
   - 더 나은 모바일 UX

3. **Promise 작업은 showPromise 사용**
   - 로딩/성공/실패 상태 자동 처리
   - 코드 간결화

4. **Toast 남용 주의**
   - 중요한 작업만 알림
   - 너무 많은 toast는 UX 저해

## 📝 TODO

- [ ] Custom Confirm Modal 컴포넌트 구현 (window.confirm 대체)
- [ ] 페이지별 alert → toast 마이그레이션
- [ ] Toast 포지션 설정 (모바일 최적화)
- [ ] Undo 기능 추가 (삭제 작업 등)

## 🔗 참고

- [react-hot-toast 공식 문서](https://react-hot-toast.com/)
- 설정 위치: `src/components/layout/AppLayout.tsx`
- 유틸리티: `src/lib/utils/toast.ts`
