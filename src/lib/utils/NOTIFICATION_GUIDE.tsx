/**
 * 알림 시스템 사용 가이드
 * 
 * 프로젝트 참여자에게만 알림을 보내는 방법
 */

import { 
  getNotifications, 
  getNotificationCount, 
  getNotificationRecipients,
  shouldReceiveNotification,
  filterProjectsForUser
} from '../lib/utils/notifications';

// ============================================
// 1. 프로젝트 리스트 필터링 (페이지에서 사용)
// ============================================

/**
 * 예: NegotiationDashboardPage에서 사용
 */
function useFilteredProjects() {
  const { projects } = useNegotiationProjectStore();
  const { appUser } = useAuthStore();
  const [projectMetadata, setProjectMetadata] = useState([]);

  // LocalStorage에서 프로젝트 메타데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('negotiation-project-metadata');
    if (saved) {
      setProjectMetadata(JSON.parse(saved));
    }
  }, []);

  // 현재 유저에게 표시할 프로젝트만 필터링
  const visibleProjects = useMemo(() => {
    if (!appUser) return [];
    
    return filterProjectsForUser(
      projects,
      appUser.email,
      appUser.role,
      projectMetadata
    );
  }, [projects, appUser, projectMetadata]);

  return visibleProjects;
}

// ============================================
// 2. 알림 카운트 계산 (헤더에서 사용)
// ============================================

/**
 * 예: Header 컴포넌트에서 알림 배지
 */
function NotificationBadge() {
  const { projects } = useNegotiationProjectStore();
  const { appUser } = useAuthStore();
  const [projectMetadata, setProjectMetadata] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('negotiation-project-metadata');
    if (saved) {
      setProjectMetadata(JSON.parse(saved));
    }
  }, []);

  // 현재 유저에게 관련된 알림만 카운트
  const notificationCount = getNotificationCount(
    projects,
    appUser?.email,
    appUser?.role,
    projectMetadata
  );

  return (
    <div className="relative">
      <BellIcon />
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {notificationCount}
        </span>
      )}
    </div>
  );
}

// ============================================
// 3. 댓글 추가 시 알림 수신자 계산
// ============================================

/**
 * 예: ProjectComments에서 댓글 추가 시
 */
async function handleAddComment(project: Project, message: string) {
  const { appUser } = useAuthStore();
  
  // LocalStorage에서 프로젝트 메타데이터 로드
  const savedMetadata = localStorage.getItem('negotiation-project-metadata');
  const projectMetadata = savedMetadata ? JSON.parse(savedMetadata) : [];

  // 이 프로젝트의 알림을 받을 사람들
  const recipients = getNotificationRecipients(project, projectMetadata);
  
  console.log('알림을 받을 사람들:', recipients);
  // ['user1@example.com', 'user2@example.com', 'admin@example.com']

  // 댓글 저장
  const newComment: ProjectComment = {
    id: `comment-${Date.now()}`,
    projectId: project.id,
    userId: appUser.uid,
    userName: appUser.displayName || appUser.email,
    userEmail: appUser.email,
    message,
    timestamp: new Date().toISOString(),
    isRead: false,
    mentions: [],
  };

  // Firestore에 댓글 저장 (구현 필요)
  // await addDoc(collection(db, 'comments'), newComment);

  // 실시간 알림 전송 (구현 필요)
  recipients.forEach(recipientEmail => {
    if (recipientEmail !== appUser.email) {
      // sendNotificationToUser(recipientEmail, {
      //   type: 'new-comment',
      //   project: project.category.projectName,
      //   creator: project.creatorName,
      //   message: `${appUser.displayName}님이 댓글을 남겼습니다: ${message.substring(0, 50)}...`
      // });
    }
  });

  return newComment;
}

// ============================================
// 4. 특정 유저가 알림을 받아야 하는지 확인
// ============================================

/**
 * 예: 실시간 알림 구독 시
 */
function subscribeToProjectNotifications(userId: string, userEmail: string, userRole: string) {
  const { projects } = useNegotiationProjectStore();
  
  // LocalStorage에서 프로젝트 메타데이터 로드
  const savedMetadata = localStorage.getItem('negotiation-project-metadata');
  const projectMetadata = savedMetadata ? JSON.parse(savedMetadata) : [];

  // 유저가 참여중인 프로젝트들의 ID 목록
  const subscribedProjectIds = projects
    .filter(project => 
      shouldReceiveNotification(project, userEmail, userRole, projectMetadata)
    )
    .map(project => project.id);

  console.log('구독할 프로젝트 ID들:', subscribedProjectIds);

  // Firestore 실시간 리스너 설정 (구현 필요)
  // subscribedProjectIds.forEach(projectId => {
  //   onSnapshot(doc(db, 'projects', projectId), (doc) => {
  //     // 프로젝트 업데이트 처리
  //   });
  // });
}

// ============================================
// 5. 알림 대시보드에서 사용
// ============================================

/**
 * 예: 알림 센터 페이지
 */
function NotificationCenter() {
  const { projects } = useNegotiationProjectStore();
  const { appUser } = useAuthStore();
  const [projectMetadata, setProjectMetadata] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('negotiation-project-metadata');
    if (saved) {
      setProjectMetadata(JSON.parse(saved));
    }
  }, []);

  // 현재 유저에게 관련된 알림만 가져오기
  const notifications = getNotifications(
    projects,
    appUser?.email,
    appUser?.role,
    projectMetadata
  );

  return (
    <div>
      <h2>알림 센터</h2>
      
      <section>
        <h3>긴급 ({notifications.high.length})</h3>
        {notifications.high.map(project => (
          <div key={project.id} className="alert-high">
            {project.creatorName} - 48시간 이상 업데이트 없음
          </div>
        ))}
      </section>

      <section>
        <h3>새 알림 ({notifications.medium.length})</h3>
        {notifications.medium.map(project => (
          <div key={project.id} className="alert-medium">
            {project.creatorName} - {project.unreadCommentCount}개의 새 댓글
          </div>
        ))}
      </section>
    </div>
  );
}

// ============================================
// 6. 프로젝트 메타데이터 저장 형식
// ============================================

/**
 * LocalStorage에 저장되는 형식
 * Key: 'negotiation-project-metadata'
 */
interface ProjectMetadata {
  id: string;                    // 'meta-1234567890'
  name: string;                  // '2024 Summer Campaign'
  brand: string;                 // 'Nike'
  product?: string;              // 'Air Max'
  region?: string;               // 'US'
  participants: string[];        // ['user1@example.com', 'user2@example.com']
  createdAt: string;
  updatedAt: string;
}

// 예시 데이터:
const exampleMetadata: ProjectMetadata[] = [
  {
    id: 'meta-1234567890',
    name: '2024 Summer Campaign',
    brand: 'Nike',
    product: 'Air Max',
    region: 'US',
    participants: [
      'john@company.com',
      'sarah@company.com',
      'admin@company.com'
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// ============================================
// 7. 실제 구현 체크리스트
// ============================================

/**
 * ✅ 완료된 기능:
 * - filterProjectsForUser: 유저별 프로젝트 필터링
 * - getNotificationCount: 유저별 알림 카운트
 * - getNotifications: 유저별 알림 목록
 * - getNotificationRecipients: 프로젝트 참여자 목록
 * - shouldReceiveNotification: 알림 수신 여부 확인
 * - isProjectParticipant: 참여자 확인
 * 
 * 🔄 구현 필요:
 * - Firestore에 댓글 저장
 * - 실시간 알림 전송 (FCM, WebSocket 등)
 * - 이메일 알림
 * - 알림 읽음 처리
 * - 알림 히스토리
 */

export {};
