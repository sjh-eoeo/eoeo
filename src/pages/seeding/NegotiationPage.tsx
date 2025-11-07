import { useState, useMemo, useEffect } from 'react';
import { useSeedingProjectStore } from '../../store/useSeedingProjectStore';
import { useSeedingCreatorStore } from '../../store/useSeedingCreatorStore';
import { useSeedingReachOutStore } from '../../store/useSeedingReachOutStore';
import { useSeedingNegotiationStore } from '../../store/useSeedingNegotiationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLastViewedStore } from '../../store/useLastViewedStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { formatNumber, formatCurrency } from '../../lib/utils/seedingCsv';
import { getRecentUpdateClass } from '../../lib/utils/highlight';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import type { Negotiation, ChatMessage, ReachOut } from '../../types/seeding';

const columnHelper = createColumnHelper<ReachOut>();

// 지원 플랫폼 목록
const AVAILABLE_PLATFORMS = [
  'TikTok',
  'Instagram',
  'YouTube',
  'Twitter',
  'Reddit',
  'Facebook',
] as const;

export function SeedingNegotiationPage() {
  const { appUser } = useAuthStore();
  const { projects } = useSeedingProjectStore();
  const { creators } = useSeedingCreatorStore();
  const { reachOuts } = useSeedingReachOutStore();
  const { negotiations, addNegotiation, updateTerms, addMessage, setTrackingNumber, completeNegotiation } = useSeedingNegotiationStore();
  const { lastViewed, markAsViewed, getLastViewed } = useLastViewedStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<string>('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isCreatorDetailModalOpen, setIsCreatorDetailModalOpen] = useState(false);

  // 선택된 프로젝트의 interested 크리에이터들 (협상 업데이트 시간 기준 정렬)
  const interestedReachOuts = useMemo(() => {
    if (!selectedProjectId) return [];
    const filtered = reachOuts.filter(ro => ro.projectId === selectedProjectId && ro.status === 'interested');
    
    // 협상의 updatedAt 기준으로 정렬
    return filtered.sort((a, b) => {
      const negotiationA = negotiations.find(n => n.projectId === selectedProjectId && n.creatorId === a.creatorId);
      const negotiationB = negotiations.find(n => n.projectId === selectedProjectId && n.creatorId === b.creatorId);
      
      const timeA = negotiationA?.updatedAt ? new Date(negotiationA.updatedAt).getTime() : 0;
      const timeB = negotiationB?.updatedAt ? new Date(negotiationB.updatedAt).getTime() : 0;
      
      return timeB - timeA; // 최신순 (내림차순)
    });
  }, [selectedProjectId, reachOuts, negotiations]);

  // 선택된 협상
  const selectedNegotiation = useMemo(() => {
    return negotiations.find(n => n.id === selectedNegotiationId);
  }, [selectedNegotiationId, negotiations]);

  // 선택된 협상의 크리에이터 정보
  const selectedCreator = useMemo(() => {
    if (!selectedNegotiation) return null;
    return creators.find(c => c.id === selectedNegotiation.creatorId);
  }, [selectedNegotiation, creators]);

  // 크리에이터 선택 시 협상 생성 또는 선택
  const handleSelectCreator = (reachOut: ReachOut) => {
    // 이미 협상이 존재하는지 확인
    let negotiation = negotiations.find(
      n => n.projectId === selectedProjectId && n.creatorId === reachOut.creatorId
    );

    // 없으면 새로 생성
    if (!negotiation) {
      const newNegotiation: Negotiation = {
        id: `neg_${Date.now()}_${reachOut.creatorId}`,
        projectId: selectedProjectId,
        creatorId: reachOut.creatorId,
        creatorUserId: reachOut.creatorUserId,
        creatorEmail: reachOut.creatorEmail,
        status: 'negotiating',
        messages: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addNegotiation(newNegotiation);
      setSelectedNegotiationId(newNegotiation.id);
    } else {
      setSelectedNegotiationId(negotiation.id);
    }
    setIsEditingTerms(false);
  };

  // 폼 상태
  const [termsForm, setTermsForm] = useState({
    videoCount: '',
    amount: '',
    platforms: [] as string[],
    scriptLink: '',
    sparkleCode: false,
    contractStartDate: '',
    contractEndDate: '',
    contentReuseAllowed: false,
    paymentMethod: 'bank-transfer' as 'bank-transfer' | 'paypal',
    bankName: '',
    accountNumber: '',
    paypalInfo: '',
  });

  // 선택된 협상이 변경되면 폼 초기화
  useEffect(() => {
    if (selectedNegotiation && selectedNegotiation.terms) {
      // Parse contract period if it exists (format: "YYYY-MM-DD ~ YYYY-MM-DD")
      let startDate = '';
      let endDate = '';
      if (selectedNegotiation.terms.contractPeriod) {
        const dates = selectedNegotiation.terms.contractPeriod.split('~').map(d => d.trim());
        if (dates.length === 2) {
          startDate = dates[0];
          endDate = dates[1];
        }
      }

      // Parse payment info
      let method: 'bank-transfer' | 'paypal' = 'bank-transfer';
      let bank = '';
      let account = '';
      let paypal = '';
      
      if (selectedNegotiation.terms.paymentMethod) {
        const paymentInfo = selectedNegotiation.terms.paymentMethod;
        if (paymentInfo.includes('PayPal:')) {
          method = 'paypal';
          paypal = paymentInfo.replace('PayPal:', '').trim();
        } else if (paymentInfo.includes('Bank:')) {
          method = 'bank-transfer';
          const parts = paymentInfo.split('|');
          if (parts.length >= 2) {
            bank = parts[0].replace('Bank:', '').trim();
            account = parts[1].replace('Account:', '').trim();
          }
        }
      }

      setTermsForm({
        videoCount: selectedNegotiation.terms.videoCount?.toString() || '',
        amount: selectedNegotiation.terms.amount?.toString() || '',
        platforms: selectedNegotiation.terms.uploadPlatforms || [],
        scriptLink: selectedNegotiation.terms.videoScript || '',
        sparkleCode: !!selectedNegotiation.terms.sparkleCode,
        contractStartDate: startDate,
        contractEndDate: endDate,
        contentReuseAllowed: selectedNegotiation.terms.contentReuseAllowed || false,
        paymentMethod: method,
        bankName: bank,
        accountNumber: account,
        paypalInfo: paypal,
      });
    } else {
      setTermsForm({
        videoCount: '',
        amount: '',
        platforms: [],
        scriptLink: '',
        sparkleCode: false,
        contractStartDate: '',
        contractEndDate: '',
        contentReuseAllowed: false,
        paymentMethod: 'bank-transfer',
        bankName: '',
        accountNumber: '',
        paypalInfo: '',
      });
    }
  }, [selectedNegotiation]);

  // 테이블 컬럼 정의
  const columns = useMemo(() => [
    columnHelper.accessor('creatorUserId', {
      header: 'Creator User ID',
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor('creatorEmail', {
      header: 'Email',
      cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'negotiationStatus',
      header: 'Status',
      cell: (info) => {
        const negotiation = negotiations.find(
          n => n.projectId === selectedProjectId && n.creatorId === info.row.original.creatorId
        );
        if (!negotiation) {
          return <Badge className="bg-gray-600">대기중</Badge>;
        }
        const statusColors = {
          negotiating: 'bg-yellow-600',
          completed: 'bg-green-600',
          dropped: 'bg-red-600',
        };
        const statusText = {
          negotiating: '협상중',
          completed: '완료',
          dropped: '중단',
        };
        return <Badge className={statusColors[negotiation.status]}>{statusText[negotiation.status]}</Badge>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Button
          size="sm"
          onClick={() => handleSelectCreator(info.row.original)}
          variant={
            selectedNegotiationId === negotiations.find(
              n => n.projectId === selectedProjectId && n.creatorId === info.row.original.creatorId
            )?.id ? 'primary' : 'secondary'
          }
        >
          협상 관리
        </Button>
      ),
    }),
  ], [negotiations, selectedProjectId, selectedNegotiationId]);

  const tableState = useTableState({
    initialSorting: [],
  });
  const table = useReactTable({
    data: interestedReachOuts,
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

  // 필수 필드 검증
  const isTermsComplete = useMemo(() => {
    if (!selectedNegotiation?.terms) return false;
    
    const terms = selectedNegotiation.terms;
    return !!(
      terms.videoCount &&
      terms.amount &&
      terms.uploadPlatforms && terms.uploadPlatforms.length > 0 &&
      terms.videoScript &&
      terms.contractPeriod &&
      terms.paymentMethod
    );
  }, [selectedNegotiation]);

  // 플랫폼 체크박스 토글
  const handlePlatformToggle = (platform: string) => {
    setTermsForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  // 협상 조건 저장
  const handleSaveTerms = () => {
    if (!selectedNegotiationId) return;

    // 필수 필드 검증
    if (!termsForm.videoCount || !termsForm.amount || termsForm.platforms.length === 0 || 
        !termsForm.scriptLink || !termsForm.contractStartDate || !termsForm.contractEndDate) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 결제 정보 검증
    if (termsForm.paymentMethod === 'bank-transfer') {
      if (!termsForm.bankName || !termsForm.accountNumber) {
        alert('은행 정보를 입력해주세요.');
        return;
      }
    } else if (termsForm.paymentMethod === 'paypal') {
      if (!termsForm.paypalInfo) {
        alert('PayPal 정보를 입력해주세요.');
        return;
      }
    }

    // Generate payment info string
    let paymentInfoText = '';
    if (termsForm.paymentMethod === 'bank-transfer') {
      paymentInfoText = `Bank: ${termsForm.bankName} | Account: ${termsForm.accountNumber}`;
    } else if (termsForm.paymentMethod === 'paypal') {
      paymentInfoText = `PayPal: ${termsForm.paypalInfo}`;
    }

    // Generate contract period string
    const contractPeriod = `${termsForm.contractStartDate} ~ ${termsForm.contractEndDate}`;

    updateTerms(selectedNegotiationId, {
      videoCount: parseInt(termsForm.videoCount) || 0,
      amount: parseInt(termsForm.amount) || 0,
      currency: 'USD',
      uploadPlatforms: termsForm.platforms,
      videoScript: termsForm.scriptLink,
      sparkleCode: termsForm.sparkleCode ? 'YES' : undefined,
      contractPeriod: contractPeriod,
      productionPeriod: undefined, // 제거됨
      contentReuseAllowed: termsForm.contentReuseAllowed,
      paymentMethod: paymentInfoText,
    });

    setIsEditingTerms(false);
    alert('협상 조건이 저장되었습니다.');
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (!selectedNegotiationId || !chatInput.trim() || !appUser) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      negotiationId: selectedNegotiationId,
      senderId: appUser.email,
      senderName: appUser.email, // 로그인한 사용자 이메일 표시
      message: chatInput,
      timestamp: new Date().toISOString(),
    };

    addMessage(selectedNegotiationId, message);
    setChatInput('');
  };

  // 운송장 번호 저장
  const handleSaveTrackingNumber = (trackingNumber: string) => {
    if (!selectedNegotiationId) return;
    setTrackingNumber(selectedNegotiationId, trackingNumber);
    alert('운송장 번호가 저장되었습니다.');
  };

  // 협상 완료
  const handleCompleteNegotiation = () => {
    if (!selectedNegotiationId) return;
    
    // 필수 필드 검증
    if (!isTermsComplete) {
      alert('협상 조건을 모두 입력해야 완료할 수 있습니다.');
      return;
    }
    
    if (!confirm('협상을 완료하시겠습니까? 제작 단계로 넘어갑니다.')) return;

    completeNegotiation(selectedNegotiationId);
    alert('협상이 완료되었습니다. 제작 페이지로 이동합니다.');
    // TODO: Navigate to /seeding/production
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">협상 관리</h1>
      </div>

      {/* 프로젝트 선택 */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          프로젝트 선택
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setSelectedNegotiationId('');
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">프로젝트를 선택하세요</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && (
        <div className="space-y-6">
          {/* 관심 표명 크리에이터 테이블 */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">관심 표명 크리에이터</h2>
            {interestedReachOuts.length === 0 ? (
              <p className="text-sm text-gray-400">관심 표명한 크리에이터가 없습니다.</p>
            ) : (
              <DataTable 
                table={table}
                getRowClassName={(reachOut: ReachOut) => {
                  // 해당 크리에이터의 협상 찾기
                  const negotiation = negotiations.find(
                    n => n.projectId === selectedProjectId && n.creatorId === reachOut.creatorId
                  );
                  if (!negotiation) return '';
                  
                  // 선택된 프로젝트의 담당자 목록
                  const project = projects.find(p => p.id === selectedProjectId);
                  
                  return getRecentUpdateClass(
                    negotiation.id,
                    negotiation.updatedAt,
                    project?.assignees,
                    appUser?.email,
                    getLastViewed(negotiation.id),
                    5 // 5분 이내
                  );
                }}
                onRowClick={(reachOut: ReachOut) => {
                  const negotiation = negotiations.find(
                    n => n.projectId === selectedProjectId && n.creatorId === reachOut.creatorId
                  );
                  if (negotiation) {
                    markAsViewed(negotiation.id);
                  }
                }}
              />
            )}
          </div>

          {/* 협상 조건 */}
          {selectedNegotiation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    협상 조건 -{' '}
                    <button
                      onClick={() => setIsCreatorDetailModalOpen(true)}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                      disabled={!selectedCreator}
                    >
                      {selectedNegotiation.creatorUserId}
                    </button>
                  </h2>
                  {!isTermsComplete && (
                    <p className="text-sm text-yellow-400 mt-1">
                      ⚠ 모든 필수 항목을 입력해야 협상을 완료할 수 있습니다.
                    </p>
                  )}
                </div>
                {!isEditingTerms && (
                  <Button onClick={() => setIsEditingTerms(true)} size="sm" variant="secondary">
                    {selectedNegotiation.terms ? '수정' : '입력'}
                  </Button>
                )}
              </div>

              {isEditingTerms ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      영상 개수 <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="number"
                      value={termsForm.videoCount}
                      onChange={(e) => setTermsForm({ ...termsForm, videoCount: e.target.value })}
                      placeholder="예: 3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      금액 (USD) <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="number"
                      value={termsForm.amount}
                      onChange={(e) => setTermsForm({ ...termsForm, amount: e.target.value })}
                      placeholder="예: 1000"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      플랫폼 (다중 선택 가능) <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {AVAILABLE_PLATFORMS.map((platform) => (
                        <label
                          key={platform}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={termsForm.platforms.includes(platform)}
                            onChange={() => handlePlatformToggle(platform)}
                            className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-white">{platform}</span>
                        </label>
                      ))}
                    </div>
                    {termsForm.platforms.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        선택됨: {termsForm.platforms.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      대본 링크 (Google Docs) <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="url"
                      value={termsForm.scriptLink}
                      onChange={(e) => setTermsForm({ ...termsForm, scriptLink: e.target.value })}
                      placeholder="https://docs.google.com/document/d/..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      계약 시작일 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={termsForm.contractStartDate}
                      onChange={(e) => setTermsForm({ ...termsForm, contractStartDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      계약 종료일 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={termsForm.contractEndDate}
                      onChange={(e) => setTermsForm({ ...termsForm, contractEndDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      결제 방법 <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setTermsForm({ ...termsForm, paymentMethod: 'bank-transfer' })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          termsForm.paymentMethod === 'bank-transfer'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setTermsForm({ ...termsForm, paymentMethod: 'paypal' })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          termsForm.paymentMethod === 'paypal'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        PayPal
                      </button>
                    </div>

                    {termsForm.paymentMethod === 'bank-transfer' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Bank Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            value={termsForm.bankName}
                            onChange={(e) => setTermsForm({ ...termsForm, bankName: e.target.value })}
                            placeholder="e.g., Bank of America"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Account Number <span className="text-red-400">*</span>
                          </label>
                          <Input
                            value={termsForm.accountNumber}
                            onChange={(e) => setTermsForm({ ...termsForm, accountNumber: e.target.value })}
                            placeholder="Account number"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {termsForm.paymentMethod === 'paypal' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          PayPal Email or ID <span className="text-red-400">*</span>
                        </label>
                        <Input
                          value={termsForm.paypalInfo}
                          onChange={(e) => setTermsForm({ ...termsForm, paypalInfo: e.target.value })}
                          placeholder="email@example.com or PayPal.Me link"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">운송장 번호 (선택)</label>
                    <Input
                      value={selectedNegotiation.trackingNumber || ''}
                      onChange={(e) => handleSaveTrackingNumber(e.target.value)}
                      placeholder="운송장 번호를 입력하세요"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sparkleCode"
                        checked={termsForm.sparkleCode}
                        onChange={(e) => setTermsForm({ ...termsForm, sparkleCode: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-700 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="sparkleCode" className="text-sm text-gray-300">
                        스파클 코드 사용
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="contentReuse"
                        checked={termsForm.contentReuseAllowed}
                        onChange={(e) => setTermsForm({ ...termsForm, contentReuseAllowed: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-700 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="contentReuse" className="text-sm text-gray-300">
                        콘텐츠 재사용 허용
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2 flex gap-2">
                    <Button onClick={handleSaveTerms} className="flex-1">
                      저장
                    </Button>
                    <Button
                      onClick={() => setIsEditingTerms(false)}
                      variant="secondary"
                      className="flex-1"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">영상 개수:</span>
                    <span className="ml-2 text-white">{selectedNegotiation.terms?.videoCount || '-'}개</span>
                  </div>
                  <div>
                    <span className="text-gray-400">금액:</span>
                    <span className="ml-2 text-white">
                      {selectedNegotiation.terms?.amount ? `${selectedNegotiation.terms.amount.toLocaleString()} ${selectedNegotiation.terms.currency}` : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">플랫폼:</span>
                    <span className="ml-2 text-white">{selectedNegotiation.terms?.uploadPlatforms?.join(', ') || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">대본 링크:</span>
                    {selectedNegotiation.terms?.videoScript ? (
                      <a
                        href={selectedNegotiation.terms.videoScript}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Google Docs 열기 →
                      </a>
                    ) : (
                      <span className="ml-2 text-white">-</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">계약 기간:</span>
                    <span className="ml-2 text-white">{selectedNegotiation.terms?.contractPeriod || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">결제 방법:</span>
                    <span className="ml-2 text-white">{selectedNegotiation.terms?.paymentMethod || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">운송장 번호:</span>
                    <span className="ml-2 text-white">{selectedNegotiation.trackingNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">스파클 코드:</span>
                    <span className="ml-2 text-white">{selectedNegotiation.terms?.sparkleCode ? '사용' : '미사용'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">콘텐츠 재사용:</span>
                    <span className="ml-2 text-white">
                      {selectedNegotiation.terms?.contentReuseAllowed ? '허용' : '불가'}
                    </span>
                  </div>

                  {selectedNegotiation.status !== 'completed' && (
                    <div className="col-span-2">
                      <Button 
                        onClick={handleCompleteNegotiation} 
                        className="w-full"
                        disabled={!isTermsComplete}
                        title={!isTermsComplete ? '모든 필수 항목을 입력해야 완료할 수 있습니다.' : ''}
                      >
                        {isTermsComplete ? '✓ 협상 완료' : '⚠ 협상 완료 (필수 항목 미입력)'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 채팅 영역 */}
          {selectedNegotiation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">채팅</h2>

              {/* 메시지 목록 */}
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {selectedNegotiation.messages?.length === 0 ? (
                  <p className="text-sm text-gray-400">아직 메시지가 없습니다.</p>
                ) : (
                  selectedNegotiation.messages?.map((msg) => (
                    <div key={msg.id} className="bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-400">{msg.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* 메시지 입력 */}
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder={appUser ? "메시지를 입력하세요 (Shift+Enter: 줄바꿈)" : "로그인이 필요합니다"}
                  disabled={!appUser}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!chatInput.trim() || !appUser}
                >
                  전송
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 크리에이터 상세 정보 모달 */}
      {selectedCreator && (
        <Modal
          isOpen={isCreatorDetailModalOpen}
          onClose={() => setIsCreatorDetailModalOpen(false)}
          title={selectedCreator.userId}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">User ID</div>
                <a
                  href={selectedCreator.profileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {selectedCreator.userId}
                </a>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Email</div>
                <div className="text-white">{selectedCreator.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Followers</div>
                <div className="text-cyan-400 font-semibold">{formatNumber(selectedCreator.followers)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Posts</div>
                <div className="text-white font-semibold">{formatNumber(selectedCreator.posts)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Likes</div>
                <div className="text-white font-semibold">{formatNumber(selectedCreator.likes)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Reasonable Rate</div>
                <div className="text-green-400 font-semibold">{formatCurrency(selectedCreator.reasonableRate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Offer Rate</div>
                <div className="text-yellow-400 font-semibold">{formatCurrency(selectedCreator.offerRate)}</div>
              </div>
            </div>

            {selectedCreator.country && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Country</div>
                <div className="text-white">{selectedCreator.country}</div>
              </div>
            )}

            {selectedCreator.tags && selectedCreator.tags.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCreator.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedCreator.notes && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Notes</div>
                <div className="text-gray-300 bg-gray-700 p-3 rounded-lg">{selectedCreator.notes}</div>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
              생성일: {new Date(selectedCreator.createdAt).toLocaleString('ko-KR')}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsCreatorDetailModalOpen(false)}
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
