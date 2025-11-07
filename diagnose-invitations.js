// 브라우저 콘솔에 복사해서 붙여넣기
// 알림이 안 오는 원인을 자동으로 진단합니다

console.clear();
console.log('%c🔍 프로젝트 초대 알림 진단 시작...', 'color: #00ffff; font-size: 16px; font-weight: bold;');
console.log('');

// 1. 로그인 확인
console.log('%c1️⃣ 로그인 상태 확인', 'color: #ffff00; font-weight: bold;');
const authStorage = localStorage.getItem('auth-storage');
if (!authStorage) {
    console.log('%c❌ 로그인되지 않음!', 'color: #ff0000; font-weight: bold;');
    console.log('해결: 로그인하세요');
} else {
    const auth = JSON.parse(authStorage);
    const user = auth?.state?.appUser;
    if (!user) {
        console.log('%c❌ 사용자 정보 없음!', 'color: #ff0000; font-weight: bold;');
    } else {
        console.log('%c✅ 로그인됨', 'color: #00ff00;');
        console.log('📧 이메일 (원본):', user.email);
        console.log('📧 이메일 (정규화):', user.email?.trim().toLowerCase());
        console.log('👤 이름:', user.name);
        console.log('🔑 역할:', user.role);
        
        window.currentUserEmail = user.email?.trim().toLowerCase();
    }
}
console.log('');

// 2. 초대 데이터 확인
console.log('%c2️⃣ 초대 데이터 확인', 'color: #ffff00; font-weight: bold;');
const invitationsStr = localStorage.getItem('project-invitations');
if (!invitationsStr) {
    console.log('%c❌ 초대 데이터가 없습니다!', 'color: #ff0000; font-weight: bold;');
    console.log('해결: Admin 계정에서 프로젝트에 참여자를 추가하세요');
} else {
    try {
        const invitations = JSON.parse(invitationsStr);
        console.log(`%c✅ 총 ${invitations.length}개의 초대 발견`, 'color: #00ff00;');
        
        console.log('\n📋 초대 목록:');
        console.table(invitations.map((inv, idx) => ({
            번호: idx + 1,
            초대된이메일: inv.invitedEmail,
            정규화: inv.invitedEmail.trim().toLowerCase(),
            프로젝트: inv.projectName,
            브랜드: inv.brand,
            초대자: inv.invitedBy,
            읽음: inv.isRead ? '✅' : '❌'
        })));
        
        window.allInvitations = invitations;
    } catch (error) {
        console.log('%c❌ 초대 데이터 파싱 실패!', 'color: #ff0000; font-weight: bold;');
        console.error(error);
    }
}
console.log('');

