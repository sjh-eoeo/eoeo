import React from 'react';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';
import { useCreatorStore } from '../../store/useCreatorStore';

export const NegotiationDashboardPage: React.FC = () => {
  const { projects } = useNegotiationProjectStore();
  const { creators } = useCreatorStore();

  // 상태별 통계
  const statusStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    projects.forEach((project) => {
      stats[project.status] = (stats[project.status] || 0) + 1;
    });
    return stats;
  }, [projects]);

  // 브랜드별 통계
  const brandStats = React.useMemo(() => {
    const stats: Record<string, { total: number; completed: number; dropped: number }> = {};
    projects.forEach((project) => {
      const brand = project.category.brand;
      if (!stats[brand]) {
        stats[brand] = { total: 0, completed: 0, dropped: 0 };
      }
      stats[brand].total += 1;
      if (project.status === 'completed') stats[brand].completed += 1;
      if (project.status === 'dropped-by-us' || project.status === 'rejected-by-creator') {
        stats[brand].dropped += 1;
      }
    });
    return stats;
  }, [projects]);

  const activeProjects = projects.filter((p) => 
    !['completed', 'dropped-by-us', 'rejected-by-creator'].includes(p.status)
  );

  const needsAttention = projects.filter((p) => p.needsAttention);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">협상 테이블 대시보드</h1>
      </div>

      {/* 알림 */}
      {needsAttention.length > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-semibold text-yellow-400">주의 필요</h3>
          </div>
          <p className="text-yellow-200">
            {needsAttention.length}개 프로젝트가 48시간 이상 업데이트되지 않았습니다.
          </p>
        </div>
      )}

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">전체 프로젝트</div>
          <div className="text-3xl font-bold text-white">{projects.length}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">진행 중</div>
          <div className="text-3xl font-bold text-cyan-400">{activeProjects.length}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">완료</div>
          <div className="text-3xl font-bold text-green-400">
            {statusStats['completed'] || 0}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">크리에이터</div>
          <div className="text-3xl font-bold text-purple-400">{creators.length}</div>
        </div>
      </div>

      {/* 브랜드별 현황 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">브랜드별 현황</h2>
        <div className="space-y-4">
          {Object.entries(brandStats).map(([brand, stat]) => {
            const stats = stat as { total: number; completed: number; dropped: number };
            return (
              <div key={brand} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium text-white uppercase">{brand}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-cyan-400">
                    진행중 {stats.total - stats.completed - stats.dropped}
                  </div>
                  <div className="text-green-400">완료 {stats.completed}</div>
                  <div className="text-red-400">Drop {stats.dropped}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상태별 현황 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">상태별 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(statusStats).map(([status, count]) => (
            <div key={status} className="bg-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">{getStatusLabel(status)}</div>
              <div className="text-2xl font-bold text-white">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'email-sent': '메일 발송',
    'response-received': '회신 도착',
    'negotiating': '협상 중',
    'agreed': '합의 완료',
    'in-production': '제작 중',
    'draft-review': 'Draft 리뷰',
    'published': '게시 완료',
    'payment-pending': '결제 대기',
    'completed': '완료',
    'rejected-by-creator': '크리에이터 거절',
    'dropped-by-us': '우리가 Drop',
  };
  return labels[status] || status;
}
