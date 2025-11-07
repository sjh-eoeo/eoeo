# Firebase Security Rules Setup Guide

## 🔒 문제: 다른 유저가 데이터를 볼 수 없는 이유

Firestore 보안 규칙에 시딩 시스템 컬렉션이 정의되어 있지 않아서, 인증된 사용자도 데이터에 접근할 수 없었습니다.

## ✅ 해결 방법

### 1. Firestore Rules (자동 배포 완료)

**위치**: `firestore.rules`

이미 다음 컬렉션들에 대한 규칙이 배포되었습니다:
- ✅ `users` - 모든 인증된 사용자 읽기 가능
- ✅ `seeding-brands` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `seeding-projects` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `seeding-creators` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `seeding-reach-outs` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `seeding-negotiations` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `seeding-drafts` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `seeding-payments` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `negotiation-projects` - 모든 인증된 사용자 읽기/쓰기 가능
- ✅ `project-metadata` - 모든 인증된 사용자 읽기/쓰기 가능

### 2. Storage Rules (수동 업데이트 필요)

Firebase Console에서 Storage 규칙을 업데이트해야 합니다:

#### 방법:
1. Firebase Console 접속: https://console.firebase.google.com/project/egongegong-eoeo
2. 좌측 메뉴에서 **Storage** 클릭
3. 상단 탭에서 **Rules** 클릭
4. 아래 규칙을 복사해서 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Contracts - authenticated users can read/write
    match /contracts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Invoices - authenticated users can read/write
    match /invoices/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Seeding drafts/files - authenticated users can read/write
    match /seeding/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Profile images - authenticated users can read/write
    match /profiles/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

5. **Publish** 버튼 클릭

## 🧪 테스트 방법

### 1. 다른 계정으로 로그인
1. 로그아웃
2. 다른 Google 계정으로 로그인
3. 시딩 시스템 페이지 접속

### 2. 데이터 확인
- **Brands 페이지**: 브랜드 목록이 보여야 함
- **Creators 페이지**: 크리에이터 목록이 보여야 함
- **Projects 페이지**: 프로젝트 목록이 보여야 함
- **Negotiation 페이지**: 협상 내역이 보여야 함

### 3. 권한 확인
- ✅ 읽기: 모든 인증된 사용자 가능
- ✅ 쓰기: 모든 인증된 사용자 가능
- ✅ 삭제: 관리자만 가능

## 🔐 보안 정책

### 현재 정책
- **인증 필수**: 모든 데이터 접근에 로그인 필요
- **활성 사용자**: Videos, Profiles, Payments는 status='active' 필요
- **시딩 시스템**: 모든 인증된 사용자가 접근 가능
- **관리자 전용**: 삭제 작업은 role='admin' 필요

### 권장 사항
1. **사용자 승인**: Admin 페이지에서 새 사용자를 'active' 상태로 변경
2. **역할 관리**: 필요시 'admin' 역할 부여
3. **정기 검토**: 비활성 사용자 제거

## 🚨 문제 해결

### 여전히 데이터가 안 보이는 경우

1. **브라우저 캐시 삭제**
   - Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   - 또는 시크릿 모드로 테스트

2. **사용자 상태 확인**
   - Firebase Console → Firestore Database
   - `users` 컬렉션에서 해당 사용자 확인
   - `status` 필드가 'active'인지 확인

3. **Firebase Console 확인**
   - Rules 탭에서 규칙이 정상 배포되었는지 확인
   - 규칙 시뮬레이터로 테스트

4. **네트워크 오류 확인**
   - 브라우저 개발자 도구 (F12)
   - Console 탭에서 에러 메시지 확인
   - Network 탭에서 요청 실패 확인

## 📞 추가 지원

문제가 계속되면:
1. Firebase Console에서 Firestore Rules 탭 확인
2. 규칙 시뮬레이터로 특정 쿼리 테스트
3. 브라우저 콘솔에서 에러 로그 확인

## 🔄 규칙 업데이트 방법

향후 규칙을 수정하려면:

```bash
# 1. firestore.rules 파일 수정
# 2. 규칙 배포
firebase deploy --only firestore:rules

# 또는 전체 배포
firebase deploy
```

## ✅ 체크리스트

배포 후 확인사항:
- [ ] Firestore Rules 배포 완료
- [ ] Storage Rules 수동 업데이트 완료
- [ ] 다른 계정으로 로그인 테스트
- [ ] 모든 페이지 데이터 로드 확인
- [ ] 생성/수정/삭제 권한 테스트
- [ ] 브라우저 콘솔 에러 없음

---

**배포 완료**: 2025년 11월 7일
**버전**: v2.0.2
**상태**: ✅ Firestore Rules 배포됨, ⏳ Storage Rules 수동 업데이트 필요