// 3. 매칭 테스트
console.log('%c3️⃣ 이메일 매칭 테스트', 'color: #ffff00; font-weight: bold;');
if (window.currentUserEmail && window.allInvitations) {
    console.log(`🔍 현재 사용자: ${window.currentUserEmail}`);
    console.log('');
    
    let matchCount = 0;
    const matchedInvitations = [];
    
    window.allInvitations.forEach((inv, idx) => {
        const invEmail = inv.invitedEmail.trim().toLowerCase();
        const match = invEmail === window.currentUserEmail;
        
        if (match) {
            matchCount++;
            matchedInvitations.push(inv);
            console.log(`%c✅ 매칭 #${matchCount}`, 'color: #00ff00; font-weight: bold;');
        } else {
            console.log(`%c❌ 불일치`, 'color: #ff6666;');
        }
        
        console.log(`   저장된 이메일: "${inv.invitedEmail}"`);
        console.log(`   정규화: "${invEmail}"`);
        console.log(`   프로젝트: ${inv.projectName}`);
        console.log('');
    });
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
    if (matchCount > 0) {
        console.log(`%c🎉 ${matchCount}개의 매칭된 초대 발견!`, 'color: #00ff00; font-size: 14px; font-weight: bold;');
        console.log('\n📬 내 초대 목록:');
        console.table(matchedInvitations.map(inv => ({
            프로젝트: inv.projectName,
            브랜드: inv.brand,
            초대자: inv.invitedBy,
            날짜: new Date(inv.invitedAt).toLocaleString('ko-KR'),
            읽음: inv.isRead ? '✅' : '❌'
        })));
        console.log('\n%c💡 알림이 표시되어야 합니다!', 'color: #00ffff;');
        console.log('   만약 안 보인다면:');
        console.log('   1. 페이지 새로고침 (Cmd+R 또는 Ctrl+R)');
        console.log('   2. Negotiation 프로젝트가 선택되어 있는지 확인');
        console.log('   3. 헤더 오른쪽의 🔔 아이콘 확인');
    } else {
        console.log(`%c❌ 매칭된 초대 없음!`, 'color: #ff0000; font-size: 14px; font-weight: bold;');
        console.log('\n%c🔍 문제 진단:', 'color: #ffff00; font-weight: bold;');
        
        // 이메일 비교 분석
        console.log('\n📧 이메일 비교:');
        console.log(`   현재 로그인: "${window.currentUserEmail}"`);
        console.log('   초대된 이메일들:');
        window.allInvitations.forEach((inv, idx) => {
            const invEmail = inv.invitedEmail.trim().toLowerCase();
            console.log(`   ${idx + 1}. "${invEmail}"`);
        });
        
        // 유사한 이메일 찾기
        const similar = window.allInvitations.filter(inv => {
            const invEmail = inv.invitedEmail.trim().toLowerCase();
            return invEmail.includes(window.currentUserEmail.split('@')[0]) || 
                   window.currentUserEmail.includes(invEmail.split('@')[0]);
        });
        
        if (similar.length > 0) {
            console.log('\n%c⚠️  유사한 이메일 발견!', 'color: #ff9900; font-weight: bold;');
            console.table(similar.map(inv => ({
                초대된이메일: inv.invitedEmail,
                프로젝트: inv.projectName
            })));
            console.log('   → 초대된 이메일과 로그인 이메일이 다를 수 있습니다!');
        }
        
        console.log('\n%c💡 해결 방법:', 'color: #00ffff; font-weight: bold;');
        console.log('   1. Admin 계정으로 로그인');
        console.log('   2. Negotiation → Admin 탭');
        console.log('   3. 프로젝트 수정');
        console.log(`   4. 참여자로 "${window.currentUserEmail}" 추가`);
        console.log('   5. 저장 후 이 계정에서 확인');
    }
} else {
    console.log('%c⚠️  매칭 테스트를 할 수 없습니다', 'color: #ff9900;');
    console.log('   로그인 또는 초대 데이터가 없습니다');
}
console.log('');

// 4. 프로젝트 메타데이터 확인
console.log('%c4️⃣ 프로젝트 메타데이터 확인', 'color: #ffff00; font-weight: bold;');
const metadataStr = localStorage.getItem('negotiation-project-metadata');
if (!metadataStr) {
    console.log('%c⚠️  프로젝트 메타데이터 없음', 'color: #ff9900;');
    console.log('   Admin 페이지에서 프로젝트를 생성하세요');
} else {
    try {
        const projects = JSON.parse(metadataStr);
        console.log(`%c✅ ${projects.length}개의 프로젝트`, 'color: #00ff00;');
        
        console.log('\n📊 프로젝트 참여자:');
        projects.forEach((project, idx) => {
            console.log(`\n${idx + 1}. ${project.name} (${project.brand})`);
            if (project.participants && project.participants.length > 0) {
                console.log('   참여자:');
                project.participants.forEach(p => {
                    const isMe = p.trim().toLowerCase() === window.currentUserEmail;
                    console.log(`   ${isMe ? '✅' : '  '} ${p}${isMe ? ' ← 나' : ''}`);
                });
            } else {
                console.log('   ⚠️  참여자 없음');
            }
        });
        
        // 내가 참여한 프로젝트 찾기
        if (window.currentUserEmail) {
            const myProjects = projects.filter(p => 
                p.participants && p.participants.some(email => 
                    email.trim().toLowerCase() === window.currentUserEmail
                )
            );
            
            if (myProjects.length > 0) {
                console.log(`\n%c🎯 내가 참여한 프로젝트: ${myProjects.length}개`, 'color: #00ff00; font-weight: bold;');
                console.table(myProjects.map(p => ({
                    프로젝트명: p.name,
                    브랜드: p.brand,
                    참여자수: p.participants.length
                })));
            } else {
                console.log('\n%c❌ 참여한 프로젝트 없음', 'color: #ff0000; font-weight: bold;');
                console.log('   Admin에게 프로젝트 참여자로 추가 요청하세요');
            }
        }
    } catch (error) {
        console.log('%c❌ 프로젝트 데이터 파싱 실패!', 'color: #ff0000; font-weight: bold;');
        console.error(error);
    }
}
console.log('');

