import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatorStore } from '../../store/useCreatorStore';
import { useNegotiationProjectStore } from '../../store/useNegotiationProjectStore';
import { useBrandStore } from '../../store/useBrandStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import { getCreatorTemplateCSV, downloadCSV, readFileAsText, parseCSV, parseCreatorsFromCSV } from '../../lib/utils/excel';
import type { Creator, Project } from '../../types/negotiation';

// columnHelper를 컴포넌트 외부로 이동 (안정적인 참조 유지)
const columnHelper = createColumnHelper<Creator>();

// Creator 객체 생성 헬퍼
function createCompleteCreator(partial: {
  name: string;
  email: string;
  country: string;
  socialHandles: { tiktok: string; instagram: string; youtube: string };
  contactInfo: string;
  tags: string[];
  blacklisted: boolean;
  notes: string;
}): Creator {
  return {
    id: `creator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...partial,
    stats: {
      totalProjects: 0,
      completedProjects: 0,
      activeProjects: 0,
      droppedProjects: 0,
      totalEarnings: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function CreatorsPage() {
  const navigate = useNavigate();
  const { creators, addCreator } = useCreatorStore();
  const { addProject } = useNegotiationProjectStore();
  const { brands } = useBrandStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 새 크리에이터 폼
  const [newCreator, setNewCreator] = useState({
    name: '',
    email: '',
    country: '',
    tiktok: '',
    instagram: '',
    youtube: '',
    contactInfo: '',
    tags: '',
    notes: '',
  });

  // 새 프로젝트 폼
  const [newProject, setNewProject] = useState({
    projectName: '',
    brand: '',
    product: '',
    region: '',
    budget: '',
    targetDeliveryDate: '',
    notes: '',
  });

  // 샘플 데이터 추가
  const handleAddSampleData = () => {
    const sampleCreators = [
      createCompleteCreator({
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        country: 'United States',
        socialHandles: {
          tiktok: '@sarahjohnson',
          instagram: '@sarah_j_official',
          youtube: '@SarahJVlogs',
        },
        contactInfo: '+1-555-0123',
        tags: ['Fashion', 'Lifestyle', 'Beauty'],
        blacklisted: false,
        notes: 'Top fashion influencer with 2M+ followers',
      }),
      createCompleteCreator({
        name: 'Kim Min-ji',
        email: 'minji.kim@example.com',
        country: 'South Korea',
        socialHandles: {
          tiktok: '@minji_kim',
          instagram: '@minjikim_official',
          youtube: '@MinjiKimVlog',
        },
        contactInfo: '+82-10-1234-5678',
        tags: ['K-Beauty', 'Fashion', 'Food'],
        blacklisted: false,
        notes: 'Popular K-beauty and lifestyle creator',
      }),
      createCompleteCreator({
        name: 'Emma Wilson',
        email: 'emma.w@example.com',
        country: 'United Kingdom',
        socialHandles: {
          tiktok: '@emmawilson',
          instagram: '@emma.wilson',
          youtube: '@EmmaWilsonUK',
        },
        contactInfo: '+44-20-1234-5678',
        tags: ['Travel', 'Lifestyle', 'Photography'],
        blacklisted: false,
        notes: 'Travel and lifestyle content creator',
      }),
    ];

    sampleCreators.forEach(creator => addCreator(creator));
    alert('샘플 데이터 3개가 추가되었습니다!');
  };

  // 크리에이터 추가
  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const creator = createCompleteCreator({
      name: newCreator.name,
      email: newCreator.email,
      country: newCreator.country,
      socialHandles: {
        tiktok: newCreator.tiktok,
        instagram: newCreator.instagram,
        youtube: newCreator.youtube,
      },
      contactInfo: newCreator.contactInfo,
      tags: newCreator.tags.split(',').map(t => t.trim()).filter(Boolean),
      blacklisted: false,
      notes: newCreator.notes,
    });

    addCreator(creator);
    setIsAddModalOpen(false);
    setNewCreator({
      name: '',
      email: '',
      country: '',
      tiktok: '',
      instagram: '',
      youtube: '',
      contactInfo: '',
      tags: '',
      notes: '',
    });
  };

  // 프로젝트 시작 핸들러
  const handleStartProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCreator || !newProject.projectName || !newProject.brand) {
      alert('프로젝트명과 브랜드는 필수입니다.');
      return;
    }

    const project: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      creatorId: selectedCreator.id,
      creatorName: selectedCreator.name,
      creatorEmail: selectedCreator.email,
      category: {
        brand: newProject.brand as any, // 추후 브랜드 타입 개선 필요
        projectName: newProject.projectName,
        productLine: newProject.product,
        region: newProject.region,
      },
      contractType: 'single-video',
      status: 'email-sent',
      emailSent: true,
      emailSentAt: new Date().toISOString(),
      responseReceived: false,
      lastUpdatedAt: new Date().toISOString(),
      needsAttention: false,
      negotiationHistory: [],
      initialOffer: {
        amount: 0,
        currency: 'USD',
        videoCount: 1,
        conditions: newProject.notes || '',
      },
      draftCount: 0,
      publishedVideos: [],
      assignedTo: '',
      assignedToName: '',
      teamLocation: 'korea',
      unreadCommentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(project);
    setIsProjectModalOpen(false);
    setNewProject({
      projectName: '',
      brand: '',
      product: '',
      region: '',
      budget: '',
      targetDeliveryDate: '',
      notes: '',
    });

    // Response Tracking 페이지로 이동
    navigate('/negotiation/response-tracking');
  };

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    const template = getCreatorTemplateCSV();
    downloadCSV(template, 'creator_template.csv');
  };

  // 엑셀 업로드
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const parsedData = parseCSV(text);
      const parsedCreators = parseCreatorsFromCSV(parsedData);
      
      // 완전한 Creator 객체로 변환
      const completeCreators = parsedCreators.map(partial => 
        createCompleteCreator({
          name: partial.name,
          email: partial.email,
          country: partial.country,
          socialHandles: {
            tiktok: partial.socialHandles?.tiktok || '',
            instagram: partial.socialHandles?.instagram || '',
            youtube: partial.socialHandles?.youtube || '',
          },
          contactInfo: partial.contactInfo,
          tags: partial.tags,
          blacklisted: false,
          notes: partial.notes || '',
        })
      );
      
      completeCreators.forEach(creator => addCreator(creator));
      setIsExcelModalOpen(false);
      alert(`${completeCreators.length}명의 크리에이터가 추가되었습니다!`);
    } catch (error) {
      console.error('Error importing creators:', error);
      alert('크리에이터 데이터를 가져오는 중 오류가 발생했습니다.');
    }
  };

  // 테이블 컬럼 정의 (columnHelper는 이제 컴포넌트 외부에 있음)
  const columns = React.useMemo<any[]>(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedCreator(info.row.original);
              setIsDetailModalOpen(true);
            }}
            className="text-blue-400 hover:underline font-medium"
          >
            {info.getValue()}
          </button>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedCreator(info.row.original);
            setIsProjectModalOpen(true);
          }}
        >
          🚀 프로젝트 시작
        </Button>
      ),
    }),
    columnHelper.accessor('country', {
      header: 'Country',
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'socialMedia',
      header: 'Social Media',
      cell: (info) => {
        const handles = info.row.original.socialHandles;
        return (
          <div className="flex gap-2">
            {handles.tiktok && <Badge variant="default">TikTok</Badge>}
            {handles.instagram && <Badge variant="default">IG</Badge>}
            {handles.youtube && <Badge variant="default">YT</Badge>}
          </div>
        );
      },
    }),
    columnHelper.accessor('tags', {
      header: 'Tags',
      cell: (info) => (
        <div className="flex gap-1 flex-wrap">
          {info.getValue().slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary">{tag}</Badge>
          ))}
          {info.getValue().length > 3 && (
            <Badge variant="secondary">+{info.getValue().length - 3}</Badge>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'stats',
      header: 'Stats',
      cell: (info) => {
        const stats = info.row.original.stats;
        return (
          <div className="text-sm text-gray-600">
            <div>프로젝트: {stats.activeProjects} / {stats.totalProjects}</div>
            <div>완료: {stats.completedProjects}</div>
          </div>
        );
      },
    }),
  ], []);

  // 검색 필터링
  const filteredCreators = creators.filter(creator => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      creator.name.toLowerCase().includes(query) ||
      creator.email.toLowerCase().includes(query) ||
      creator.country.toLowerCase().includes(query) ||
      creator.tags.some(tag => tag.toLowerCase().includes(query)) ||
      creator.socialHandles.tiktok.toLowerCase().includes(query) ||
      creator.socialHandles.instagram.toLowerCase().includes(query) ||
      creator.socialHandles.youtube.toLowerCase().includes(query)
    );
  });

  const tableState = useTableState();
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

  // Stats 계산
  const stats = {
    totalCreators: creators.length,
    activeProjects: creators.reduce((sum, c) => sum + c.stats.activeProjects, 0),
    completedProjects: creators.reduce((sum, c) => sum + c.stats.completedProjects, 0),
    totalEarnings: creators.reduce((sum, c) => sum + c.stats.totalEarnings, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">크리에이터 관리</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddSampleData} variant="outline">
            샘플 데이터 추가
          </Button>
          <Button onClick={() => setIsExcelModalOpen(true)} variant="outline">
            엑셀 업로드
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            + 크리에이터 추가
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
        <Input
          type="text"
          placeholder="🔍 크리에이터 검색 (이름, 이메일, 국가, 태그, 소셜미디어...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-400">
            {filteredCreators.length}명의 크리에이터가 검색되었습니다
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-2">Total Creators</div>
          <div className="text-3xl font-bold text-white">{stats.totalCreators}</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-2">Active Projects</div>
          <div className="text-3xl font-bold text-white">{stats.activeProjects}</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-2">Completed Projects</div>
          <div className="text-3xl font-bold text-white">{stats.completedProjects}</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-2">Total Earnings</div>
          <div className="text-3xl font-bold text-green-400">${stats.totalEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        {creators.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            크리에이터 데이터가 없습니다. 샘플 데이터를 추가하거나 새로운 크리에이터를 추가해주세요.
          </div>
        ) : (
          <DataTable table={table} />
        )}
      </div>

      {/* Add Creator Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="크리에이터 추가"
      >
        <form onSubmit={handleAddCreator} className="space-y-4">
          <Input
            label="Name"
            value={newCreator.name}
            onChange={(e) => setNewCreator({ ...newCreator, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={newCreator.email}
            onChange={(e) => setNewCreator({ ...newCreator, email: e.target.value })}
            required
          />
          <Input
            label="Country"
            value={newCreator.country}
            onChange={(e) => setNewCreator({ ...newCreator, country: e.target.value })}
            required
          />
          <Input
            label="TikTok Handle"
            value={newCreator.tiktok}
            onChange={(e) => setNewCreator({ ...newCreator, tiktok: e.target.value })}
          />
          <Input
            label="Instagram Handle"
            value={newCreator.instagram}
            onChange={(e) => setNewCreator({ ...newCreator, instagram: e.target.value })}
          />
          <Input
            label="YouTube Handle"
            value={newCreator.youtube}
            onChange={(e) => setNewCreator({ ...newCreator, youtube: e.target.value })}
          />
          <Input
            label="Contact Info"
            value={newCreator.contactInfo}
            onChange={(e) => setNewCreator({ ...newCreator, contactInfo: e.target.value })}
          />
          <Input
            label="Tags (comma separated)"
            value={newCreator.tags}
            onChange={(e) => setNewCreator({ ...newCreator, tags: e.target.value })}
            placeholder="Fashion, Beauty, Lifestyle"
          />
          <Input
            label="Notes"
            value={newCreator.notes}
            onChange={(e) => setNewCreator({ ...newCreator, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>

      {/* Excel Upload Modal */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="엑셀 업로드"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            CSV 파일을 업로드하여 크리에이터를 일괄 추가할 수 있습니다.
          </p>
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
            템플릿 다운로드
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleExcelUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      </Modal>

      {/* Creator Detail Modal */}
      {selectedCreator && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCreator(null);
          }}
          title={selectedCreator.name}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Contact Info</h3>
              <p className="text-sm text-gray-600">Email: {selectedCreator.email}</p>
              <p className="text-sm text-gray-600">Phone: {selectedCreator.contactInfo}</p>
              <p className="text-sm text-gray-600">Country: {selectedCreator.country}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Social Media</h3>
              <div className="space-y-1">
                {selectedCreator.socialHandles.tiktok && (
                  <p className="text-sm text-gray-600">TikTok: {selectedCreator.socialHandles.tiktok}</p>
                )}
                {selectedCreator.socialHandles.instagram && (
                  <p className="text-sm text-gray-600">Instagram: {selectedCreator.socialHandles.instagram}</p>
                )}
                {selectedCreator.socialHandles.youtube && (
                  <p className="text-sm text-gray-600">YouTube: {selectedCreator.socialHandles.youtube}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Stats</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Total Projects:</span>{' '}
                  <span className="font-medium">{selectedCreator.stats.totalProjects}</span>
                </div>
                <div>
                  <span className="text-gray-600">Active:</span>{' '}
                  <span className="font-medium">{selectedCreator.stats.activeProjects}</span>
                </div>
                <div>
                  <span className="text-gray-600">Completed:</span>{' '}
                  <span className="font-medium">{selectedCreator.stats.completedProjects}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dropped:</span>{' '}
                  <span className="font-medium">{selectedCreator.stats.droppedProjects}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Total Earnings:</span>{' '}
                  <span className="font-medium">\${selectedCreator.stats.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex gap-1 flex-wrap">
                {selectedCreator.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            {selectedCreator.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{selectedCreator.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 프로젝트 시작 모달 */}
      {selectedCreator && (
        <Modal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setSelectedCreator(null);
            setNewProject({
              projectName: '',
              brand: '',
              product: '',
              region: '',
              budget: '',
              targetDeliveryDate: '',
              notes: '',
            });
          }}
          title={`🚀 ${selectedCreator.name}과 프로젝트 시작`}
        >
          <form onSubmit={handleStartProject} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">👤</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedCreator.name}</h4>
                  <p className="text-sm text-gray-600">{selectedCreator.email}</p>
                  <div className="flex gap-2 mt-1">
                    {selectedCreator.socialHandles.tiktok && <Badge>TikTok</Badge>}
                    {selectedCreator.socialHandles.instagram && <Badge>IG</Badge>}
                    {selectedCreator.socialHandles.youtube && <Badge>YT</Badge>}
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="프로젝트명 *"
              placeholder="예: 2024 크리스마스 캠페인"
              value={newProject.projectName}
              onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
              required
            />

            <Select
              label="브랜드 *"
              value={newProject.brand}
              onChange={(e) => setNewProject({ ...newProject, brand: e.target.value })}
              options={[
                { value: '', label: '브랜드 선택' },
                ...brands.map(brand => ({ value: brand, label: brand })),
              ]}
              required
            />

            <Input
              label="제품/제품군"
              placeholder="예: 선크림, 립스틱"
              value={newProject.product}
              onChange={(e) => setNewProject({ ...newProject, product: e.target.value })}
            />

            <Input
              label="지역"
              placeholder="예: US, EU, Asia"
              value={newProject.region}
              onChange={(e) => setNewProject({ ...newProject, region: e.target.value })}
            />

            <Input
              label="예산 (USD)"
              type="number"
              placeholder="예: 5000"
              value={newProject.budget}
              onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
            />

            <Input
              label="목표 납품일"
              type="date"
              value={newProject.targetDeliveryDate}
              onChange={(e) => setNewProject({ ...newProject, targetDeliveryDate: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="초기 제안 조건, 특이사항 등..."
                value={newProject.notes}
                onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                💡 프로젝트를 생성하면 자동으로 "Email Sent" 상태로 Response Tracking 페이지에 추가됩니다.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsProjectModalOpen(false);
                  setSelectedCreator(null);
                }}
              >
                취소
              </Button>
              <Button type="submit">
                🚀 프로젝트 시작
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
