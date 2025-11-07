# 🐛 초대 알림 디버깅 가이드

## 문제: 특정 계정에만 알림이 오고 다른 계정에는 안 오는 경우

### 수정 사항:
1. ✅ **이메일 정규화** - 모든 이메일을 소문자로 변환하고 공백 제거
2. ✅ **상세 로그 추가** - 각 단계별로 콘솔 로그 출력
3. ✅ **이메일 비교 로그** - 저장된 이메일과 현재 유저 이메일 비교 과정 출력

---

## 📊 디버깅 순서

### 1단계: 초대 발송 시 확인
Admin 계정에서 프로젝트에 참여자 추가 후 콘솔 확인:

```
🔔 Sending invitations to: ["junhoi90@gmail.com"]
Project details: { id: "meta-...", name: "...", ... }

📧 Creating invitations for normalized emails: ["junhoi90@gmail.com"]
💾 Saved invitations: [
  { email: "sjh@egongegong.com", project: "...", isRead: false },
  { email: "junhoi90@gmail.com", project: "...", isRead: false }
]
✅ Invitations created successfully!
```

**체크포인트:**
- ✅ `normalized emails`에 정확한 이메일이 있는가?
- ✅ `Saved invitations`에 새 이메일이 추가되었는가?

---

### 2단계: 로그인 후 알림 확인
junhoi90@gmail.com 계정으로 로그인 후 Negotiation 프로젝트 선택:

```
👤 NotificationDropdown - Current user: junhoi90@gmail.com

🔔 getAllNotifications called for: junhoi90@gmail.com
📬 All invitations in storage: 2
🔍 Filtering invitations for: junhoi90@gmail.com

  ❌ "sjh@egongegong.com" !== "junhoi90@gmail.com"
  ✅ Found invitation: Test Project

📊 Found 1 invitations for junhoi90@gmail.com
📧 Creating 1 invitation notifications
```

**체크포인트:**
- ✅ `Current user`가 올바른 이메일인가?
- ✅ `All invitations in storage`에 총 개수가 맞는가?
- ✅ `Found X invitations`에서 X가 0보다 큰가?

---

### 3단계: 문제 진단

#### Case A: 초대가 저장되지 않음
```
📧 Creating invitations for normalized emails: []
```
**원인:** 참여자 선택이 안 됨
**해결:** Admin 페이지에서 참여자를 다시 선택

#### Case B: 이메일이 다름
```
  ❌ "junhoi90@gmail.com" !== "junhoi@gmail.com"
```
**원인:** 초대한 이메일과 로그인 이메일이 다름
**해결:** 
1. Firestore에 등록된 정확한 이메일 확인
2. 초대 시 올바른 유저 선택

#### Case C: 알림이 저장소에 없음
```
📭 No invitations in storage
```
**원인:** LocalStorage가 비어있음
**해결:**
1. 브라우저 콘솔에서 확인:
   ```javascript
   localStorage.getItem('project-invitations')
   ```
2. 없으면 초대를 다시 발송

#### Case D: 필터링에서 걸림
```
📬 All invitations in storage: 5
🔍 Filtering invitations for: junhoi90@gmail.com
  ❌ "sjh@egongegong.com" !== "junhoi90@gmail.com"
  ❌ "test@test.com" !== "junhoi90@gmail.com"
📊 Found 0 invitations for junhoi90@gmail.com
```
**원인:** 저장된 이메일에 해당 유저가 없음
**해결:** Admin 페이지에서 다시 초대

---

## 🔍 수동 확인 방법

### 1. LocalStorage 직접 확인
```javascript
// 브라우저 콘솔에서 실행
const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
console.table(invitations);
```

**예상 결과:**
| notificationId | projectName | invitedEmail | invitedBy | isRead |
|---|---|---|---|---|
| inv-... | Test Project | sjh@egongegong.com | admin@... | false |
| inv-... | Test Project | junhoi90@gmail.com | admin@... | false |

### 2. 현재 로그인 유저 확인
```javascript
// 브라우저 콘솔에서 실행
const auth = JSON.parse(localStorage.getItem('auth-storage'));
console.log('Current user email:', auth?.state?.appUser?.email);
```

### 3. 이메일 매칭 테스트
```javascript
// 브라우저 콘솔에서 실행
const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
const auth = JSON.parse(localStorage.getItem('auth-storage'));
const currentEmail = auth?.state?.appUser?.email?.trim().toLowerCase();

console.log('Current email (normalized):', currentEmail);
console.log('\nMatching invitations:');
invitations.forEach(inv => {
  const invEmail = inv.invitedEmail.trim().toLowerCase();
  const match = invEmail === currentEmail;
  console.log(`  ${match ? '✅' : '❌'} ${invEmail}`);
});
```

---

