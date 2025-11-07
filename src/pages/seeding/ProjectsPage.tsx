import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeedingProjectStore } from '../../store/useSeedingProjectStore';
import { useSeedingBrandStore } from '../../store/useSeedingBrandStore';
import { useSeedingCreatorStore } from '../../store/useSeedingCreatorStore';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Select';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import { creatorsToCSV, downloadCSV } from '../../lib/utils/seedingCsv';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import type { Project, Brand, Creator } from '../../types/seeding';
import type { AppUser } from '../../types';

const columnHelper = createColumnHelper<Project>();

/**
 * Seeding System - Projects Page
 * 
 * 브랜드/프로젝트 등록 및 크리에이터 선정
 */
export function SeedingProjectsPage() {
  const navigate = useNavigate();
  const { projects, setProjects, addProject, updateProject, deleteProject, addCreatorToProject, removeCreatorFromProject, addAssignee, removeAssignee, updateEmailTemplates } = useSeedingProjectStore();
  const { brands, setBrands } = useSeedingBrandStore();
  const { creators, setCreators } = useSeedingCreatorStore();
  
  // Firebase 실시간 동기화
  useRealtimeCollection<Project>('seeding-projects', setProjects);
  useRealtimeCollection<Brand>('seeding-brands', setBrands);
  useRealtimeCollection<Creator>('seeding-creators', setCreators);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  
  // 모달 상태
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isSelectCreatorsModalOpen, setIsSelectCreatorsModalOpen] = useState(false);
  const [isManageAssigneesModalOpen, setIsManageAssigneesModalOpen] = useState(false);
  const [isEmailTemplatesModalOpen, setIsEmailTemplatesModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // 폼 상태
  const [newProject, setNewProject] = useState({
    name: '',
    brandId: '',
    description: '',
    notes: '',
  });
  
  // 크리에이터 선택 상태
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [creatorCategoryFilter, setCreatorCategoryFilter] = useState<string>('all');
  
  // 담당자 관리 상태
  const [assigneeInput, setAssigneeInput] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 이메일 템플릿 상태
  const [emailTemplates, setEmailTemplates] = useState<Array<{
    id: string;
    name: string;
    subject: string;
    body: string;
  }>>([]);

  // Firestore에서 가입된 유저 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as AppUser[];
        setRegisteredUsers(usersList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // 필터링된 크리에이터 (선택 모달용)
  const filteredCreatorsForSelection = useMemo(() => {
    return creators.filter((c) => {
      // 카테고리 필터
      const matchesCategory = creatorCategoryFilter === 'all' || 
        (c.category || '미분류') === creatorCategoryFilter;
      
      // 검색어 필터
      const matchesSearch = !creatorSearchQuery || 
        c.userId.toLowerCase().includes(creatorSearchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(creatorSearchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [creators, creatorSearchQuery, creatorCategoryFilter]);

  // 프로젝트 테이블 컬럼
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Project Name',
      cell: (info) => (
        <button
          onClick={() => handleOpenEmailTemplates(info.row.original)}
          className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer text-left"
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor('brandName', {
      header: 'Brand',
      cell: (info) => (
        <Badge variant="secondary">{info.getValue()}</Badge>
      ),
    }),
    columnHelper.accessor('selectedCreators', {
      header: 'Creators',
      cell: (info) => (
        <span className="text-cyan-400 font-semibold">
          {info.getValue().length}명
        </span>
      ),
    }),
    columnHelper.accessor('assignees', {
      header: 'Assignees',
      cell: (info) => {
        const assignees = info.getValue() || [];
        return (
          <span className="text-purple-400 font-semibold">
            {assignees.length > 0 ? `${assignees.length}명` : '-'}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const statusColors: Record<string, string> = {
          setup: 'bg-gray-600',
          'reach-out': 'bg-blue-600',
          'response-received': 'bg-yellow-600',
          negotiating: 'bg-purple-600',
          'tracking-sent': 'bg-orange-600',
          'content-production': 'bg-pink-600',
          review: 'bg-indigo-600',
          'payment-pending': 'bg-emerald-600',
          completed: 'bg-green-600',
          dropped: 'bg-red-600',
        };
        return (
          <span className={`px-2 py-1 rounded text-xs text-white ${statusColors[status] || 'bg-gray-600'}`}>
            {status}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const isCompleted = info.row.original.status === 'completed';
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedProject(info.row.original);
                setSelectedCreatorIds(info.row.original.selectedCreators);
                setIsSelectCreatorsModalOpen(true);
              }}
              disabled={isCompleted}
            >
              크리에이터 관리
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedProject(info.row.original);
                setSelectedAssignees(info.row.original.assignees || []);
                setIsManageAssigneesModalOpen(true);
              }}
              disabled={isCompleted}
            >
              담당자 관리
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                // 프로젝트의 크리에이터 목록 CSV 다운로드
                const projectCreators = creators.filter(c => 
                  info.row.original.selectedCreators.includes(c.id)
                );
                if (projectCreators.length === 0) {
                  alert('선택된 크리에이터가 없습니다.');
                  return;
                }
                const csv = creatorsToCSV(projectCreators);
                downloadCSV(csv, `${info.row.original.name}-creators-${new Date().toISOString().split('T')[0]}.csv`);
              }}
              disabled={info.row.original.selectedCreators.length === 0}
            >
              CSV 다운로드
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                // Reach-out 페이지로 이동 (프로젝트 ID를 쿼리로 전달)
                navigate(`/seeding/reach-out?project=${info.row.original.id}`);
              }}
              disabled={info.row.original.selectedCreators.length === 0 || isCompleted}
            >
              연락 시작
            </Button>
            {isCompleted ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (confirm(`${info.row.original.name}의 완료 상태를 취소하시겠습니까?`)) {
                    updateProject(info.row.original.id, { status: 'payment-pending' });
                  }
                }}
              >
                완료 취소
              </Button>
            ) : (
              <Button
                size="sm"
                variant="success"
                onClick={() => {
                  if (confirm(`${info.row.original.name}을(를) 완료 처리하시겠습니까?`)) {
                    updateProject(info.row.original.id, { status: 'completed' });
                  }
                }}
              >
                ✓ 완료
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm(`${info.row.original.name}을(를) 삭제하시겠습니까?`)) {
                  deleteProject(info.row.original.id);
                }
              }}
            >
              삭제
            </Button>
          </div>
        );
      },
    }),
  ], [deleteProject]);

  // 탭에 따라 프로젝트 필터링
  const filteredProjects = useMemo(() => {
    if (activeTab === 'completed') {
      return projects.filter(p => p.status === 'completed');
    }
    return projects.filter(p => p.status !== 'completed');
  }, [projects, activeTab]);

  const tableState = useTableState({
    initialSorting: [{ id: 'updatedAt', desc: true }],
  });
  const table = useReactTable({
    data: filteredProjects,
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

  // 프로젝트 추가
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.brandId) {
      alert('프로젝트명과 브랜드를 선택하세요.');
      return;
    }

    const brand = brands.find((b) => b.id === newProject.brandId);
    if (!brand) {
      alert('브랜드를 찾을 수 없습니다.');
      return;
    }

    const project: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newProject.name,
      brandId: newProject.brandId,
      brandName: brand.name,
      status: 'setup',
      selectedCreators: [],
      assignees: [], // 초기 담당자 없음
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: newProject.description || undefined,
      notes: newProject.notes || undefined,
    };

    addProject(project);
    setIsAddProjectModalOpen(false);
    setNewProject({ name: '', brandId: '', description: '', notes: '' });
  };

  // 크리에이터 선택 저장
  const handleSaveCreators = () => {
    if (!selectedProject) return;

    const currentCreators = selectedProject.selectedCreators;
    const newCreators = selectedCreatorIds;

    // 추가할 크리에이터
    const toAdd = newCreators.filter((id) => !currentCreators.includes(id));
    // 제거할 크리에이터
    const toRemove = currentCreators.filter((id) => !newCreators.includes(id));

    toAdd.forEach((creatorId) => {
      addCreatorToProject(selectedProject.id, creatorId);
    });

    toRemove.forEach((creatorId) => {
      removeCreatorFromProject(selectedProject.id, creatorId);
    });

    setIsSelectCreatorsModalOpen(false);
    setSelectedProject(null);
    setSelectedCreatorIds([]);
    setCreatorSearchQuery('');
    setCreatorCategoryFilter('all');
  };

  // 크리에이터 선택 토글
  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreatorIds((prev) =>
      prev.includes(creatorId)
        ? prev.filter((id) => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const allFilteredIds = filteredCreatorsForSelection.map(c => c.id);
    const allSelected = allFilteredIds.every(id => selectedCreatorIds.includes(id));
    
    if (allSelected) {
      // 전체 해제: 현재 필터된 크리에이터들만 제거
      setSelectedCreatorIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // 전체 선택: 현재 필터된 크리에이터들 추가 (중복 제거)
      setSelectedCreatorIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  // 담당자 추가
  const handleAddAssignee = () => {
    if (!selectedProject || !assigneeInput.trim()) return;
    
    // 이메일 형식 간단 검증
    if (!assigneeInput.includes('@')) {
      alert('올바른 이메일 형식을 입력하세요.');
      return;
    }
    
    if (selectedAssignees.includes(assigneeInput.trim())) {
      alert('이미 추가된 담당자입니다.');
      return;
    }
    
    setSelectedAssignees([...selectedAssignees, assigneeInput.trim()]);
    setAssigneeInput('');
  };

  // 담당자 제거
  const handleRemoveAssignee = (email: string) => {
    setSelectedAssignees(selectedAssignees.filter(e => e !== email));
  };

  // 이메일 템플릿 모달 열기
  const handleOpenEmailTemplates = (project: Project) => {
    setSelectedProject(project);
    // 기존 템플릿 로드 또는 빈 템플릿 3개 생성
    const existingTemplates = project.emailTemplates || [];
    const templates = [
      existingTemplates[0] || { id: '1', name: '템플릿 1', subject: '', body: '' },
      existingTemplates[1] || { id: '2', name: '템플릿 2', subject: '', body: '' },
      existingTemplates[2] || { id: '3', name: '템플릿 3', subject: '', body: '' },
    ];
    setEmailTemplates(templates);
    setIsEmailTemplatesModalOpen(true);
  };

  // 텍스트 복사하기
  const handleCopyTemplate = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다!`);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('복사에 실패했습니다.');
    }
  };

  // 이메일 템플릿 저장
  const handleSaveEmailTemplates = () => {
    if (!selectedProject) return;

    const templates = emailTemplates.map((t) => ({
      ...t,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    updateEmailTemplates(selectedProject.id, templates);
    setIsEmailTemplatesModalOpen(false);
    setSelectedProject(null);
    setEmailTemplates([]);
  };

  // 담당자 저장
  const handleSaveAssignees = () => {
    if (!selectedProject) return;

    const currentAssignees = selectedProject.assignees || [];
    const newAssignees = selectedAssignees;

    // 추가할 담당자
    const toAdd = newAssignees.filter((email) => !currentAssignees.includes(email));
    // 제거할 담당자
    const toRemove = currentAssignees.filter((email) => !newAssignees.includes(email));

    toAdd.forEach((email) => {
      addAssignee(selectedProject.id, email);
    });

    toRemove.forEach((email) => {
      removeAssignee(selectedProject.id, email);
    });

    setIsManageAssigneesModalOpen(false);
    setSelectedProject(null);
    setSelectedAssignees([]);
    setAssigneeInput('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Projects Management
        </h1>
        <p className="text-gray-400">
          브랜드와 프로젝트를 등록하고 크리에이터를 선정합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Brands</div>
          <div className="text-3xl font-bold text-white">{brands.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Projects</div>
          <div className="text-3xl font-bold text-purple-400">{projects.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Active Projects</div>
          <div className="text-3xl font-bold text-blue-400">
            {projects.filter((p) => p.status !== 'completed' && p.status !== 'dropped').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Total Creators Selected</div>
          <div className="text-3xl font-bold text-green-400">
            {projects.reduce((sum, p) => sum + p.selectedCreators.length, 0)}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setIsAddProjectModalOpen(true)}>
          프로젝트 추가
        </Button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'active'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          진행중 프로젝트 ({projects.filter(p => p.status !== 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'completed'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          완료된 프로젝트 ({projects.filter(p => p.status === 'completed').length})
        </button>
      </div>

      {/* 프로젝트 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <DataTable table={table} />
      </div>

      {/* 프로젝트 추가 모달 */}
      <Modal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        title="프로젝트 추가"
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <Input
            label="프로젝트명 *"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="프로젝트명 입력"
            required
          />
          <Select
            label="브랜드 *"
            value={newProject.brandId}
            onChange={(e) => setNewProject({ ...newProject, brandId: e.target.value })}
            options={[
              { value: '', label: '브랜드 선택' },
              ...brands.map((brand) => ({ value: brand.id, label: brand.name })),
            ]}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="프로젝트 설명..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              메모
            </label>
            <textarea
              value={newProject.notes}
              onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
              placeholder="추가 메모..."
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddProjectModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">추가하기</Button>
          </div>
        </form>
      </Modal>

      {/* 크리에이터 선택 모달 */}
      {selectedProject && (
        <Modal
          isOpen={isSelectCreatorsModalOpen}
          onClose={() => {
            setIsSelectCreatorsModalOpen(false);
            setSelectedProject(null);
            setSelectedCreatorIds([]);
            setCreatorSearchQuery('');
            setCreatorCategoryFilter('all');
          }}
          title={`${selectedProject.name} - 크리에이터 선정`}
        >
          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                선택된 크리에이터: <span className="text-cyan-400 font-semibold">{selectedCreatorIds.length}명</span>
                {' / '}
                필터된 크리에이터: <span className="text-purple-400 font-semibold">{filteredCreatorsForSelection.length}명</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  카테고리 필터
                </label>
                <select
                  value={creatorCategoryFilter}
                  onChange={(e) => setCreatorCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">전체 ({creators.length})</option>
                  <option value="뷰티">뷰티 ({creators.filter(c => (c.category || '미분류') === '뷰티').length})</option>
                  <option value="헤어">헤어 ({creators.filter(c => (c.category || '미분류') === '헤어').length})</option>
                  <option value="푸드">푸드 ({creators.filter(c => (c.category || '미분류') === '푸드').length})</option>
                  <option value="Health">Health ({creators.filter(c => (c.category || '미분류') === 'Health').length})</option>
                  <option value="Diet">Diet ({creators.filter(c => (c.category || '미분류') === 'Diet').length})</option>
                  <option value="Lifestyle">Lifestyle ({creators.filter(c => (c.category || '미분류') === 'Lifestyle').length})</option>
                  <option value="Vlog">Vlog ({creators.filter(c => (c.category || '미분류') === 'Vlog').length})</option>
                  <option value="미분류">미분류 ({creators.filter(c => (c.category || '미분류') === '미분류').length})</option>
                </select>
              </div>

              <Input
                label="크리에이터 검색"
                value={creatorSearchQuery}
                onChange={(e) => setCreatorSearchQuery(e.target.value)}
                placeholder="User ID 또는 Email 검색..."
              />
            </div>

            {/* 전체 선택/해제 */}
            {filteredCreatorsForSelection.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <input
                  type="checkbox"
                  checked={
                    filteredCreatorsForSelection.length > 0 &&
                    filteredCreatorsForSelection.every(c => selectedCreatorIds.includes(c.id))
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
                <label className="font-medium text-white cursor-pointer" onClick={toggleSelectAll}>
                  전체 선택/해제 ({filteredCreatorsForSelection.length}명)
                </label>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredCreatorsForSelection.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  크리에이터가 없습니다. 먼저 크리에이터를 등록하세요.
                </p>
              )}
              {filteredCreatorsForSelection.map((creator) => (
                <label
                  key={creator.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCreatorIds.includes(creator.id)
                      ? 'bg-cyan-900/30 border-cyan-600'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCreatorIds.includes(creator.id)}
                    onChange={() => toggleCreatorSelection(creator.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{creator.userId}</span>
                      <Badge variant="primary" className="text-xs">
                        {creator.category || '미분류'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-400">{creator.email}</div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {(creator.followers / 1000).toFixed(1)}K followers
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsSelectCreatorsModalOpen(false);
                  setSelectedProject(null);
                  setSelectedCreatorIds([]);
                  setCreatorSearchQuery('');
                  setCreatorCategoryFilter('all');
                }}
              >
                취소
              </Button>
              <Button onClick={handleSaveCreators}>
                저장
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 담당자 관리 모달 */}
      {isManageAssigneesModalOpen && selectedProject && (
        <Modal
          isOpen={isManageAssigneesModalOpen}
          onClose={() => {
            setIsManageAssigneesModalOpen(false);
            setSelectedProject(null);
            setSelectedAssignees([]);
            setAssigneeInput('');
          }}
          title={`담당자 관리 - ${selectedProject.name}`}
        >
          <div className="space-y-6">
            {/* 가입된 유저 목록에서 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                가입된 사용자 목록
              </label>
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-400">
                  사용자 목록 로딩 중...
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-700 rounded-lg p-3 bg-gray-800">
                  {registeredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      등록된 사용자가 없습니다.
                    </p>
                  ) : (
                    registeredUsers.map((user) => {
                      const isAlreadyAssigned = selectedAssignees.includes(user.email || '');
                      return (
                        <label
                          key={user.uid}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isAlreadyAssigned
                              ? 'bg-cyan-900/30 border-cyan-600 cursor-not-allowed'
                              : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAlreadyAssigned}
                            onChange={() => {
                              if (!isAlreadyAssigned && user.email) {
                                setSelectedAssignees([...selectedAssignees, user.email]);
                              }
                            }}
                            disabled={isAlreadyAssigned}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{user.email}</span>
                              {user.role && (
                                <Badge variant={user.role === 'admin' ? 'success' : 'default'} className="text-xs">
                                  {user.role}
                                </Badge>
                              )}
                            </div>
                            {user.status && (
                              <div className="text-xs text-gray-400">
                                상태: {user.status}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* 또는 직접 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                또는 직접 이메일 입력
              </label>
              <div className="flex flex-row gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={assigneeInput}
                    onChange={(e) => setAssigneeInput(e.target.value)}
                    placeholder="user@example.com"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAssignee();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddAssignee} className="whitespace-nowrap flex-shrink-0">
                  추가
                </Button>
              </div>
            </div>

            {/* 현재 담당자 목록 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                현재 담당자 ({selectedAssignees.length}명)
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedAssignees.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    담당자가 없습니다. 이메일을 추가하세요.
                  </p>
                ) : (
                  selectedAssignees.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                    >
                      <span className="text-white">{email}</span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveAssignee(email)}
                      >
                        제거
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsManageAssigneesModalOpen(false);
                  setSelectedProject(null);
                  setSelectedAssignees([]);
                  setAssigneeInput('');
                }}
              >
                취소
              </Button>
              <Button onClick={handleSaveAssignees}>
                저장
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 이메일 템플릿 모달 */}
      {isEmailTemplatesModalOpen && selectedProject && (
        <Modal
          isOpen={isEmailTemplatesModalOpen}
          onClose={() => {
            setIsEmailTemplatesModalOpen(false);
            setSelectedProject(null);
            setEmailTemplates([]);
          }}
          title={`이메일 템플릿 관리 - ${selectedProject.name}`}
        >
          <div className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <span className="font-semibold">본사 전용:</span> PH팀에서 사용할 이메일 템플릿을 최대 3개까지 작성할 수 있습니다.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                템플릿은 크리에이터에게 발송할 이메일의 양식으로 사용됩니다.
              </p>
            </div>

            {emailTemplates.map((template, index) => (
              <div key={template.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">템플릿 {index + 1}</h4>
                  <Badge variant={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}>
                    {template.name}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        이메일 제목
                      </label>
                      {template.subject && (
                        <button
                          onClick={() => handleCopyTemplate(template.subject, '제목이')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>📋</span> 복사
                        </button>
                      )}
                    </div>
                    <Input
                      value={template.subject}
                      onChange={(e) => {
                        const updated = [...emailTemplates];
                        updated[index] = { ...updated[index], subject: e.target.value };
                        setEmailTemplates(updated);
                      }}
                      placeholder="예: [브랜드명] 협업 제안"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        이메일 본문
                      </label>
                      {template.body && (
                        <button
                          onClick={() => handleCopyTemplate(template.body, '본문이')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>📋</span> 복사
                        </button>
                      )}
                    </div>
                    <textarea
                      value={template.body}
                      onChange={(e) => {
                        const updated = [...emailTemplates];
                        updated[index] = { ...updated[index], body: e.target.value };
                        setEmailTemplates(updated);
                      }}
                      placeholder="안녕하세요,&#10;&#10;[브랜드명]과(와) 협업을 제안드리고자 연락드립니다...&#10;&#10;감사합니다."
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: [브랜드명], [크리에이터명] 등의 변수를 사용하면 발송 시 자동으로 치환됩니다.
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* 템플릿 통계 */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {emailTemplates.map((template, idx) => (
                  <div key={idx}>
                    <div className="text-xs text-gray-400 mb-1">템플릿 {idx + 1}</div>
                    <div className={`text-sm font-semibold ${
                      template.subject && template.body 
                        ? 'text-green-400' 
                        : 'text-gray-500'
                    }`}>
                      {template.subject && template.body ? '✓ 작성완료' : '미작성'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEmailTemplatesModalOpen(false);
                  setSelectedProject(null);
                  setEmailTemplates([]);
                }}
              >
                취소
              </Button>
              <Button onClick={handleSaveEmailTemplates}>
                저장
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
