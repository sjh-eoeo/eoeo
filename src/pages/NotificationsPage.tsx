import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationProjectStore } from '../store/useNegotiationProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { getAllNotifications, markInvitationAsRead } from '../lib/utils/notifications';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Notification } from '../types/notification';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = useNegotiationProjectStore();
  const { appUser } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projectMetadata, setProjectMetadata] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'invitations' | 'updates'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // 프로젝트 메타데이터 로드 (주기적으로 새로고침)
  useEffect(() => {
    const loadMetadata = () => {
      const saved = localStorage.getItem('negotiation-project-metadata');
      if (saved) {
        try {
          setProjectMetadata(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load project metadata:', error);
        }
      }
    };

    loadMetadata();
    
    // 5초마다 새로고침
    const interval = setInterval(loadMetadata, 5000);
    return () => clearInterval(interval);
  }, []);

  // 알림 로드
  useEffect(() => {
    if (appUser && projectMetadata.length >= 0) {
      console.log('👤 NotificationsPage - Current user:', appUser.email);
      try {
        const allNotifications = getAllNotifications(
          projects,
          appUser.email,
          appUser.role,
          projectMetadata
        );
        console.log('📋 Total notifications loaded:', allNotifications.length);
        setNotifications(allNotifications);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }, [projects, appUser, projectMetadata, refreshKey]);

  const handleNotificationClick = (notification: Notification) => {
    // 초대 알림이면 읽음 처리만 하고 페이지 이동 없음
    if (notification.type === 'project-invitation') {
      markInvitationAsRead(notification.id);
      
      // 알림 목록 업데이트
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      
      // 초대 알림은 페이지 이동 없이 읽음 처리만
      return;
    }

    // 다른 알림들은 해당 페이지로 이동
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    notifications
      .filter(n => n.type === 'project-invitation' && !n.isRead)
      .forEach(n => markInvitationAsRead(n.id));
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  // 필터링
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'invitations') return notification.type === 'project-invitation';
    if (filter === 'updates') return notification.type !== 'project-invitation';
    return true;
  });

  // 그룹화 (날짜별)
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

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

  const getPriorityBadge = (priority: Notification['priority']) => {
    const variants: Record<string, 'error' | 'warning' | 'default'> = {
      high: 'error',
      medium: 'warning',
      low: 'default',
    };
    
    const labels: Record<string, string> = {
      high: '긴급',
      medium: '중요',
      low: '일반',
    };
    
    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">알림</h1>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              모두 읽음으로 표시
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            전체 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            읽지 않음 ({notifications.filter(n => !n.isRead).length})
          </button>
          <button
            onClick={() => setFilter('invitations')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'invitations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            초대 ({notifications.filter(n => n.type === 'project-invitation').length})
          </button>
          <button
            onClick={() => setFilter('updates')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'updates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            업데이트 ({notifications.filter(n => n.type !== 'project-invitation').length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <p className="text-gray-400 text-lg">📭 알림이 없습니다</p>
          <p className="text-gray-500 text-sm mt-2">
            새로운 알림이 도착하면 여기에 표시됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([dateLabel, notifs]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase">
                {dateLabel}
              </h2>
              <div className="space-y-2">
                {notifs.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      notification.isRead
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                        : 'bg-gray-800/80 border-blue-500/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="text-3xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">
                              {notification.title}
                            </h3>
                            {getPriorityBadge(notification.priority)}
                            {!notification.isRead && (
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-gray-300 text-sm mb-2">
                          {notification.message}
                        </p>

                        {notification.projectName && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>프로젝트:</span>
                            <span className="text-gray-400">
                              {notification.projectName}
                            </span>
                          </div>
                        )}

                        {notification.metadata?.invitedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            초대한 사람: {notification.metadata.invitedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to group notifications by date
function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {
    '오늘': [],
    '어제': [],
    '이번 주': [],
    '이전': [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach((notification) => {
    const date = new Date(notification.timestamp);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() === today.getTime()) {
      groups['오늘'].push(notification);
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      groups['어제'].push(notification);
    } else if (dateOnly.getTime() >= weekAgo.getTime()) {
      groups['이번 주'].push(notification);
    } else {
      groups['이전'].push(notification);
    }
  });

  // 빈 그룹 제거
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}
