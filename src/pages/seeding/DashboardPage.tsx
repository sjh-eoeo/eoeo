import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeedingCreatorStore } from '../../store/useSeedingCreatorStore';
import { Button } from '../../components/ui/Button';

/**
 * Seeding System - Dashboard
 * 
 * 전체 플로우 개요 및 빠른 액세스
 */
export function SeedingDashboardPage() {
  const navigate = useNavigate();
  const { creators } = useSeedingCreatorStore();

  const flowSteps = [
    {
      id: 'creators',
      title: 'Step 1. 크리에이터 관리',
      description: '크리에이터 등록, 필터링, CSV 다운로드',
      path: '/seeding/creators',
      color: 'blue',
      stats: `${creators.length}명 등록`,
    },
    {
      id: 'projects',
      title: 'Step 2. 프로젝트 설정',
      description: '브랜드/프로젝트 등록 및 크리에이터 선정',
      path: '/seeding/projects',
      color: 'purple',
      stats: '곧 출시',
    },
    {
      id: 'reach-out',
      title: 'Step 3. Reach Out',
      description: '크리에이터 연락 및 회신 분류',
      path: '/seeding/reach-out',
      color: 'green',
      stats: '곧 출시',
    },
    {
      id: 'negotiation',
      title: 'Step 4. 협상',
      description: '협상 진행 및 채팅, 운송장 입력',
      path: '/seeding/negotiation',
      color: 'yellow',
      stats: '곧 출시',
    },
    {
      id: 'production',
      title: 'Step 5. 컨텐츠 제작',
      description: '드래프트 업로드 및 검토',
      path: '/seeding/production',
      color: 'pink',
      stats: '곧 출시',
    },
    {
      id: 'payment',
      title: 'Step 6. 결제',
      description: '결제 처리 및 송금증 업로드',
      path: '/seeding/payment',
      color: 'emerald',
      stats: '곧 출시',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500',
        text: 'text-blue-400',
        hover: 'hover:border-blue-400',
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500',
        text: 'text-purple-400',
        hover: 'hover:border-purple-400',
      },
      green: {
        bg: 'bg-green-500/10',
        border: 'border-green-500',
        text: 'text-green-400',
        hover: 'hover:border-green-400',
      },
      yellow: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500',
        text: 'text-yellow-400',
        hover: 'hover:border-yellow-400',
      },
      pink: {
        bg: 'bg-pink-500/10',
        border: 'border-pink-500',
        text: 'text-pink-400',
        hover: 'hover:border-pink-400',
      },
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500',
        text: 'text-emerald-400',
        hover: 'hover:border-emerald-400',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Seeding System Dashboard
        </h1>
        <p className="text-xl text-gray-400">
          크리에이터 시딩부터 결제까지, 전체 프로세스를 관리합니다
        </p>
      </div>

      {/* 전체 플로우 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">전체 플로우</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flowSteps.map((step) => {
            const colors = getColorClasses(step.color);
            return (
              <div
                key={step.id}
                className={`${colors.bg} border-2 ${colors.border} ${colors.hover} rounded-xl p-6 transition-all duration-300 cursor-pointer group`}
                onClick={() => navigate(step.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {step.title}
                  </h3>
                  <span className={`text-xs px-3 py-1 ${colors.text} bg-gray-800 rounded-full flex-shrink-0`}>
                    {step.stats}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">빠른 시작 가이드</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              1
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">크리에이터 등록</h4>
              <p className="text-gray-400 text-sm">
                CSV 업로드 또는 수동으로 크리에이터를 등록합니다. 팔로워수, 금액 등을 입력하세요.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              2
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">프로젝트 생성</h4>
              <p className="text-gray-400 text-sm">
                브랜드와 프로젝트를 생성하고, 참여할 크리에이터를 선정합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              3
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">연락 및 회신 관리</h4>
              <p className="text-gray-400 text-sm">
                크리에이터에게 연락하고, 회신을 "관심있음" 또는 "거절"로 분류합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              4
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">협상 진행</h4>
              <p className="text-gray-400 text-sm">
                협상 조건(영상 갯수, 금액, 플랫폼 등)을 입력하고 채팅으로 소통합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              5
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">컨텐츠 제작 및 검토</h4>
              <p className="text-gray-400 text-sm">
                드래프트 영상을 업로드하고, 본사 팀에서 검토 후 댓글을 남깁니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
              6
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">결제 처리</h4>
              <p className="text-gray-400 text-sm">
                결제 정보를 입력하고 송금증을 업로드합니다. 재무팀에서 최종 확인합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-cyan-700">
          <Button onClick={() => navigate('/seeding/creators')} size="lg">
            지금 시작하기
          </Button>
        </div>
      </div>

      {/* 통계 (추후 구현) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Creators</div>
          <div className="text-3xl font-bold text-white">{creators.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Active Projects</div>
          <div className="text-3xl font-bold text-purple-400">0</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">In Negotiation</div>
          <div className="text-3xl font-bold text-yellow-400">0</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-400">0</div>
        </div>
      </div>
    </div>
  );
}