// 5. 최종 진단 요약
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
console.log('%c📋 최종 진단 요약', 'color: #00ffff; font-size: 16px; font-weight: bold;');
console.log('');

let issues = [];
let solutions = [];

if (!authStorage) {
    issues.push('로그인되지 않음');
    solutions.push('로그인하세요');
}

if (!invitationsStr) {
    issues.push('초대 데이터 없음');
    solutions.push('Admin이 프로젝트에 참여자를 추가해야 합니다');
}

if (window.currentUserEmail && window.allInvitations) {
    const myInvitations = window.allInvitations.filter(inv => 
        inv.invitedEmail.trim().toLowerCase() === window.currentUserEmail
    );
    
    if (myInvitations.length === 0) {
        issues.push('내 이메일로 된 초대가 없음');
        solutions.push(`Admin이 "${window.currentUserEmail}"를 프로젝트에 추가해야 합니다`);
    }
}

if (issues.length === 0) {
    console.log('%c✅ 문제 없음! 알림이 표시되어야 합니다.', 'color: #00ff00; font-size: 14px; font-weight: bold;');
    console.log('\n만약 알림이 안 보인다면:');
    console.log('1. 페이지 새로고침 (Cmd+R)');
    console.log('2. Negotiation 프로젝트 선택 확인');
    console.log('3. 브라우저 캐시 삭제 후 재로그인');
} else {
    console.log(`%c❌ ${issues.length}개의 문제 발견`, 'color: #ff0000; font-weight: bold;');
    console.log('\n문제:');
    issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`);
    });
    console.log('\n해결 방법:');
    solutions.forEach((solution, idx) => {
        console.log(`  ${idx + 1}. ${solution}`);
    });
}

console.log('');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
console.log('');
console.log('%c💡 테스트 초대 생성하기:', 'color: #00ffff; font-weight: bold;');
console.log('   다음 명령어로 테스트 초대를 생성할 수 있습니다:');
console.log('');
console.log('%c   createTestInvitation("junhoi90@gmail.com")', 'color: #00ff00; background: #000; padding: 5px;');
console.log('');

// 테스트 초대 생성 함수
window.createTestInvitation = function(email) {
    if (!email) {
        console.log('%c❌ 이메일을 입력하세요', 'color: #ff0000; font-weight: bold;');
        console.log('   예: createTestInvitation("junhoi90@gmail.com")');
        return;
    }
    
    const invitation = {
        notificationId: `test-inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: 'test-project-' + Date.now(),
        projectName: 'Test Project',
        brand: 'Test Brand',
        invitedBy: window.currentUserEmail || 'Test Admin',
        invitedAt: new Date().toISOString(),
        invitedEmail: email.trim().toLowerCase(),
        isRead: false
    };
    
    const existing = localStorage.getItem('project-invitations');
    const invitations = existing ? JSON.parse(existing) : [];
    invitations.push(invitation);
    localStorage.setItem('project-invitations', JSON.stringify(invitations));
    
    console.log('%c✅ 테스트 초대 생성됨!', 'color: #00ff00; font-size: 14px; font-weight: bold;');
    console.log('\n초대 정보:');
    console.table({
        초대이메일: invitation.invitedEmail,
        프로젝트: invitation.projectName,
        브랜드: invitation.brand,
        초대자: invitation.invitedBy
    });
    console.log('\n%c💡 이제 페이지를 새로고침하고 알림을 확인하세요!', 'color: #00ffff;');
};

console.log('%c✅ 진단 완료!', 'color: #00ff00; font-size: 16px; font-weight: bold;');
