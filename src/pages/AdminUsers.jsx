import React, { useState } from 'react';
import { Search, Filter, Plus, Edit } from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useToolbarMorph } from '../hooks/useToolbarMorph';
import { fixMobileViewport } from '../utils/helpers';

export default function AdminUsers ({ users = [], onUpdateUser, onAddUser, showAlert }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [formData, setFormData] = useState({ name: '', phoneLast5: '', role: 'user', department: '' });
  
  const { searchTerm, setSearchTerm, searchInputRef, containerRef, isSearchOpen, setIsSearchOpen, openSearchMorph, closeSearchMorph, isFilterOpen, setIsFilterOpen, handleFilterClick } = useToolbarMorph();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || (user.phoneLast5 || '').includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (user = null) => {
    setIsSearchOpen(false);
    setIsFilterOpen(false);
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, phoneLast5: user.phoneLast5, role: user.role, department: user.department || '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', phoneLast5: '', role: 'user', department: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fixMobileViewport(false);
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
    } else {
      onAddUser(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="search-fade fixed left-0 right-0 z-40 bg-transparent py-3 transition-opacity" style={{top: "64px"}}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 toolbar-shell">
          {/* ⭐ 將 containerRef 綁定在這裡，供點擊外部收合偵測使用 */}
          <div ref={containerRef} className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn pointer-events-none" aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select
                className={`toolbar-morph-field toolbar-morph-select ${!isFilterOpen ? 'is-closed-cover' : ''}`}
                value={filterRole}
                onClick={handleFilterClick} // ⭐ 改用 onClick 讓手機一點就開
                onChange={e => setFilterRole(e.target.value)}
                
              >
                <option value="all">所有類型</option>
                <option value="user">一般會員</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              <button 
                type="button" 
                className="click-pop toolbar-morph-btn" 
                style={{ pointerEvents: 'auto' }}
                onClick={openSearchMorph} // ⭐ 改用 onClick 讓手機一點就開 
                aria-label="展開搜尋欄"
              >
                <Search size={18} />
              </button>
              <input
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋會員..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
            <div className="toolbar-morph">
            <Button onClick={() => handleOpenModal()} title="新增會員" aria-label="新增會員" className="toolbar-morph-btn"><Plus size={18} /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* 調整間距避免與搜尋列重疊 */}
      <div className="content-reveal mt-24 md:mt-28 bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] md:text-[15px] whitespace-nowrap tracking-wider">
            <thead className="bg-black/40 border-b border-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">姓名</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">密碼</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">權限</th>
                <th className="p-4 text-right font-semibold">編輯</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-white">{user.name}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-400">{user.phoneLast5 || '未設定'}</td>               
                  <td className="px-4 py-3.5"><Badge status={user.role} type="user" /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleOpenModal(user)} className="click-pop text-gray-400 hover:text-sky-500" title="編輯">
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "編輯會員" : "新增會員"} placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="姓名" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input maxLength="5" pattern="\d{5}" className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="手機末五碼" value={formData.phoneLast5} onChange={e => setFormData({...formData, phoneLast5: e.target.value})} />
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1 tracking-widest">權限</label>
            <select className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none appearance-none cursor-pointer shadow-inner tracking-wider text-[13px] md:text-[15px]" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="user" className="bg-gray-900">一般會員</option>
              <option value="admin" className="bg-gray-900">管理員</option>
            </select>
          </div>
          <Button type="submit" className="w-full justify-center mt-4 text-[14px] md:text-[15px]">{editingUser ? "儲存變更" : "新增"}</Button>
        </form>
      </Modal>
    </div>
  );
};



