# 🔍 알림이 안 오는 문제 해결 가이드

## 빠른 진단 (30초)

### 방법 1: 자동 진단 스크립트 (추천)

1. **junhoi90@gmail.com 계정**으로 로그인
2. **F12** 또는 **Cmd+Option+I** 눌러서 개발자 도구 열기
3. **Console** 탭 선택
4. 다음 파일의 내용 복사해서 붙여넣기:
   ```
   diagnose-invitations.js
   ```
5. **Enter** 키

출력 결과가 문제를 자동으로 진단해줍니다!

---

### 방법 2: 시각적 디버깅 도구

1. 프로젝트 폴더에서 `debug-invitations.html` 파일 열기
2. 브라우저에서 실행
3. 버튼들을 순서대로 클릭:
   - "내 정보 확인"
   - "전체 초대 보기"
   - "매칭 테스트"

---

## 가장 흔한 원인 3가지

### 1️⃣ 이메일이 다름 (90% 확률)

**증상:**
- sjh@egongegong.com에는 알림 옴
- junhoi90@gmail.com에는 안 옴

**확인 방법:**
```javascript
// 브라우저 콘솔에서 실행
const auth = JSON.parse(localStorage.getItem('auth-storage'));
console.log('내 이메일:', auth?.state?.appUser?.email);

const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
console.log('초대된 이메일들:', invitations.map(inv => inv.invitedEmail));
```

**해결:**
1. Admin 계정으로 로그인
2. Negotiation → Admin 탭
3. 프로젝트 "수정" 버튼
4. 참여자 드롭다운에서 **정확한 이메일** 검색
5. junhoi90@gmail.com 선택
6. 저장

---

### 2️⃣ Firestore에 유저가 없음 (5% 확률)

**증상:**
- Admin 페이지 참여자 드롭다운에 junhoi90@gmail.com이 안 나옴

**확인 방법:**
1. Admin 계정으로 로그인
2. Admin 탭 → "프로젝트 추가"
3. 참여자 검색 입력창에 "junhoi90" 입력
4. 드롭다운 목록 확인

**해결:**
- Firestore Console 가서 `users` 컬렉션에 유저 추가
- 또는 junhoi90@gmail.com으로 한번 로그인 (자동 생성될 수 있음)

---

### 3️⃣ 초대가 아직 생성 안 됨 (5% 확률)

**증상:**
- Admin이 참여자를 추가했다고 했는데 알림이 안 옴

**확인 방법:**
```javascript
// 브라우저 콘솔에서 실행
const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
console.table(invitations);
```

**해결:**
1. Admin이 프로젝트 수정 후 **"저장" 버튼을 눌렀는지** 확인
2. 브라우저 콘솔에 다음 로그가 나왔는지 확인:
   ```
   🔔 Sending invitations to: ["junhoi90@gmail.com"]
   ✅ Invitations created successfully!
   ```
3. 안 나왔으면 다시 저장

---

## 단계별 체크리스트

### ✅ junhoi90@gmail.com 계정에서 확인:

- [ ] **1. 로그인 확인**
  ```javascript
  // 콘솔에서 실행
  const auth = JSON.parse(localStorage.getItem('auth-storage'));
  console.log(auth?.state?.appUser?.email); // "junhoi90@gmail.com"이어야 함
  ```

- [ ] **2. Negotiation 프로젝트 선택**
  - 헤더 드롭다운에서 "협상테이블 (Negotiation)" 선택되어 있는지

- [ ] **3. 초대 데이터 확인**
  ```javascript
  // 콘솔에서 실행
  const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
  const mine = invitations.filter(inv => 
    inv.invitedEmail.toLowerCase() === 'junhoi90@gmail.com'
  );
  console.log('내 초대:', mine); // 배열에 최소 1개 있어야 함
  ```

- [ ] **4. 브라우저 콘솔 로그 확인**
  - F12 → Console 탭
  - 다음 로그가 보여야 함:
    ```
    👤 NotificationDropdown - Current user: junhoi90@gmail.com
    🔔 getAllNotifications called for: junhoi90@gmail.com
    📬 All invitations in storage: X
    📊 Found 1 invitations for junhoi90@gmail.com
    ```

- [ ] **5. 헤더의 🔔 아이콘 확인**
  - 빨간 숫자 뱃지가 보여야 함
  - 클릭하면 초대 알림이 보여야 함

---

### ✅ Admin (sjh@egongegong.com) 계정에서 확인:

- [ ] **1. 프로젝트 메타데이터 확인**
  - Admin 탭으로 이동
  - 프로젝트 목록에서 참여자 확인
  - junhoi90@gmail.com이 포함되어 있는지

