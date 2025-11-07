import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationProjectStore } from '../../../store/useNegotiationProjectStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { getTotalNotificationCount, getAllNotifications } from '../../../lib/utils/notifications';
import { BellIcon } from '../../icons/BellIcon';
import { Badge } from '../../ui/Badge';
import type { Project } from '../../../types/negotiation';
import type { Notification } from '../../../types/notification';

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = useNegotiationProjectStore();
  const { appUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [projectMetadata, setProjectMetadata] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // LocalStorage에서 프로젝트 메타데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('negotiation-project-metadata');
    if (saved) {
      try {
        setProjectMetadata(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load project metadata:', error);
      }
    }
  }, [refreshKey]);

  // 드롭다운 열릴 때마다 알림 새로고침
  useEffect(() => {
    if (isOpen) {
      setRefreshKey(prev => prev + 1);
    }
  }, [isOpen]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 알림 계산 (안전하게)
  const allNotifications = React.useMemo(() => {
    if (!appUser) {
      console.log('❌ No appUser in NotificationDropdown');
      return [];
    }
    console.log('👤 NotificationDropdown - Current user:', appUser.email);
    try {
      return getAllNotifications(projects, appUser.email, appUser.role, projectMetadata);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }, [projects, appUser, projectMetadata]);
  
  const notificationCount = React.useMemo(() => {
    if (!appUser) return 0;
    try {
      return getTotalNotificationCount(projects, appUser.email, appUser.role, projectMetadata);
    } catch (error) {
      console.error('Failed to get notification count:', error);
      return 0;
    }
  }, [projects, appUser, projectMetadata]);
  
  // High/Medium 우선순위별 분류
  const highPriorityNotifs = allNotifications.filter(n => n.priority === 'high').slice(0, 3);
  const mediumPriorityNotifs = allNotifications.filter(n => n.priority === 'medium').slice(0, 5);

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    
    // 초대 알림은 알림 페이지로 이동 (읽음 처리는 NotificationsPage에서)
    if (notification.type === 'project-invitation') {
      navigate('/negotiation/notifications');
      return;
    }
    
    // 다른 알림들은 해당 프로젝트 페이지로 이동
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons: Record<Notification['type'], string> = {
      'project-invitation': '📧',
      'new-comment': '💬',
      'draft-submitted': '📹',
      'status-changed': '🔄',
      'payment-ready': '💰',
      'needs-attention': '🚨',
    };
    return icons[type] || '📢';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
      >
        <BellIcon className="w-6 h-6" />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">알림</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/negotiation/notifications');
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                모두 보기
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {allNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                새로운 알림이 없습니다
              </div>
            ) : (
              <>
                {/* High Priority (긴급) */}
                {highPriorityNotifs.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-red-900/20 border-b border-gray-700">
                      <span className="text-xs font-semibold text-red-400">
                        🚨 긴급
                      </span>
                    </div>
                    {highPriorityNotifs.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                              <span className="font-medium text-white truncate">
                                {notification.title}
                              </span>
                              {!notification.isRead && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-red-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Medium Priority (새 알림) */}
                {mediumPriorityNotifs.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-blue-900/20 border-b border-gray-700">
                      <span className="text-xs font-semibold text-blue-400">
                        📬 새 알림
                      </span>
                    </div>
                    {mediumPriorityNotifs.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                              <span className="font-medium text-white truncate">
                                {notification.title}
                              </span>
                              {!notification.isRead && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-blue-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
