/**
 * eoeo workspace Version Info
 * 
 * 배포할 때마다 버전을 업데이트하세요.
 * Semantic Versioning: MAJOR.MINOR.PATCH
 * 
 * - MAJOR: 큰 변경사항, 호환성 깨지는 변경
 * - MINOR: 새로운 기능 추가
 * - PATCH: 버그 수정
 */

export const VERSION = '2.0.9';
export const BUILD_DATE = '2025-01-10';
export const RELEASE_NOTES = {
  '2.0.9': [
    '📎 Add Payment 모달 - 여러 인보이스 파일 업로드 지원',
    '✨ 한 번에 여러 파일 선택 및 업로드 가능',
    '🗑️ 개별 파일 제거 기능 추가',
    '💾 Firebase Storage에 모든 파일 저장',
  ],
  '2.0.8': [
    '🔧 Payments Due 브랜드 필터링 강화',
    '✅ 결제 내역, 비디오 카운트, 프로필 모두 브랜드별로 정확히 필터링',
    '🎯 선택된 브랜드의 데이터만 표시되도록 3단계 필터링 적용',
  ],
  '2.0.7': [
    '👥 AdminPage에 pending 사용자 전용 테이블 추가',
    '✅ "새로 가입 신청" 섹션으로 가입자 쉽게 확인',
    '🔘 승인/거절 버튼으로 빠른 사용자 관리',
    '📊 등록된 사용자와 가입 신청 분리',
    '🔧 Profiles 페이지 TikTok Username 변경 시 document ID 처리 개선',
    '🗑️ Creators 상세 모달에서 중복된 이름 수정 기능 제거',
  ],
  '2.0.6': [
    '✅ 새 사용자 자동 등록 기능 추가',
    '🔐 Firestore 규칙 수정 - 사용자가 자신의 계정 생성 가능',
    '🆕 첫 로그인 시 자동으로 users 컬렉션에 추가 (pending 상태)',
    '⚡ 관리자 승인 대기 메시지 자동 표시',
  ],
  '2.0.5': [
    '🔧 운송장 번호 입력 UX 개선',
    '✅ 저장 버튼 추가 - 입력 완료 후 한 번만 저장',
    '🔤 문자/숫자 모두 입력 가능',
    '⚡ 불필요한 자동 저장 제거',
  ],
  '2.0.4': [
    '🔥 Seeding 시스템 전체 페이지 Firebase 동기화 완료',
    '✅ ReachOut, Negotiation, Production, Payment 페이지 Firebase 저장',
    '🚫 ReachOut 중복 생성 방지 로직 추가',
    '💾 모든 CRUD 작업이 Firebase에 직접 저장됨',
    '🔄 7개 컬렉션 실시간 동기화 (brands, creators, projects, reach-outs, negotiations, drafts, payments)',
    '⚡ 모든 계정이 실시간으로 데이터 공유',
    '🐛 undefined 필드 에러 완전 제거',
  ],
  '2.0.3': [
    '🔥 Seeding 시스템 Firebase 실시간 동기화 완전 수정',
    '💾 모든 데이터가 Firebase에 자동 저장됨',
    '🔄 실시간 다중 사용자 동기화 완벽 작동',
    '✅ 데이터 영속성 보장 (새로고침해도 유지)',
    '🐛 Tailwind CDN 프로덕션 경고 수정',
  ],
  '2.0.2': [
    '🚨 긴급 수정: 권한 오류로 다른 유저가 데이터 못 보는 문제 해결',
    '🔒 Firestore 보안 규칙에서 status 체크 제거',
    '✅ 모든 인증된 사용자가 전체 데이터 접근 가능',
  ],
  '2.0.1': [
    '🎨 TikTok Dashboard → eoeo workspace 리브랜딩',
    '🔄 자동 백업 시스템 추가 (1시간 간격, 7일 보관)',
    '📧 프로젝트별 이메일 템플릿 관리 (최대 3개)',
    '🎯 크리에이터 카테고리 필터 (8개 카테고리)',
    '✅ 크리에이터 전체 선택/해제 기능',
    '🔍 Reach Out 검색 기능',
    '📋 이메일 템플릿 복사 버튼',
    '🐛 TypeScript 타입 오류 수정',
  ],
  '2.0.0': [
    '🚀 Seeding System 추가',
    '📊 크리에이터 관리 시스템',
    '💼 프로젝트 관리 시스템',
    '🤝 협상 관리 시스템',
  ],
};