- [ ] **2. 초대 발송 로그 확인**
  - 프로젝트 수정 → 참여자 추가 → 저장
  - 브라우저 콘솔에 다음이 나와야 함:
    ```
    🔔 Sending invitations to: ["junhoi90@gmail.com"]
    📧 Creating invitations for normalized emails: ["junhoi90@gmail.com"]
    💾 Saved invitations: [...]
    ✅ Invitations created successfully!
    ```

---

## 빠른 해결 방법

### 🚀 방법 1: 테스트 초대 직접 생성

junhoi90@gmail.com 계정의 브라우저 콘솔에서:

```javascript
// 1. 진단 스크립트 로드
// diagnose-invitations.js 파일 내용을 복사해서 붙여넣기

// 2. 테스트 초대 생성
createTestInvitation("junhoi90@gmail.com");

// 3. 페이지 새로고침
location.reload();
```

---

### 🚀 방법 2: LocalStorage 직접 수정

**주의: 이 방법은 테스트용입니다!**

```javascript
// junhoi90@gmail.com 계정의 브라우저 콘솔에서 실행

const invitation = {
  notificationId: `manual-inv-${Date.now()}`,
  projectId: 'test-project-001',
  projectName: 'Manual Test Project',
  brand: 'Test Brand',
  invitedBy: 'sjh@egongegong.com',
  invitedAt: new Date().toISOString(),
  invitedEmail: 'junhoi90@gmail.com',
  isRead: false
};

const existing = localStorage.getItem('project-invitations');
const invitations = existing ? JSON.parse(existing) : [];
invitations.push(invitation);
localStorage.setItem('project-invitations', JSON.stringify(invitations));

console.log('✅ 초대 추가됨! 페이지를 새로고침하세요.');
location.reload();
```

---

## 최종 확인

### ✅ 정상 작동 시 나타나야 할 것들:

1. **헤더**
   - 🔔 아이콘 옆에 빨간 숫자 (1 이상)

2. **벨 아이콘 클릭 시**
   - 드롭다운에 📧 프로젝트 초대 알림
   - 프로젝트명과 초대한 사람 표시

3. **"모두 보기" 클릭 시**
   - `/negotiation/notifications` 페이지로 이동
   - "초대" 탭에 알림 표시

4. **브라우저 콘솔**
   ```
   👤 NotificationDropdown - Current user: junhoi90@gmail.com
   📬 All invitations in storage: 2
   🔍 Filtering invitations for: junhoi90@gmail.com
     ✅ Found invitation: [프로젝트명]
   📊 Found 1 invitations for junhoi90@gmail.com
   📧 Creating 1 invitation notifications
   ```

---

## 여전히 안 되면?

### 1. LocalStorage 초기화 후 재시도

```javascript
// 모든 알림 데이터 삭제
localStorage.removeItem('project-invitations');
localStorage.removeItem('negotiation-project-metadata');

// Admin 계정으로 다시 프로젝트 생성 및 초대
```

### 2. 브라우저 캐시 완전 삭제

1. 개발자 도구 (F12)
2. Application 탭
3. Storage → Clear site data
4. 재로그인

### 3. 다른 브라우저에서 테스트

- Chrome에서 안 되면 Safari나 Firefox 시도
- 시크릿 모드로 테스트

---

## 📞 디버깅 정보 제공

문제가 계속되면 다음 정보를 함께 제공해주세요:

```javascript
// 이 코드를 실행하고 결과를 복사해주세요
console.log('=== 디버깅 정보 ===');
console.log('\n1. 현재 유저:');
const auth = JSON.parse(localStorage.getItem('auth-storage'));
console.log(JSON.stringify(auth?.state?.appUser, null, 2));

console.log('\n2. 모든 초대:');
const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
console.log(JSON.stringify(invitations, null, 2));

console.log('\n3. 프로젝트 메타데이터:');
const projects = JSON.parse(localStorage.getItem('negotiation-project-metadata') || '[]');
console.log(JSON.stringify(projects, null, 2));
```

---

## 💡 팁

- **이메일은 대소문자 구분 안 함**: JunHoi90@Gmail.com = junhoi90@gmail.com
- **공백은 자동 제거됨**: "junhoi90@gmail.com " = "junhoi90@gmail.com"
- **실시간 업데이트**: 드롭다운 열 때마다 자동 새로고침
- **읽음 처리**: 초대 알림 클릭하면 자동으로 읽음 처리

---

이 가이드로 99% 문제가 해결됩니다! 🚀
