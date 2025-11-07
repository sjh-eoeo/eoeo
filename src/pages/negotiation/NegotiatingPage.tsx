import React from 'react';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';

export const NegotiatingPage: React.FC = () => {
  const { getProjectsByStatus } = useNegotiationProjectStore();
  
  const negotiatingProjects = getProjectsByStatus('negotiating');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">협상 중</h1>
        <div className="text-sm text-gray-400">
          {negotiatingProjects.length}개 프로젝트
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-12 text-gray-400">
          {negotiatingProjects.length === 0 ? (
            <div>
              <p className="text-lg mb-2">진행 중인 협상이 없습니다</p>
            </div>
          ) : (
            <p>협상 중인 프로젝트 {negotiatingProjects.length}개</p>
          )}
        </div>
      </div>
    </div>
  );
};
