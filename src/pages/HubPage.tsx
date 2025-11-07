import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';

/**
 * HubPage - 로그인 후 프로젝트 선택 허브
 * 
 * 두 개의 독립적인 시스템 중 하나를 선택:
 * 1. 10K System - 기존 TikTok 비디오 관리 시스템
 * 2. Seeding System - 새로운 크리에이터 시딩/협상 시스템
 */
export function HubPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            eoeo workspace
          </h1>
          <p className="text-gray-500 text-sm">크리에이터 협업 관리 플랫폼</p>
        </div>
        <p className="text-xl text-gray-400">
          안녕하세요, <span className="text-blue-400">{user?.email}</span>님
        </p>
        <p className="text-gray-500 mt-2">
          어떤 프로젝트로 이동하시겠습니까?
        </p>
      </div>        {/* Project Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* 10K System Card */}
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 overflow-hidden group">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                10K System
              </h2>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                기존 TikTok 비디오 관리 시스템
              </p>

              <div className="space-y-2 mb-8 text-sm">
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">•</span>
                  비디오 업로드 & 관리
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">•</span>
                  프로필 관리
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">•</span>
                  결제 & 재무 관리
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-2">•</span>
                  통계 대시보드
                </div>
              </div>

              <Button
                onClick={() => navigate('/10k/dashboard')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold"
              >
                10K System 입장
              </Button>
            </div>
          </div>

          {/* Seeding System Card */}
          <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 overflow-hidden group">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                Seeding System
              </h2>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                새로운 크리에이터 시딩 & 협상 시스템
              </p>

              <div className="space-y-2 mb-8 text-sm">
                <div className="flex items-center text-gray-300">
                  <span className="text-blue-400 mr-2">•</span>
                  크리에이터 등록 & 관리
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-blue-400 mr-2">•</span>
                  프로젝트 & 협상 관리
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-blue-400 mr-2">•</span>
                  컨텐츠 제작 & 검토
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-blue-400 mr-2">•</span>
                  결제 처리
                </div>
              </div>

              <Button
                onClick={() => navigate('/seeding/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
              >
                Seeding System 입장
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Tip: 좌측 상단의 "TikTok Dashboard"를 클릭하면 언제든 이 페이지로 돌아올 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
