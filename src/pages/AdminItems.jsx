import React, { useState } from 'react';
import { Package, Search, Filter, Plus, Edit } from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { checkIsOverdue } from '../utils/helpers';
import { useToolbarMorph } from '../hooks/useToolbarMorph';
import { fixMobileViewport } from '../utils/helpers';

export default function AdminItems ({ items = [], itemTypes = [], onAddItem, reservations = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [newItem, setNewItem] = useState({ name: '', type: itemTypes[0] || '其他', accessories: '', lifespan: '', id: '', qty: 1 });
  
  const { searchTerm, setSearchTerm, searchInputRef, containerRef, isSearchOpen, setIsSearchOpen, openSearchMorph, closeSearchMorph, isFilterOpen, setIsFilterOpen, handleFilterClick } = useToolbarMorph();

  const handleSubmit = async (e) => {
    e.preventDefault();
    fixMobileViewport(false); // 送出時收合鍵盤，不重置滾動
    const success = await onAddItem(newItem);
    if (success !== false) {
      setIsModalOpen(false);
      setNewItem({ name: '', type: itemTypes[0] || '其他', accessories: '', lifespan: '', id: '', qty: 1 });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

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
                value={filterType} 
                onClick={handleFilterClick} // ⭐ 改用 onClick 讓手機一點就開
                onChange={(e) => setFilterType(e.target.value)} 
                
              >
                <option value="all">所有類型</option>
                {itemTypes.map(type => <option key={type} value={type}>{type}</option>)}
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
                placeholder="搜尋器材..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
            <div className="toolbar-morph">
            <Button  onClick={() => { setIsSearchOpen(false); setIsFilterOpen(false); setIsModalOpen(true); }} title="新增器材" aria-label="新增器材" className="toolbar-morph-btn" ><Plus size={18}/></Button>
            </div>
          </div>
        </div>
      </div>

      {/* 調整間距避免與搜尋列重疊 */}
      <div className="content-reveal mt-24 md:mt-28 bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap tracking-wider text-[13px] md:text-[15px]">
            <thead className="bg-black/40 border-b border-white/10 text-gray-300">
              <tr>
                <th className="px-12 py-3.5 font-semibold text-[12px] md:text-[14px]">名稱</th>
                <th className="px-6 py-3.5 font-semibold text-[12px] md:text-[14px]">類型</th>
                <th className="px-6 py-3.5 font-semibold text-[12px] md:text-[14px]">數量 (剩餘/總數)</th>
                <th className="px-6 py-3.5 font-semibold text-[12px] md:text-[14px]">當前狀態</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredItems.map(item => {
                let currentlyUsedQty = 0;
                let hasOverdueRecord = false;

                // 🕵️ 遍歷所有預約單進行實時逾期檢索
                (reservations || []).forEach(r => {
                  if (r.status === '已借出' || r.status === '已逾期') {
                    const borrowedItem = r.items?.find(i => i.itemId === item.id || i.name === item.name);
                    if (borrowedItem) {
                      currentlyUsedQty += (borrowedItem.borrowQty || 1);
                      // 判斷該筆單據是否已逾期
                      if (checkIsOverdue(r)) {
                        hasOverdueRecord = true;
                      }
                    }
                  }
                });

                const currentRemainingQty = item.qty - currentlyUsedQty;
                const isOutOfStock = currentRemainingQty <= 0;
                
                // 🏷️ 狀態優先權：維修 > 逾期/未歸還 > 已借出/在架上
                let displayStatus = item.status;
                if (displayStatus !== 'maintenance' && displayStatus !== 'inquire') {
                  if (hasOverdueRecord) {
                    displayStatus = isOutOfStock ? '已逾期' : '未歸還';
                  } else {
                    displayStatus = isOutOfStock ? 'borrowed' : 'available';
                  }
                }

                return (
                  <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white group-hover:text-sky-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-gray-500" />
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{item.type}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${hasOverdueRecord ? 'text-red-400' : isOutOfStock ? 'text-gray-500' : 'text-sky-400'}`}>
                        {currentRemainingQty > 0 ? currentRemainingQty : 0}
                      </span>
                      <span className="text-gray-600 font-mono text-xs ml-1">/ {item.qty}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={displayStatus} />
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-gray-500 font-medium">
                    目前沒有符合搜尋條件的器材
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增器材" placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="名稱" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <select className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none appearance-none cursor-pointer shadow-inner tracking-wider text-[13px] md:text-[15px]" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
            {itemTypes.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
          </select>
          <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="總數量" type="number" min="1" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
          <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="配件 (選填)" value={newItem.accessories} onChange={e => setNewItem({...newItem, accessories: e.target.value})} />
          <Button type="submit" className="w-full justify-center mt-4 text-[14px] md:text-[15px]">上架</Button>
        </form>
      </Modal>
    </div>
  );
};
