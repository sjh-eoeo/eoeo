import { useState, useMemo } from 'react';
import { useSeedingProjectStore } from '../../store/useSeedingProjectStore';
import { useSeedingNegotiationStore } from '../../store/useSeedingNegotiationStore';
import { useSeedingDraftStore } from '../../store/useSeedingDraftStore';
import { useSeedingPaymentStore } from '../../store/useSeedingPaymentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
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
import type { Payment, Negotiation } from '../../types/seeding';

const columnHelper = createColumnHelper<Negotiation>();

export function SeedingPaymentPage() {
  const { appUser } = useAuthStore();
  const { projects } = useSeedingProjectStore();
  const { negotiations } = useSeedingNegotiationStore();
  const { drafts } = useSeedingDraftStore();
  const { payments, addPayment, processPayment, completePayment } = useSeedingPaymentStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // 결제 폼 상태
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: '',
    receiptUrl: '',
  });

  // 드래프트가 승인된 협상만 표시
  const negotiationsWithApprovedDrafts = useMemo(() => {
    if (!selectedProjectId) return [];
    
    return negotiations.filter(n => {
      if (n.projectId !== selectedProjectId || n.status !== 'completed') return false;
      
      // 이 협상에 승인된 드래프트가 있는지 확인
      const approvedDraft = drafts.find(
        d => d.negotiationId === n.id && d.status === 'approved'
      );
      
      return !!approvedDraft;
    });
  }, [selectedProjectId, negotiations, drafts]);

  // 선택된 협상
  const selectedNegotiation = useMemo(() => {
    return negotiations.find(n => n.id === selectedNegotiationId);
  }, [selectedNegotiationId, negotiations]);

  // 선택된 협상의 결제 정보
  const negotiationPayment = useMemo(() => {
    if (!selectedNegotiationId) return null;
    return payments.find(p => p.negotiationId === selectedNegotiationId);
  }, [selectedNegotiationId, payments]);

  // 테이블 컬럼 정의
  const columns = useMemo(() => [
    columnHelper.accessor('creatorUserId', {
      header: 'Creator',
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'amount',
      header: 'Amount',
      cell: (info) => {
        const terms = info.row.original.terms;
        if (!terms) return <span className="text-gray-400">-</span>;
        return (
          <span className="text-white">
            {terms.amount.toLocaleString()} {terms.currency}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'paymentMethod',
      header: 'Payment Method',
      cell: (info) => (
        <span className="text-gray-400">{info.row.original.terms?.paymentMethod || '-'}</span>
      ),
    }),
    columnHelper.display({
      id: 'paymentStatus',
      header: 'Status',
      cell: (info) => {
        const payment = payments.find(p => p.negotiationId === info.row.original.id);
        if (!payment) {
          return <Badge className="bg-gray-600">미등록</Badge>;
        }
        const statusColors = {
          pending: 'bg-yellow-600',
          processing: 'bg-blue-600',
          completed: 'bg-green-600',
          failed: 'bg-red-600',
        };
        const statusText = {
          pending: '대기중',
          processing: '처리중',
          completed: '완료',
          failed: '실패',
        };
        return <Badge className={statusColors[payment.status]}>{statusText[payment.status]}</Badge>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedNegotiationId(info.row.original.id);
          }}
          variant={selectedNegotiationId === info.row.original.id ? 'primary' : 'secondary'}
        >
          관리
        </Button>
      ),
    }),
  ], [payments, selectedNegotiationId]);

  const tableState = useTableState({
    initialSorting: [{ id: 'updatedAt', desc: true }],
  });
  const table = useReactTable({
    data: negotiationsWithApprovedDrafts,
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

  // 결제 등록
  const handleRegisterPayment = () => {
    if (!selectedNegotiation || !selectedNegotiation.terms) {
      alert('협상 조건을 찾을 수 없습니다.');
      return;
    }

    // 이미 결제가 등록되어 있는지 확인
    if (negotiationPayment) {
      alert('이미 결제가 등록되어 있습니다.');
      return;
    }

    const newPayment: Payment = {
      id: `payment_${Date.now()}`,
      negotiationId: selectedNegotiation.id,
      projectId: selectedNegotiation.projectId,
      creatorId: selectedNegotiation.creatorId,
      creatorUserId: selectedNegotiation.creatorUserId,
      creatorEmail: selectedNegotiation.creatorEmail,
      amount: selectedNegotiation.terms.amount,
      currency: selectedNegotiation.terms.currency,
      paymentMethod: selectedNegotiation.terms.paymentMethod,
      paymentDetails: selectedNegotiation.terms.paymentDetails || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addPayment(newPayment);
    alert('결제가 등록되었습니다.');
  };

  // 결제 처리
  const handleProcessPayment = () => {
    if (!negotiationPayment || !appUser) return;
    if (!paymentForm.paidAmount || !paymentForm.receiptUrl) {
      alert('결제 금액과 송금증 URL을 입력하세요.');
      return;
    }

    processPayment(
      negotiationPayment.id,
      parseInt(paymentForm.paidAmount),
      paymentForm.receiptUrl
    );

    setIsPaymentModalOpen(false);
    setPaymentForm({ paidAmount: '', receiptUrl: '' });
    alert('결제가 처리되었습니다. 재무팀 승인 대기 중입니다.');
  };

  // 결제 완료 (재무팀 승인 후)
  const handleCompletePayment = () => {
    if (!negotiationPayment) return;
    if (!confirm('결제를 완료 처리하시겠습니까?')) return;

    completePayment(negotiationPayment.id);
    alert('결제가 완료되었습니다.');
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    if (negotiationsWithApprovedDrafts.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // CSV 헤더
    const headers = ['Project', 'Creator User ID', 'Email', 'Amount', 'Currency', 'Payment Method', 'Status', 'Paid Amount', 'Paid Date'];
    
    // CSV 데이터
    const rows = negotiationsWithApprovedDrafts.map(negotiation => {
      const payment = payments.find(p => p.negotiationId === negotiation.id);
      const project = projects.find(p => p.id === negotiation.projectId);
      
      return [
        project?.name || '-',
        negotiation.creatorUserId,
        negotiation.creatorEmail,
        negotiation.terms?.amount || 0,
        negotiation.terms?.currency || 'USD',
        negotiation.terms?.paymentMethod || '-',
        payment ? payment.status : 'pending',
        payment?.paidAmount || '-',
        payment?.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-',
      ];
    });

    // CSV 생성
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">결제 관리</h1>
        <Button onClick={handleDownloadCSV} variant="secondary">
          CSV 다운로드
        </Button>
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
          {/* 승인된 드래프트 목록 테이블 */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">승인된 드래프트 (결제 대상)</h2>
            {negotiationsWithApprovedDrafts.length === 0 ? (
              <p className="text-sm text-gray-400">승인된 드래프트가 없습니다.</p>
            ) : (
              <DataTable table={table} />
            )}
          </div>

          {/* 결제 상세 정보 */}
          {selectedNegotiation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  결제 정보 - {selectedNegotiation.creatorUserId}
                </h2>
                {!negotiationPayment && (
                  <Button onClick={handleRegisterPayment} disabled={!appUser}>
                    결제 등록
                  </Button>
                )}
              </div>

              {/* 협상 조건 정보 */}
              {selectedNegotiation.terms && (
                <div className="mb-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-white mb-3">협상된 조건</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">금액:</span>
                      <span className="ml-2 text-white font-semibold">
                        {selectedNegotiation.terms.amount.toLocaleString()} {selectedNegotiation.terms.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">결제 방법:</span>
                      <span className="ml-2 text-white">{selectedNegotiation.terms.paymentMethod}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">결제 상세:</span>
                      <span className="ml-2 text-white">{selectedNegotiation.terms.paymentDetails || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 결제 처리 정보 */}
              {negotiationPayment ? (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">결제 상태</h3>
                      <Badge className={
                        negotiationPayment.status === 'completed' ? 'bg-green-600' :
                        negotiationPayment.status === 'processing' ? 'bg-blue-600' :
                        negotiationPayment.status === 'failed' ? 'bg-red-600' :
                        'bg-yellow-600'
                      }>
                        {negotiationPayment.status === 'pending' && '대기중'}
                        {negotiationPayment.status === 'processing' && '처리중'}
                        {negotiationPayment.status === 'completed' && '완료'}
                        {negotiationPayment.status === 'failed' && '실패'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">등록일:</span>
                        <span className="ml-2 text-white">
                          {new Date(negotiationPayment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {negotiationPayment.paidAmount && (
                        <>
                          <div>
                            <span className="text-gray-400">실제 결제 금액:</span>
                            <span className="ml-2 text-white font-semibold">
                              {negotiationPayment.paidAmount.toLocaleString()} {negotiationPayment.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">결제일:</span>
                            <span className="ml-2 text-white">
                              {negotiationPayment.paidDate ? new Date(negotiationPayment.paidDate).toLocaleString() : '-'}
                            </span>
                          </div>
                        </>
                      )}

                      {negotiationPayment.receiptUrl && (
                        <div className="col-span-2">
                          <span className="text-gray-400">송금증:</span>
                          <a
                            href={negotiationPayment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-400 hover:text-blue-300"
                          >
                            보기 →
                          </a>
                        </div>
                      )}

                      {negotiationPayment.financeApprovedBy && (
                        <>
                          <div>
                            <span className="text-gray-400">재무팀 승인:</span>
                            <span className="ml-2 text-green-400">{negotiationPayment.financeApprovedBy}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">승인일:</span>
                            <span className="ml-2 text-white">
                              {negotiationPayment.financeApprovedAt ? new Date(negotiationPayment.financeApprovedAt).toLocaleString() : '-'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="mt-4 flex gap-2">
                      {negotiationPayment.status === 'pending' && (
                        <Button
                          onClick={() => setIsPaymentModalOpen(true)}
                          disabled={!appUser}
                        >
                          결제 처리
                        </Button>
                      )}
                      
                      {negotiationPayment.status === 'processing' && (
                        <Button
                          onClick={handleCompletePayment}
                          disabled={!appUser}
                        >
                          결제 완료
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 결제 처리 모달 */}
                  {isPaymentModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-white mb-4">결제 처리</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              실제 결제 금액 ({negotiationPayment.currency})
                            </label>
                            <input
                              type="number"
                              value={paymentForm.paidAmount}
                              onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder={negotiationPayment.amount.toString()}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">송금증 URL</label>
                            <input
                              type="text"
                              value={paymentForm.receiptUrl}
                              onChange={(e) => setPaymentForm({ ...paymentForm, receiptUrl: e.target.value })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="https://..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleProcessPayment} className="flex-1">
                              처리
                            </Button>
                            <Button
                              onClick={() => {
                                setIsPaymentModalOpen(false);
                                setPaymentForm({ paidAmount: '', receiptUrl: '' });
                              }}
                              variant="secondary"
                              className="flex-1"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">결제를 등록하려면 "결제 등록" 버튼을 클릭하세요.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
