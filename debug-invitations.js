/* 
 * 브라우저 콘솔에 복사해서 실행하세요
 * Admin 계정(sjh@egongegong.com)에서 실행
 */

console.clear();
console.log('='.repeat(60));
console.log('📊 초대 알림 디버깅 스크립트');
console.log('='.repeat(60));

// 1. 모든 초대 확인
const allInvitations = JSON.parse(localStorage.getItem('project-invitations') || '[]');
console.log('\n📬 총 초대 개수:', allInvitations.length);

// 2. 이메일별 그룹화
const byEmail = {};
allInvitations.forEach(inv => {
  if (!byEmail[inv.invitedEmail]) {
    byEmail[inv.invitedEmail] = [];
  }
  byEmail[inv.invitedEmail].push(inv.projectName);
});

console.log('\n👥 이메일별 초대 현황:');
Object.keys(byEmail).forEach(email => {
  console.log(`  ${email}: ${byEmail[email].length}개`);
  byEmail[email].forEach(project => {
    console.log(`    - ${project}`);
  });
});

// 3. junhoi90@gmail.com 초대 확인
const junhoiInvitations = allInvitations.filter(inv => 
  inv.invitedEmail.toLowerCase().includes('junhoi')
);
console.log('\n🔍 junhoi90@gmail.com 초대:');
if (junhoiInvitations.length === 0) {
  console.log('  ❌ junhoi90@gmail.com으로 보낸 초대가 없습니다!');
  console.log('  → Admin 페이지에서 프로젝트에 junhoi90@gmail.com을 참여자로 추가하세요');
} else {
  console.log(`  ✅ ${junhoiInvitations.length}개 초대 발견:`);
  junhoiInvitations.forEach(inv => {
    console.log(`    - ${inv.projectName} (${inv.invitedAt})`);
  });
}

// 4. 프로젝트 메타데이터 확인
const projects = JSON.parse(localStorage.getItem('negotiation-project-metadata') || '[]');
console.log('\n📋 프로젝트 목록:');
projects.forEach(project => {
  console.log(`  ${project.name}:`);
  console.log(`    참여자: ${project.participants.join(', ')}`);
  const hasJunhoi = project.participants.some(p => 
    p.toLowerCase().includes('junhoi')
  );
  if (hasJunhoi) {
    console.log('    ✅ junhoi90@gmail.com이 참여자에 포함됨');
  } else {
    console.log('    ⚠️ junhoi90@gmail.com이 참여자에 없음');
  }
});

// 5. 권장 액션
console.log('\n💡 권장 액션:');
if (junhoiInvitations.length === 0) {
  console.log('  1. Admin 페이지로 이동 (/negotiation/admin)');
  console.log('  2. 프로젝트 수정 버튼 클릭');
  console.log('  3. 참여자 검색에서 "junhoi90@gmail.com" 검색');
  console.log('  4. 선택 후 저장');
  console.log('  5. 콘솔에서 다음 로그 확인:');
  console.log('     🔔 Sending invitations to new participants: ["junhoi90@gmail.com"]');
  console.log('     📧 Creating invitations for normalized emails: ["junhoi90@gmail.com"]');
} else {
  console.log('  ✅ 초대가 정상적으로 발송되었습니다');
  console.log('  → junhoi90@gmail.com 계정으로 로그인해서 알림 확인하세요');
}

console.log('\n='.repeat(60));
