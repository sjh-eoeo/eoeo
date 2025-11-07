# 프로젝트 초대 알림 테스트 가이드

## 🔧 수정 사항
1. **NotificationDropdown 에러 수정**
   - `notifications is not defined` 에러 해결
   - React.useMemo로 안전한 알림 계산
   - try-catch로 에러 처리 추가
   - 드롭다운 열 때마다 자동 새로고침

2. **실시간 알림 업데이트**
   - NotificationsPage: 5초마다 자동 새로고침
   - NotificationDropdown: 드롭다운 열 때마다 새로고침
   - LocalStorage 실시간 감지

3. **디버그 로깅 추가**
   - 초대 발송 시 콘솔 로그
   - LocalStorage 상태 확인
   - 참여자 정보 출력

## 📋 테스트 순서

### 1단계: 프로젝트 생성 및 초대
```
1. Admin 계정으로 로그인
2. Negotiation 프로젝트로 전환
3. Admin 탭으로 이동 (/negotiation/admin)
4. "프로젝트 추가" 클릭
5. 프로젝트 정보 입력:
   - 이름: Test Project
   - 브랜드: Nike (또는 기존 브랜드)
   - 참여자: 유저 이메일 검색 후 선택
6. "추가" 클릭
7. 콘솔 확인:
   - 🔔 Sending invitations to: [emails]
   - ✅ Invitations created successfully!
   - 📬 Current invitations in storage: [JSON]
```

### 2단계: 알림 확인 (초대받은 계정)
```
1. 초대받은 유저 계정으로 로그인
2. Negotiation 프로젝트로 전환
3. 헤더의 🔔 벨 아이콘 확인
   - 빨간 숫자 뱃지 표시되어야 함
4. 벨 아이콘 클릭
   - 드롭다운에 📧 프로젝트 초대 알림 표시
5. "모두 보기" 클릭
   - /negotiation/notifications 페이지로 이동
6. 초대 알림 확인:
   - 제목: "프로젝트 초대"
   - 메시지: "[Admin Email]님이 "[프로젝트명]" 프로젝트에 초대했습니다"
   - 우선순위: 긴급 (빨간색 뱃지)
   - 파란 점 (읽지 않음 표시)
```

### 3단계: 알림 클릭 및 읽음 처리
```
1. 초대 알림 클릭
   - Admin 페이지로 자동 이동 (/negotiation/admin)
2. 알림 페이지로 다시 이동
   - 파란 점이 사라져야 함 (읽음 처리)
3. 헤더의 벨 아이콘 확인
   - 숫자 감소 또는 사라짐
```

### 4단계: 기존 프로젝트에 참여자 추가
```
1. Admin 계정으로 로그인
2. Admin 페이지에서 기존 프로젝트 "수정" 클릭
3. 참여자 추가 (새로운 유저 선택)
4. "수정" 클릭
5. 콘솔 확인:
   - 🔔 Sending invitations to new participants: [새 유저들만]
6. 새로 추가된 유저 계정으로 로그인
7. 초대 알림 확인 (2단계 반복)
```

## 🐛 디버깅 체크리스트

### 알림이 보이지 않을 때:
1. **브라우저 콘솔 확인**
   ```
   - 🔔 Sending invitations to: 로그가 보이는가?
   - ✅ Invitations created successfully! 로그가 보이는가?
   - 📬 Current invitations in storage: 데이터가 있는가?
   ```

2. **LocalStorage 직접 확인**
   ```javascript
   // 브라우저 콘솔에서 실행
   const invitations = localStorage.getItem('project-invitations');
   console.log('Invitations:', JSON.parse(invitations));
   ```

3. **로그인 유저 확인**
   ```javascript
   // 현재 로그인한 유저 이메일 확인
   const user = JSON.parse(localStorage.getItem('auth-storage'));
   console.log('Current user:', user?.state?.appUser?.email);
   ```

4. **초대된 이메일과 로그인 이메일 일치 확인**
   - 초대 시 선택한 이메일과 로그인한 이메일이 정확히 일치해야 함
   - 대소문자, 공백 주의

5. **필터 확인**
   - 알림 페이지에서 "전체" 탭 선택
   - "초대" 탭에서 초대 알림만 보기

## 📊 예상 결과

### 성공 시 콘솔 로그:
```
🔔 Sending invitations to: ["user1@example.com", "user2@example.com"]
Project details: {
  id: "meta-1762434567890",
  name: "Test Project",
  brand: "Nike",
  invitedBy: "admin@example.com"
}
✅ Invitations created successfully!
📬 Current invitations in storage: [{"notificationId":"inv-...","projectId":"meta-...","projectName":"Test Project",...}]
```

### LocalStorage 데이터 구조:
```json
// project-invitations
[
  {
    "notificationId": "inv-1762434567890-abc123",
    "projectId": "meta-1762434567890",
    "projectName": "Test Project",
    "brand": "Nike",
    "invitedBy": "admin@example.com",
    "invitedAt": "2025-11-06T12:00:00.000Z",
    "invitedEmail": "user1@example.com",
    "isRead": false
  }
]
```

## 🔄 실시간 업데이트

### NotificationDropdown:
- 벨 아이콘 클릭할 때마다 새로고침
- 드롭다운 닫았다 열면 최신 알림 반영

### NotificationsPage:
- 5초마다 자동 새로고침
- 페이지 열어두면 자동으로 새 알림 감지

## ⚠️ 주의사항

1. **이메일 정확성**
   - Firestore의 users 컬렉션에 등록된 이메일과 정확히 일치해야 함
   - 초대 시 드롭다운에서 선택한 이메일 확인

2. **프로젝트 선택**
   - 헤더에서 "Negotiation" 프로젝트 선택되어 있어야 함
   - 10K 프로젝트에서는 알림 기능 비활성화

3. **Admin 권한**
   - 프로젝트 생성/수정은 Admin만 가능
   - 일반 유저는 초대 알림만 받음

4. **브라우저 캐시**
   - 안 보이면 페이지 새로고침 (Cmd+R 또는 Ctrl+R)
   - 또는 Hard Refresh (Cmd+Shift+R 또는 Ctrl+Shift+R)

## 🎯 테스트 시나리오 요약

✅ **시나리오 1**: 새 프로젝트 생성 + 참여자 초대
✅ **시나리오 2**: 기존 프로젝트에 참여자 추가
✅ **시나리오 3**: 초대 알림 읽음 처리
✅ **시나리오 4**: 여러 유저에게 동시 초대
✅ **시나리오 5**: 실시간 알림 업데이트 확인

## 📞 문제 발생 시

문제가 계속되면 다음 정보를 함께 알려주세요:
1. 브라우저 콘솔 로그 전체
2. LocalStorage의 'project-invitations' 내용
3. 현재 로그인한 유저 이메일
4. 초대 시 선택한 유저 이메일
5. 어느 단계에서 문제 발생했는지
