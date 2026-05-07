import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Package } from 'lucide-react';
import { useToolbarMorph } from '../hooks/useToolbarMorph';
import ItemCard from '../components/features/ItemCard';

export default function UserDashboard ({ items = [], itemTypes = [], reservations = [], onAddToCart, isSimulatingUser, currentUser, userHasOverdue, isMobileDevice, cartAnimObj }) {
  const [filterType, setFilterType] = useState('all');
  
  const { searchTerm, setSearchTerm, searchInputRef, containerRef, isSearchOpen, setIsSearchOpen, openSearchMorph, closeSearchMorph, isFilterOpen, setIsFilterOpen, handleFilterClick } = useToolbarMorph();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const containerClass = isMobileDevice
    ? "bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden flex flex-col"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <div className="w-full">
      <div className="search-fade fixed left-0 right-0 z-40 bg-transparent py-3 transition-opacity" style={{top: isSimulatingUser ? "104px" : "64px"}}>
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
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
          </div>
        </div>
      </div>

      <div className="content-reveal pt-28 md:pt-32 relative z-10">
        {userHasOverdue && (
           <div className="bg-[#4a2e35]/90 border border-[#ff4d4d]/40 px-5 py-4 rounded-3xl flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)] mb-6">
             <AlertTriangle className="text-[#ffb3b3] shrink-0" size={24} />
             <p className="text-[#ffe6e6] text-sm md:text-[15px] tracking-wider font-bold">您有逾期未還的器材！在歸還前將暫停您的借用權限。</p>
           </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl py-16 rounded-3xl border border-white/10 shadow-glass px-4">
            <Package size={64} className="text-gray-600 mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-gray-300 tracking-wider text-center whitespace-nowrap">目前沒有符合的器材</h3>
            <p className="text-gray-500 mt-2 text-xs md:text-sm max-w-md text-center tracking-wider">
              若是剛開啟系統，資料可能還在載入中；或者您可以嘗試更換上方的關鍵字與分類。
            </p>
          </div>
        ) : (
          <div className={containerClass}>
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                reservations={reservations} 
                onAddToCart={onAddToCart} 
                currentUser={currentUser}
                userHasOverdue={userHasOverdue}
                isMobileDevice={isMobileDevice}
                cartAnimObj={cartAnimObj}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
