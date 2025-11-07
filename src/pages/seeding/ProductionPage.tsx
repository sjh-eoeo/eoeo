import { useState, useMemo } from 'react';
import { useSeedingProjectStore } from '../../store/useSeedingProjectStore';
import { useSeedingNegotiationStore } from '../../store/useSeedingNegotiationStore';
import { useSeedingDraftStore } from '../../store/useSeedingDraftStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLastViewedStore } from '../../store/useLastViewedStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { getRecentUpdateClass } from '../../lib/utils/highlight';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { useTableState } from '../../hooks/useTableState';
import type { Negotiation, Draft, ReviewComment } from '../../types/seeding';

const columnHelper = createColumnHelper<Negotiation>();

export function SeedingProductionPage() {
  const { appUser } = useAuthStore();
  const { projects } = useSeedingProjectStore();
  const { negotiations } = useSeedingNegotiationStore();
  const { drafts, addDraft, addComment, approveDraft, requestRevision } = useSeedingDraftStore();
  const { markAsViewed, getLastViewed } = useLastViewedStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  // 업로드 폼 상태
  const [uploadForm, setUploadForm] = useState({
    fileName: '',
    fileUrl: '',
    fileSize: 0,
  });

  // 협상 완료된 내역만 표시 (최신 업데이트 순으로 정렬)
  const completedNegotiations = useMemo(() => {
    if (!selectedProjectId) return [];
    const filtered = negotiations.filter(
      n => n.projectId === selectedProjectId && n.status === 'completed'
    );
    
    // updatedAt 기준으로 내림차순 정렬 (최신순)
    return filtered.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [selectedProjectId, negotiations]);

  // 선택된 협상
  const selectedNegotiation = useMemo(() => {
    return negotiations.find(n => n.id === selectedNegotiationId);
  }, [selectedNegotiationId, negotiations]);

  // 선택된 협상의 드래프트들
  const negotiationDrafts = useMemo(() => {
    if (!selectedNegotiationId) return [];
    return drafts.filter(d => d.negotiationId === selectedNegotiationId);
  }, [selectedNegotiationId, drafts]);

  // 테이블 컬럼 정의
  const columns = useMemo(() => [
    columnHelper.accessor('creatorUserId', {
      header: 'Creator',
      cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor('trackingNumber', {
      header: 'Tracking Number',
      cell: (info) => (
        <span className="text-gray-400">{info.getValue() || '-'}</span>
      ),
    }),
    columnHelper.display({
      id: 'draftStatus',
      header: 'Draft Status',
      cell: (info) => {
        const draft = drafts.find(d => d.negotiationId === info.row.original.id);
        if (!draft) {
          return <Badge className="bg-gray-600">대기중</Badge>;
        }
        const statusColors = {
          pending: 'bg-gray-600',
          uploaded: 'bg-blue-600',
          'under-review': 'bg-yellow-600',
          'revision-requested': 'bg-orange-600',
          approved: 'bg-green-600',
        };
        const statusText = {
          pending: '대기중',
          uploaded: '업로드됨',
          'under-review': '검토중',
          'revision-requested': '수정요청',
          approved: '승인됨',
        };
        return <Badge className={statusColors[draft.status]}>{statusText[draft.status]}</Badge>;
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
  ], [drafts, selectedNegotiationId]);

  const tableState = useTableState({
    initialSorting: [{ id: 'updatedAt', desc: true }],
  });
  const table = useReactTable({
    data: completedNegotiations,
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

  // 드래프트 업로드
  const handleUploadDraft = () => {
    if (!selectedNegotiationId || !selectedNegotiation || !appUser) return;
    if (!uploadForm.fileName || !uploadForm.fileUrl) {
      alert('파일명과 URL을 입력하세요.');
      return;
    }

    const newDraft: Draft = {
      id: `draft_${Date.now()}`,
      negotiationId: selectedNegotiationId,
      projectId: selectedNegotiation.projectId,
      creatorId: selectedNegotiation.creatorId,
      fileName: uploadForm.fileName,
      fileUrl: uploadForm.fileUrl,
      fileSize: uploadForm.fileSize || 0,
      uploadedBy: appUser.email,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      comments: [],
      updatedAt: new Date().toISOString(),
    };

    addDraft(newDraft);
    setIsUploadModalOpen(false);
    setUploadForm({ fileName: '', fileUrl: '', fileSize: 0 });
    alert('드래프트가 업로드되었습니다.');
  };

  // 댓글 추가
  const handleAddComment = (draftId: string) => {
    if (!commentInput.trim() || !appUser) return;

    const comment: ReviewComment = {
      id: `comment_${Date.now()}`,
      draftId: draftId,
      userId: appUser.email,
      userName: appUser.email,
      comment: commentInput,
      timestamp: new Date().toISOString(),
    };

    addComment(draftId, comment);
    setCommentInput('');
  };

  // 드래프트 승인
  const handleApproveDraft = (draftId: string) => {
    if (!appUser) return;
    if (!confirm('이 드래프트를 승인하시겠습니까?')) return;

    approveDraft(draftId, appUser.email);
    alert('드래프트가 승인되었습니다. 결제 페이지로 이동할 수 있습니다.');
  };

  // 수정 요청
  const handleRequestRevision = (draftId: string) => {
    if (!confirm('수정을 요청하시겠습니까?')) return;

    requestRevision(draftId);
    alert('수정이 요청되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">제작 관리</h1>
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
          {/* 협상 완료 목록 테이블 */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">협상 완료 내역</h2>
            {completedNegotiations.length === 0 ? (
              <p className="text-sm text-gray-400">협상이 완료된 크리에이터가 없습니다.</p>
            ) : (
              <DataTable 
                table={table}
                getRowClassName={(negotiation: Negotiation) => {
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
                onRowClick={(negotiation: Negotiation) => {
                  markAsViewed(negotiation.id);
                }}
              />
            )}
          </div>

          {/* 드래프트 업로드 및 관리 */}
          {selectedNegotiation && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  드래프트 관리 - {selectedNegotiation.creatorUserId}
                </h2>
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  disabled={!appUser}
                >
                  드래프트 업로드
                </Button>
              </div>

              {/* 운송장 정보 */}
              {selectedNegotiation.trackingNumber && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <span className="text-sm text-blue-300">
                    운송장 번호: <span className="font-semibold">{selectedNegotiation.trackingNumber}</span>
                  </span>
                </div>
              )}

              {/* 업로드 모달 */}
              {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold text-white mb-4">드래프트 업로드</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">파일명</label>
                        <input
                          type="text"
                          value={uploadForm.fileName}
                          onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="video_draft_v1.mp4"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">파일 URL</label>
                        <input
                          type="text"
                          value={uploadForm.fileUrl}
                          onChange={(e) => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">파일 크기 (bytes)</label>
                        <input
                          type="number"
                          value={uploadForm.fileSize}
                          onChange={(e) => setUploadForm({ ...uploadForm, fileSize: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleUploadDraft} className="flex-1">
                          업로드
                        </Button>
                        <Button
                          onClick={() => {
                            setIsUploadModalOpen(false);
                            setUploadForm({ fileName: '', fileUrl: '', fileSize: 0 });
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

              {/* 드래프트 목록 */}
              <div className="space-y-4">
                {negotiationDrafts.length === 0 ? (
                  <p className="text-sm text-gray-400">아직 업로드된 드래프트가 없습니다.</p>
                ) : (
                  negotiationDrafts.map((draft) => (
                    <div key={draft.id} className="border border-gray-700 rounded-lg p-4">
                      {/* 드래프트 정보 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-medium">{draft.fileName}</h3>
                            <Badge className={
                              draft.status === 'approved' ? 'bg-green-600' :
                              draft.status === 'under-review' ? 'bg-yellow-600' :
                              draft.status === 'revision-requested' ? 'bg-orange-600' :
                              draft.status === 'uploaded' ? 'bg-blue-600' :
                              'bg-gray-600'
                            }>
                              {draft.status === 'pending' && '대기중'}
                              {draft.status === 'uploaded' && '업로드됨'}
                              {draft.status === 'under-review' && '검토중'}
                              {draft.status === 'revision-requested' && '수정요청'}
                              {draft.status === 'approved' && '승인됨'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            업로드: {draft.uploadedBy} • {new Date(draft.uploadedAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400">
                            크기: {(draft.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <a
                            href={draft.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300"
                          >
                            파일 보기 →
                          </a>
                        </div>

                        {/* 액션 버튼 */}
                        {draft.status !== 'approved' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDraft(draft.id)}
                              disabled={!appUser}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRequestRevision(draft.id)}
                              disabled={!appUser}
                            >
                              수정요청
                            </Button>
                          </div>
                        )}

                        {draft.status === 'approved' && draft.approvedBy && (
                          <div className="text-sm text-green-400">
                            승인: {draft.approvedBy}
                            <br />
                            {draft.approvedAt && new Date(draft.approvedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* 댓글 섹션 */}
                      <div className="border-t border-gray-700 pt-3 mt-3">
                        <h4 className="text-sm font-semibold text-white mb-2">검토 댓글</h4>
                        
                        {/* 댓글 목록 */}
                        <div className="space-y-2 mb-3">
                          {draft.comments.length === 0 ? (
                            <p className="text-xs text-gray-500">아직 댓글이 없습니다.</p>
                          ) : (
                            draft.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-900 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-purple-400">{comment.userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-white">{comment.comment}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* 댓글 입력 */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(draft.id);
                              }
                            }}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={appUser ? "댓글을 입력하세요..." : "로그인이 필요합니다"}
                            disabled={!appUser}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(draft.id)}
                            disabled={!commentInput.trim() || !appUser}
                          >
                            댓글
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
