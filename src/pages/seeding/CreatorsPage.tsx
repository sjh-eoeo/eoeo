import React, { useState, useMemo } from 'react';
import { useSeedingCreatorStore } from '../../store/useSeedingCreatorStore';
import { useSeedingProjectStore } from '../../store/useSeedingProjectStore';
import { useSeedingNegotiationStore } from '../../store/useSeedingNegotiationStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import {
  parseCSV,
  parseCreatorsFromCSV,
  getCreatorTemplateCSV,
  creatorsToCSV,
  downloadCSV,
  readFileAsText,
  formatNumber,
  formatCurrency,
} from '../../lib/utils/seedingCsv';
import {
  extractUsernameFromLink,
  fetchTikTokUserInfo,
  isValidTikTokLink,
} from '../../lib/utils/tokapi';
import type { Creator } from '../../types/seeding';

// 컬럼 헬퍼를 컴포넌트 외부에 선언 (재생성 방지)
const columnHelper = createColumnHelper<Creator>();

/**
 * Seeding System - Creators Page
 * 
 * 크리에이터 등록 및 관리
 * - 엑셀(CSV) 업로드
 * - 수동 추가
 * - 필터링 및 검색
 * - CSV 다운로드
 */
export function SeedingCreatorsPage() {
  const { creators, addCreator, addCreators, deleteCreator, updateCreator } = useSeedingCreatorStore();
  const { projects } = useSeedingProjectStore();
  const { negotiations } = useSeedingNegotiationStore();
  
  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // 검색 및 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [minFollowers, setMinFollowers] = useState<number | ''>('');
  const [maxFollowers, setMaxFollowers] = useState<number | ''>('');
  
  // 수동 추가 폼
  const [newCreator, setNewCreator] = useState({
    userId: '',
    profileLink: '',
    email: '',
    followers: '',
    posts: '',
    likes: '',
    reasonableRate: '',
    offerRate: '',
    category: '미분류' as string,
    country: '',
    tags: '',
    notes: '',
  });

  // TokAPI 로딩 상태
  const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);

  // 필터링된 크리에이터 목록
  const filteredCreators = useMemo(() => {
    return creators.filter(creator => {
      // 검색어 필터
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        creator.userId.toLowerCase().includes(searchLower) ||
        creator.email.toLowerCase().includes(searchLower) ||
        creator.country?.toLowerCase().includes(searchLower) ||
        creator.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      
      // 팔로워수 필터
      const matchesMinFollowers = !minFollowers || creator.followers >= minFollowers;
      const matchesMaxFollowers = !maxFollowers || creator.followers <= maxFollowers;
      
      return matchesSearch && matchesMinFollowers && matchesMaxFollowers;
    });
  }, [creators, searchQuery, minFollowers, maxFollowers]);

  // 테이블 컬럼 정의 (user id, followers, reasonable rate만 표시)
  const columns = useMemo(() => [
    columnHelper.accessor('userId', {
      header: 'User ID',
      cell: (info) => (
        <a
          href={info.row.original.profileLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {info.getValue()}
        </a>
      ),
    }),
    columnHelper.accessor('followers', {
      header: 'Followers',
      cell: (info) => (
        <span className="font-semibold text-cyan-400">
          {formatNumber(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('reasonableRate', {
      header: 'Reasonable Rate',
      cell: (info) => (
        <span className="text-green-400 font-medium">
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCreator(info.row.original);
              setIsDetailModalOpen(true);
            }}
          >
            상세보기
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`${info.row.original.userId}를 삭제하시겠습니까?`)) {
                deleteCreator(info.row.original.id);
              }
            }}
          >
            삭제
          </Button>
        </div>
      ),
    }),
  ], [deleteCreator]);

  // 테이블 설정
  const tableState = useTableState({
    initialSorting: [{ id: 'updatedAt', desc: true }],
  });
  const table = useReactTable({
    data: filteredCreators,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: tableState.sorting,
      pagination: tableState.pagination,
    },
    onSortingChange: tableState.setSorting,
    onPaginationChange: tableState.setPagination,
  });

  // 프로필 링크에서 사용자 정보 자동 가져오기
  const handleFetchUserInfo = async () => {
    if (!newCreator.profileLink) {
      alert('프로필 링크를 입력하세요.');
      return;
    }

    if (!isValidTikTokLink(newCreator.profileLink)) {
      alert('올바른 TikTok 프로필 링크를 입력하세요.');
      return;
    }

    setIsFetchingUserInfo(true);

    try {
      const username = extractUsernameFromLink(newCreator.profileLink);
      if (!username) {
        alert('프로필 링크에서 username을 추출할 수 없습니다.');
        setIsFetchingUserInfo(false);
        return;
      }

      const userInfo = await fetchTikTokUserInfo(username);
      if (!userInfo) {
        alert('사용자 정보를 가져올 수 없습니다. API 할당량을 확인하세요.');
        setIsFetchingUserInfo(false);
        return;
      }

      // 폼에 자동 입력
      setNewCreator({
        ...newCreator,
        userId: `@${userInfo.uniqueId}`,
        followers: userInfo.followers.toString(),
        posts: userInfo.videos.toString(),
        likes: userInfo.likes.toString(),
        notes: userInfo.signature || newCreator.notes,
      });

      alert('사용자 정보를 성공적으로 가져왔습니다!');
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      alert('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsFetchingUserInfo(false);
    }
  };

  // 수동 추가 핸들러
  const handleAddCreator = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCreator.userId || !newCreator.email) {
      alert('User ID와 Email은 필수입니다.');
      return;
    }

    const creator: Creator = {
      id: `creator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: newCreator.userId,
      profileLink: newCreator.profileLink || `https://www.tiktok.com/${newCreator.userId}`,
      email: newCreator.email,
      followers: parseInt(newCreator.followers) || 0,
      posts: parseInt(newCreator.posts) || 0,
      likes: parseInt(newCreator.likes) || 0,
      reasonableRate: parseFloat(newCreator.reasonableRate) || 0,
      offerRate: parseFloat(newCreator.offerRate) || 0,
      country: newCreator.country || undefined,
      tags: newCreator.tags ? newCreator.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: newCreator.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCreator(creator);
    setIsAddModalOpen(false);
    
    // 폼 초기화
    setNewCreator({
      userId: '',
      profileLink: '',
      email: '',
      followers: '',
      posts: '',
      likes: '',
      reasonableRate: '',
      offerRate: '',
      country: '',
      tags: '',
      notes: '',
    });
  };

  // CSV 업로드 핸들러
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const parsedData = parseCSV(text);
      const parsedCreators = parseCreatorsFromCSV(parsedData);
      
      // 완전한 Creator 객체로 변환
      const completeCreators: Creator[] = parsedCreators.map(partial => ({
        id: `creator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: partial.userId || '',
        profileLink: partial.profileLink || '',
        email: partial.email || '',
        followers: partial.followers || 0,
        posts: partial.posts || 0,
        likes: partial.likes || 0,
        reasonableRate: partial.reasonableRate || 0,
        offerRate: partial.offerRate || 0,
        country: partial.country,
        tags: partial.tags,
        notes: partial.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      addCreators(completeCreators);
      setIsUploadModalOpen(false);
      alert(`${completeCreators.length}명의 크리에이터가 추가되었습니다!`);
    } catch (error) {
      console.error('CSV 업로드 오류:', error);
      alert('CSV 파일을 처리하는 중 오류가 발생했습니다.');
    }
  };

  // CSV 다운로드 핸들러
  const handleDownloadCSV = () => {
    if (filteredCreators.length === 0) {
      alert('다운로드할 크리에이터가 없습니다.');
      return;
    }
    
    const csv = creatorsToCSV(filteredCreators);
    downloadCSV(csv, `creators-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 템플릿 다운로드 핸들러
  const handleDownloadTemplate = () => {
    const template = getCreatorTemplateCSV();
    downloadCSV(template, 'creator-template.csv');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Creators Management
        </h1>
        <p className="text-gray-400">
          크리에이터를 등록하고 관리합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Creators</div>
          <div className="text-3xl font-bold text-white">{creators.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Filtered</div>
          <div className="text-3xl font-bold text-cyan-400">{filteredCreators.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Avg Followers</div>
          <div className="text-3xl font-bold text-purple-400">
            {creators.length > 0
              ? formatNumber(Math.round(creators.reduce((sum, c) => sum + c.followers, 0) / creators.length))
              : '0'}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Avg Offer Rate</div>
          <div className="text-3xl font-bold text-green-400">
            {creators.length > 0
              ? formatCurrency(Math.round(creators.reduce((sum, c) => sum + c.offerRate, 0) / creators.length))
              : '$0'}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setIsAddModalOpen(true)}>
          수동 추가
        </Button>
        <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}>
          CSV 업로드
        </Button>
        <Button variant="secondary" onClick={handleDownloadTemplate}>
          템플릿 다운로드
        </Button>
        <Button
          variant="success"
          onClick={handleDownloadCSV}
          disabled={filteredCreators.length === 0}
        >
          CSV 다운로드 ({filteredCreators.length})
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">검색 및 필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="검색 (User ID, Email, Country, Tags)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어 입력..."
          />
          <Input
            label="최소 팔로워"
            type="number"
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="예: 10000"
          />
          <Input
            label="최대 팔로워"
            type="number"
            value={maxFollowers}
            onChange={(e) => setMaxFollowers(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="예: 1000000"
          />
        </div>
        {(searchQuery || minFollowers || maxFollowers) && (
          <div className="mt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setMinFollowers('');
                setMaxFollowers('');
              }}
            >
              필터 초기화
            </Button>
          </div>
        )}
      </div>

      {/* 크리에이터 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <DataTable table={table} />
      </div>

      {/* 수동 추가 모달 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="크리에이터 수동 추가"
      >
        <form onSubmit={handleAddCreator} className="space-y-4">
          {/* TokAPI 정보 가져오기 */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">TikTok 정보 자동 가져오기</h4>
            <p className="text-sm text-gray-300 mb-3">
              프로필 링크를 입력하면 팔로워수, 게시물 수 등을 자동으로 가져옵니다.
            </p>
            <div className="flex gap-2">
              <Input
                label=""
                value={newCreator.profileLink}
                onChange={(e) => setNewCreator({ ...newCreator, profileLink: e.target.value })}
                placeholder="https://www.tiktok.com/@username"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleFetchUserInfo}
                disabled={isFetchingUserInfo || !newCreator.profileLink}
                className="mt-0"
              >
                {isFetchingUserInfo ? '가져오는 중...' : '정보 가져오기'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="User ID *"
              value={newCreator.userId}
              onChange={(e) => setNewCreator({ ...newCreator, userId: e.target.value })}
              placeholder="@username"
              required
            />
            <Input
              label="Email *"
              type="email"
              value={newCreator.email}
              onChange={(e) => setNewCreator({ ...newCreator, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Followers"
              type="number"
              value={newCreator.followers}
              onChange={(e) => setNewCreator({ ...newCreator, followers: e.target.value })}
              placeholder="150000"
            />
            <Input
              label="Posts"
              type="number"
              value={newCreator.posts}
              onChange={(e) => setNewCreator({ ...newCreator, posts: e.target.value })}
              placeholder="250"
            />
            <Input
              label="Likes"
              type="number"
              value={newCreator.likes}
              onChange={(e) => setNewCreator({ ...newCreator, likes: e.target.value })}
              placeholder="5000000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Reasonable Rate (USD)"
              type="number"
              step="0.01"
              value={newCreator.reasonableRate}
              onChange={(e) => setNewCreator({ ...newCreator, reasonableRate: e.target.value })}
              placeholder="500"
            />
            <Input
              label="Offer Rate (USD)"
              type="number"
              step="0.01"
              value={newCreator.offerRate}
              onChange={(e) => setNewCreator({ ...newCreator, offerRate: e.target.value })}
              placeholder="450"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={newCreator.category}
                onChange={(e) => setNewCreator({ ...newCreator, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="미분류">미분류</option>
                <option value="뷰티">뷰티</option>
                <option value="헤어">헤어</option>
                <option value="푸드">푸드</option>
                <option value="Health">Health</option>
                <option value="Diet">Diet</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Vlog">Vlog</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country
              </label>
            <select
              value={newCreator.country}
              onChange={(e) => setNewCreator({ ...newCreator, country: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">국가 선택</option>
              <optgroup label="North America">
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
              </optgroup>
              <optgroup label="Europe - Western">
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Spain">Spain</option>
                <option value="Italy">Italy</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Austria">Austria</option>
                <option value="Portugal">Portugal</option>
                <option value="Ireland">Ireland</option>
                <option value="Luxembourg">Luxembourg</option>
              </optgroup>
              <optgroup label="Europe - Northern">
                <option value="Sweden">Sweden</option>
                <option value="Norway">Norway</option>
                <option value="Denmark">Denmark</option>
                <option value="Finland">Finland</option>
                <option value="Iceland">Iceland</option>
              </optgroup>
              <optgroup label="Europe - Eastern">
                <option value="Poland">Poland</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Hungary">Hungary</option>
                <option value="Romania">Romania</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Slovenia">Slovenia</option>
                <option value="Croatia">Croatia</option>
                <option value="Serbia">Serbia</option>
                <option value="Ukraine">Ukraine</option>
              </optgroup>
              <optgroup label="Europe - Southern">
                <option value="Greece">Greece</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Malta">Malta</option>
              </optgroup>
              <optgroup label="Europe - Baltic">
                <option value="Estonia">Estonia</option>
                <option value="Latvia">Latvia</option>
                <option value="Lithuania">Lithuania</option>
              </optgroup>
            </select>
            </div>
          </div>

          <Input
            label="Tags (comma separated)"
            value={newCreator.tags}
            onChange={(e) => setNewCreator({ ...newCreator, tags: e.target.value })}
            placeholder="Fashion, Lifestyle, Beauty"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={newCreator.notes}
              onChange={(e) => setNewCreator({ ...newCreator, notes: e.target.value })}
              placeholder="추가 메모..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">
              추가하기
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV 업로드 모달 */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="CSV 파일 업로드"
      >
        <div className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">CSV 형식 안내</h4>
            <p className="text-sm text-gray-300 mb-2">다음 형식으로 CSV 파일을 준비해주세요:</p>
            <code className="text-xs bg-gray-900 p-2 block rounded text-green-400 whitespace-pre-wrap">
              user id, profile link, email, followers, posts, likes, reasonable rate, offer rate, category, country, tags, notes
            </code>
            <p className="text-xs text-gray-400 mt-2">
              • Category: 뷰티/헤어/푸드/Health/Diet/Lifestyle/Vlog (입력하지 않으면 '미분류'로 자동 설정됩니다)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CSV 파일 선택
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              닫기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 상세보기 모달 */}
      {selectedCreator && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCreator(null);
            setEditingCategory(null);
          }}
          title={`Creator Details - ${selectedCreator.userId}`}
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* 기본 정보 카드 */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-400">📋</span> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">User ID</div>
                  <a
                    href={selectedCreator.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline font-medium text-sm"
                  >
                    {selectedCreator.userId}
                  </a>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Email</div>
                  <div className="text-white text-sm">{selectedCreator.email}</div>
                </div>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg p-5 border border-cyan-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-400">📊</span> Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Followers</div>
                  <div className="text-cyan-400 font-bold text-xl">{formatNumber(selectedCreator.followers)}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Posts</div>
                  <div className="text-white font-bold text-xl">{formatNumber(selectedCreator.posts)}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Likes</div>
                  <div className="text-purple-400 font-bold text-xl">{formatNumber(selectedCreator.likes)}</div>
                </div>
              </div>
            </div>

            {/* 금액 카드 */}
            <div className="bg-gradient-to-r from-green-900/20 to-yellow-900/20 rounded-lg p-5 border border-green-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">💰</span> Rates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Reasonable Rate</div>
                  <div className="text-green-400 font-bold text-2xl">{formatCurrency(selectedCreator.reasonableRate)}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">Offer Rate</div>
                  <div className="text-yellow-400 font-bold text-2xl">{formatCurrency(selectedCreator.offerRate)}</div>
                </div>
              </div>
            </div>

            {/* 카테고리 & 국가 카드 */}
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-5 border border-purple-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-purple-400">🏷️</span> Category & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-2">Category</div>
                  {editingCategory !== null ? (
                    <div className="flex gap-2">
                      <select
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="미분류">미분류</option>
                        <option value="뷰티">뷰티</option>
                        <option value="헤어">헤어</option>
                        <option value="푸드">푸드</option>
                        <option value="Health">Health</option>
                        <option value="Diet">Diet</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Vlog">Vlog</option>
                      </select>
                      <button
                        onClick={async () => {
                          await updateCreator(selectedCreator.id!, { category: editingCategory as any });
                          setEditingCategory(null);
                        }}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-medium"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-white text-xs font-medium"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" className="text-sm">{selectedCreator.category || '미분류'}</Badge>
                      <button
                        onClick={() => setEditingCategory(selectedCreator.category || '미분류')}
                        className="px-2 py-1 text-xs text-purple-400 hover:text-purple-300 hover:underline"
                      >
                        수정
                      </button>
                    </div>
                  )}
                </div>
                {selectedCreator.country && (
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Country</div>
                    <div className="text-white font-medium">{selectedCreator.country}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 태그 & 노트 */}
            {(selectedCreator.tags?.length > 0 || selectedCreator.notes) && (
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-gray-400">📝</span> Additional Info
                </h3>
                {selectedCreator.tags && selectedCreator.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCreator.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCreator.notes && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Notes</div>
                    <div className="text-gray-300 bg-gray-900/50 p-3 rounded text-sm">{selectedCreator.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* 완료된 프로젝트 카드 */}
            {(() => {
              const completedProjects = projects.filter(
                p => p.status === 'completed' && p.selectedCreators?.includes(selectedCreator.id!)
              );
              
              return completedProjects.length > 0 ? (
                <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-lg p-5 border border-emerald-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-emerald-400">✅</span> Completed Projects ({completedProjects.length})
                  </h3>
                  <div className="space-y-3">
                    {completedProjects.map(project => {
                      const negotiation = negotiations.find(n => n.projectId === project.id);
                      return (
                        <div key={project.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-emerald-600 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-white font-semibold">{project.brandName}</div>
                              <div className="text-xs text-gray-400 mt-1">프로젝트명: {project.name}</div>
                            </div>
                            {negotiation?.terms?.amount && (
                              <div className="text-right">
                                <div className="text-xs text-gray-400">협상 금액</div>
                                <div className="text-emerald-400 font-bold text-lg">{formatCurrency(negotiation.terms.amount)}</div>
                              </div>
                            )}
                          </div>
                          {negotiation?.terms && (
                            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                              {(negotiation.terms as any).platforms && (
                                <div>
                                  <span className="text-gray-500">플랫폼: </span>
                                  <span className="text-gray-300">{(negotiation.terms as any).platforms.join(', ')}</span>
                                </div>
                              )}
                              {(negotiation.terms as any).numberOfPosts && (
                                <div>
                                  <span className="text-gray-500">포스트: </span>
                                  <span className="text-gray-300">{(negotiation.terms as any).numberOfPosts}개</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {/* 메타 정보 */}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
              생성일: {new Date(selectedCreator.createdAt).toLocaleString('ko-KR')}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedCreator(null);
                  setEditingCategory(null);
                }}
              >
                닫기
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
