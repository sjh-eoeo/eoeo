import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { useBrandStore } from '../../store/useBrandStore';
import { useAuthStore } from '../../store/useAuthStore';
import { createProjectInvitation } from '../../lib/utils/notifications';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import type { AppUser } from '../../types';

interface ProjectMetadata {
  id: string;
  name: string;
  brand: string;
  product?: string;
  region?: string;
  participants: string[]; // user emails
  createdAt: string;
  updatedAt: string;
}

export function AdminPage() {
  const { brands, addBrand, removeBrand } = useBrandStore();
  const { appUser } = useAuthStore();
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Brand 관련 state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  
  // Project 관련 state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    brand: '',
    product: '',
    region: '',
    participants: [] as string[],
  });
  const [participantSearch, setParticipantSearch] = useState('');

  // LocalStorage에서 프로젝트 메타데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('negotiation-project-metadata');
    if (saved) {
      try {
        setProjectMetadata(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load project metadata:', error);
      }
    }
  }, []);

  // Firestore에서 유저 목록 가져오기
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
        setUsers(usersList);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Brand 추가
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    
    addBrand(newBrandName.trim());
    setNewBrandName('');
    setIsBrandModalOpen(false);
    alert(`브랜드 "${newBrandName}"가 추가되었습니다!`);
  };

  // Brand 삭제
  const handleDeleteBrand = (brandName: string) => {
    const projectsWithBrand = projectMetadata.filter(p => p.brand === brandName);
    
    if (projectsWithBrand.length > 0) {
      if (!confirm(`"${brandName}" 브랜드에 ${projectsWithBrand.length}개의 프로젝트가 있습니다. 정말 삭제하시겠습니까?`)) {
        return;
      }
    } else {
      if (!confirm(`"${brandName}" 브랜드를 삭제하시겠습니까?`)) {
        return;
      }
    }
    
    removeBrand(brandName);
    alert(`브랜드 "${brandName}"가 삭제되었습니다.`);
  };

  // Project 추가
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProject.name.trim() || !newProject.brand) {
      alert('프로젝트 이름과 브랜드는 필수입니다.');
      return;
    }
    
    if (isEditMode && editingProjectId) {
      // 수정 모드
      const oldProject = projectMetadata.find(p => p.id === editingProjectId);
      const oldParticipants = oldProject?.participants || [];
      const newParticipants = newProject.participants.filter(p => !oldParticipants.includes(p));
      
      const updated = projectMetadata.map(p => 
        p.id === editingProjectId 
          ? {
              ...p,
              name: newProject.name,
              brand: newProject.brand,
              product: newProject.product,
              region: newProject.region,
              participants: newProject.participants,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setProjectMetadata(updated);
      localStorage.setItem('negotiation-project-metadata', JSON.stringify(updated));
      
      // 새로 추가된 참여자에게 초대 알림 발송
      if (newParticipants.length > 0 && appUser) {
        console.log('🔔 Sending invitations to new participants:', newParticipants);
        createProjectInvitation(
          editingProjectId,
          newProject.name,
          newProject.brand,
          appUser.email || 'Admin',
          newParticipants
        );
        console.log('✅ Invitations sent!');
      }
      
      alert(`프로젝트 "${newProject.name}"가 수정되었습니다!${newParticipants.length > 0 ? `\n${newParticipants.length}명에게 초대 알림을 보냈습니다.` : ''}`);
    } else {
      // 추가 모드
      const projectMeta: ProjectMetadata = {
        id: `meta-${Date.now()}`,
        name: newProject.name,
        brand: newProject.brand,
        product: newProject.product,
        region: newProject.region,
        participants: newProject.participants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updated = [...projectMetadata, projectMeta];
      setProjectMetadata(updated);
      localStorage.setItem('negotiation-project-metadata', JSON.stringify(updated));
      
      // 참여자들에게 초대 알림 발송
      if (newProject.participants.length > 0 && appUser) {
        console.log('🔔 Sending invitations to:', newProject.participants);
        console.log('Project details:', {
          id: projectMeta.id,
          name: projectMeta.name,
          brand: projectMeta.brand,
          invitedBy: appUser.email,
        });
        createProjectInvitation(
          projectMeta.id,
          projectMeta.name,
          projectMeta.brand,
          appUser.email || 'Admin',
          newProject.participants
        );
        console.log('✅ Invitations created successfully!');
        
        // 초대 확인
        const savedInvitations = localStorage.getItem('project-invitations');
        console.log('📬 Current invitations in storage:', savedInvitations);
      }
      
      alert(`프로젝트 "${newProject.name}"가 추가되었습니다!\n${newProject.participants.length}명에게 초대 알림을 보냈습니다.`);
    }
    
    setNewProject({
      name: '',
      brand: '',
      product: '',
      region: '',
      participants: [],
    });
    setIsProjectModalOpen(false);
    setIsEditMode(false);
    setEditingProjectId(null);
    setParticipantSearch('');
  };

  // Project 수정 모달 열기
  const handleEditProject = (project: ProjectMetadata) => {
    setIsEditMode(true);
    setEditingProjectId(project.id);
    setNewProject({
      name: project.name,
      brand: project.brand,
      product: project.product || '',
      region: project.region || '',
      participants: project.participants || [],
    });
    setIsProjectModalOpen(true);
  };

  // Project 삭제
  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (!confirm(`프로젝트 "${projectName}"를 삭제하시겠습니까?`)) {
      return;
    }
    
    const updated = projectMetadata.filter(p => p.id !== projectId);
    setProjectMetadata(updated);
    localStorage.setItem('negotiation-project-metadata', JSON.stringify(updated));
    alert(`프로젝트 "${projectName}"가 삭제되었습니다.`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-gray-400">브랜드와 프로젝트를 관리합니다. (Admin 전용)</p>
      </div>

      {/* Brands Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">브랜드 관리</h2>
            <p className="text-sm text-gray-400 mt-1">
              협상테이블 프로젝트에서 사용할 브랜드를 추가/삭제합니다.
            </p>
          </div>
          <Button onClick={() => setIsBrandModalOpen(true)}>
            + 브랜드 추가
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {brands.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              등록된 브랜드가 없습니다. 브랜드를 추가해주세요.
            </div>
          ) : (
            brands.map((brand) => {
              const brandProjects = projectMetadata.filter(p => p.brand === brand);
              return (
                <div
                  key={brand}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{brand}</h3>
                      <p className="text-xs text-gray-400">
                        {brandProjects.length}개 프로젝트
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBrand(brand)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">프로젝트 관리</h2>
            <p className="text-sm text-gray-400 mt-1">
              협상테이블에서 사용할 프로젝트를 추가/삭제합니다.
            </p>
          </div>
          <Button onClick={() => setIsProjectModalOpen(true)}>
            + 프로젝트 추가
          </Button>
        </div>

        <div className="space-y-3">
          {projectMetadata.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              등록된 프로젝트가 없습니다. 프로젝트를 추가해주세요.
            </div>
          ) : (
            projectMetadata.map((project) => (
              <div
                key={project.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <Badge variant="default">{project.brand}</Badge>
                    </div>
                    <div className="flex gap-2 text-sm mb-2">
                      {project.product && (
                        <span className="text-gray-400">제품: {project.product}</span>
                      )}
                      {project.region && (
                        <span className="text-gray-400">• 지역: {project.region}</span>
                      )}
                    </div>
                    {project.participants && project.participants.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        <span className="text-xs text-gray-500">참여자:</span>
                        {project.participants.slice(0, 3).map((email, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {email}
                          </Badge>
                        ))}
                        {project.participants.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.participants.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Brand Modal */}
      <Modal
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false);
          setNewBrandName('');
        }}
        title="브랜드 추가"
      >
        <form onSubmit={handleAddBrand} className="space-y-4">
          <Input
            label="브랜드 이름"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="예: Nike, Adidas, Puma"
            required
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsBrandModalOpen(false);
                setNewBrandName('');
              }}
            >
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setNewProject({
            name: '',
            brand: '',
            product: '',
            region: '',
            participants: [],
          });
          setIsEditMode(false);
          setEditingProjectId(null);
          setParticipantSearch('');
        }}
        title={isEditMode ? "프로젝트 수정" : "프로젝트 추가"}
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <Input
            label="프로젝트 이름"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="예: 2024 Summer Campaign"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              브랜드 <span className="text-red-400">*</span>
            </label>
            <select
              value={newProject.brand}
              onChange={(e) => setNewProject({ ...newProject, brand: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">브랜드 선택</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            {brands.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                먼저 브랜드를 추가해주세요.
              </p>
            )}
          </div>

          <Input
            label="제품/상품명 (선택)"
            value={newProject.product}
            onChange={(e) => setNewProject({ ...newProject, product: e.target.value })}
            placeholder="예: Air Max, Ultra Boost"
          />

          <Input
            label="지역 (선택)"
            value={newProject.region}
            onChange={(e) => setNewProject({ ...newProject, region: e.target.value })}
            placeholder="예: US, Korea, Global"
          />

          {/* 참여자 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              참여자 (선택)
            </label>
            
            {/* 검색 입력 */}
            <div className="mb-2">
              <Input
                placeholder="이메일 검색..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
              />
            </div>

            {/* 선택된 참여자 */}
            {newProject.participants.length > 0 && (
              <div className="mb-2 p-2 bg-gray-700/50 rounded border border-gray-600">
                <div className="flex flex-wrap gap-2">
                  {newProject.participants.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewProject({
                            ...newProject,
                            participants: newProject.participants.filter(e => e !== email),
                          });
                        }}
                        className="hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 유저 목록 */}
            {loadingUsers ? (
              <div className="text-center py-4 text-gray-400">
                유저 목록 로딩 중...
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-600 rounded bg-gray-700/30">
                {users
                  .filter(user => 
                    !newProject.participants.includes(user.email) &&
                    (participantSearch === '' || 
                     user.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
                     user.displayName?.toLowerCase().includes(participantSearch.toLowerCase()))
                  )
                  .map((user) => (
                    <button
                      key={user.uid}
                      type="button"
                      onClick={() => {
                        setNewProject({
                          ...newProject,
                          participants: [...newProject.participants, user.email],
                        });
                        setParticipantSearch('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-600 text-sm text-gray-300 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{user.displayName || user.email}</div>
                        {user.displayName && (
                          <div className="text-xs text-gray-400">{user.email}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    </button>
                  ))}
                {users.filter(user => 
                  !newProject.participants.includes(user.email) &&
                  (participantSearch === '' || 
                   user.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
                   user.displayName?.toLowerCase().includes(participantSearch.toLowerCase()))
                ).length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    {participantSearch ? '검색 결과가 없습니다.' : '사용 가능한 유저가 없습니다.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsProjectModalOpen(false);
                setNewProject({
                  name: '',
                  brand: '',
                  product: '',
                  region: '',
                  participants: [],
                });
                setIsEditMode(false);
                setEditingProjectId(null);
                setParticipantSearch('');
              }}
            >
              취소
            </Button>
            <Button type="submit" disabled={brands.length === 0}>
              {isEditMode ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