## 🎯 해결 체크리스트

### sjh@egongegong.com에는 알림이 오는데 junhoi90@gmail.com에는 안 오는 경우:

1. [ ] **Admin 페이지에서 초대 확인**
   - Admin 페이지로 이동
   - 프로젝트 목록에서 참여자 확인
   - junhoi90@gmail.com이 포함되어 있는가?

2. [ ] **Firestore 유저 목록 확인**
   - Admin 페이지에서 "프로젝트 추가" 클릭
   - 참여자 검색 드롭다운에서 junhoi90@gmail.com 검색
   - 나타나는가? → 나타나면 선택 가능

3. [ ] **이메일 정확성 확인**
   ```javascript
   // Firestore에 등록된 이메일 확인
   const auth = JSON.parse(localStorage.getItem('auth-storage'));
   console.log('My exact email:', auth?.state?.appUser?.email);
   ```

4. [ ] **초대 다시 발송**
   - Admin 계정으로 로그인
   - 프로젝트 수정
   - junhoi90@gmail.com 참여자로 추가
   - 콘솔에서 `📧 Creating invitations for normalized emails` 확인

5. [ ] **브라우저 새로고침**
   - junhoi90@gmail.com 계정에서 페이지 새로고침 (Cmd+R)
   - 또는 Hard Refresh (Cmd+Shift+R)

6. [ ] **캐시 클리어**
   - 개발자 도구 → Application → Storage → Clear site data
   - 다시 로그인

---

## 💡 예상되는 문제들

### 문제 1: 이메일 대소문자
```
저장: "Junhoi90@Gmail.com"
로그인: "junhoi90@gmail.com"
결과: ❌ 매칭 안 됨
```
**수정:** 이제 모든 이메일을 소문자로 정규화하므로 해결됨

### 문제 2: 공백
```
저장: "junhoi90@gmail.com "  (끝에 공백)
로그인: "junhoi90@gmail.com"
결과: ❌ 매칭 안 됨
```
**수정:** 이제 trim()으로 공백 제거하므로 해결됨

### 문제 3: 중복 초대
```
같은 유저를 여러 번 초대하면 알림이 여러 개 생김
```
**정상:** 각 프로젝트마다 초대 알림이 따로 생성됨
**확인:** 알림 페이지에서 프로젝트명으로 구분 가능

### 문제 4: 읽음 처리 안 됨
```
알림을 클릭했는데 계속 표시됨
```
**원인:** markInvitationAsRead가 호출되지 않음
**확인:** NotificationsPage.tsx의 handleNotificationClick 확인

---

## 🔄 테스트 시나리오

### 시나리오 1: 깨끗한 상태에서 시작
```javascript
// 1. LocalStorage 초기화
localStorage.removeItem('project-invitations');
localStorage.removeItem('negotiation-project-metadata');

// 2. Admin 계정으로 프로젝트 생성
// 3. 두 유저 모두 초대
// 4. 각 계정으로 로그인 후 알림 확인
```

### 시나리오 2: 기존 데이터 확인
```javascript
// 1. 현재 초대 목록 확인
const invitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
console.log('All invitations:');
invitations.forEach(inv => {
  console.log(`- ${inv.invitedEmail} → ${inv.projectName}`);
});

// 2. 특정 유저의 초대만 보기
const targetEmail = 'junhoi90@gmail.com';
const filtered = invitations.filter(inv => 
  inv.invitedEmail.toLowerCase() === targetEmail.toLowerCase()
);
console.log(`Invitations for ${targetEmail}:`, filtered);
```

---

## 📞 아직도 안 되면?

다음 정보를 함께 제공해주세요:

1. **브라우저 콘솔 전체 로그**
2. **LocalStorage 데이터:**
   ```javascript
   console.log('Invitations:', localStorage.getItem('project-invitations'));
   console.log('Auth:', localStorage.getItem('auth-storage'));
   console.log('Projects:', localStorage.getItem('negotiation-project-metadata'));
   ```
3. **Firestore에서 유저 이메일 확인**
4. **어느 단계에서 막히는지**

---

## ✅ 최종 확인

포트 3000에서 테스트 후:

```
1. Admin 계정 (sjh@egongegong.com):
   - 프로젝트 생성
   - junhoi90@gmail.com 초대
   - 콘솔에서 "📧 Creating invitations" 확인

2. junhoi90@gmail.com 계정:
   - 로그인
   - Negotiation 선택
   - 콘솔에서 "👤 Current user: junhoi90@gmail.com" 확인
   - 콘솔에서 "📊 Found X invitations" 확인 (X > 0)
   - 🔔 벨 아이콘에 숫자 표시
   - 클릭 시 초대 알림 보임
```

모든 로그가 정상이면 알림이 표시됩니다! 🎉
