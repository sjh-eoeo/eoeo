import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { ProjectComment } from '../../../types/negotiation';

interface ProjectCommentsProps {
  projectId: string;
  comments: ProjectComment[];
  onAddComment: (message: string, mentions?: string[]) => Promise<void>;
  onMarkAsRead?: (commentId: string) => Promise<void>;
}

export const ProjectComments: React.FC<ProjectCommentsProps> = ({
  projectId,
  comments,
  onAddComment,
  onMarkAsRead,
}) => {
  const { appUser } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // 읽지 않은 댓글 자동 읽음 처리
  useEffect(() => {
    if (onMarkAsRead) {
      comments
        .filter((c) => c.isRead === false && c.userId !== appUser?.uid)
        .forEach((c) => onMarkAsRead(c.id));
    }
  }, [comments, appUser, onMarkAsRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // @멘션 감지
      const mentions = newComment.match(/@(\w+)/g)?.map((m) => m.substring(1)) || [];
      await onAddComment(newComment, mentions);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  };

  const getTeamBadge = (team: string) => {
    switch (team) {
      case 'ph-team':
        return <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">PH Team</span>;
      case 'hq':
        return <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">HQ Korea</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          💬 Comments
          {comments.filter((c) => !c.isRead).length > 0 && (
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
              {comments.filter((c) => !c.isRead).length} new
            </span>
          )}
        </h3>
        <span className="text-xs text-gray-400">{comments.length} comments</span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg ${
                comment.userId === appUser?.uid
                  ? 'bg-cyan-900/30 border border-cyan-700'
                  : 'bg-gray-700'
              } ${!comment.isRead ? 'ring-2 ring-yellow-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{comment.userName}</span>
                  {getTeamBadge(comment.userTeam)}
                  {comment.userRole && (
                    <span className="text-xs text-gray-400">({comment.userRole})</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatTimestamp(comment.timestamp)}</span>
              </div>
              
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.message}</p>
              
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {comment.attachments.map((file, idx) => (
                    <div key={idx} className="text-xs text-cyan-400 flex items-center gap-1">
                      📎 {file.fileName}
                    </div>
                  ))}
                </div>
              )}
              
              {comment.isEdited && (
                <span className="text-xs text-gray-500 mt-1 block">(edited)</span>
              )}
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment... (Use @username to mention)"
          multiline
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            💡 Tip: Use @username to mention team members
          </div>
          <Button type="submit" size="sm" disabled={!newComment.trim() || isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </div>
  );
};
