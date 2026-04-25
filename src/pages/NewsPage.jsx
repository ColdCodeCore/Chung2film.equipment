import React, { useState, useMemo } from 'react';
import { Calendar, Search, Plus, ExternalLink, Image as ImageIcon, Tag, X, Bell } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import NewsCard from '../components/features/NewsCard';
import { useToolbarMorph } from '../hooks/useToolbarMorph';


// === 更新：最新公告頁面 ===
export default function NewsPage ({ news = [], isAdmin, isSimulatingUser, onAddNews, onUpdateNews, onDeleteNews, showConfirm, isMobileDevice }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({ id: '', title: '', content: '', imageUrl: '', linkUrl: '', linkText: '' });
  
  const { searchTerm, setSearchTerm, searchInputRef, containerRef, isSearchOpen, setIsSearchOpen, openSearchMorph, closeSearchMorph, isFilterOpen, setIsFilterOpen, handleFilterClick } = useToolbarMorph();

  // 搜尋與篩選狀態
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // 處理起日變更
  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    // 如果起日大於目前的迄日，就把迄日自動推平到跟起日同一天
    if (newStart && endDate && new Date(newStart) > new Date(endDate)) {
      setEndDate(newStart);
    }
  };

  // 處理迄日變更
  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    // 如果迄日小於目前的起日，就把起日自動拉平到跟迄日同一天
    if (newEnd && startDate && new Date(newEnd) < new Date(startDate)) {
      setStartDate(newEnd);
    }
  };
  
  const handleDateFilterClick = (e) => {
    if (e) e.preventDefault();
    if (isDateFilterOpen) {
      setIsDateFilterOpen(false);
    } else {
      setIsDateFilterOpen(true);
      setIsSearchOpen(false); 
    }
  };

  // 排序與篩選：越新的排越上面，並套用搜尋與日期區間
  const filteredAndSortedNews = useMemo(() => {
    return [...news]
      .filter(n => {
        const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              n.content?.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesDate = true;
        const newsDateStr = n.date?.split(' ')[0];
        // 替換連字號為斜線，解決 iOS/Safari 無法解析 yyyy-mm-dd 的問題
        const safeDateStr = newsDateStr ? newsDateStr.replace(/-/g, '/') : '';
        const newsDateObj = new Date(safeDateStr);
        newsDateObj.setHours(0, 0, 0, 0);

        if (startDate) {
          const startObj = new Date(startDate.replace(/-/g, '/'));
          startObj.setHours(0, 0, 0, 0);
          if (newsDateObj < startObj) matchesDate = false;
        }
        if (endDate) {
          const endObj = new Date(endDate.replace(/-/g, '/'));
          endObj.setHours(0, 0, 0, 0);
          if (newsDateObj > endObj) matchesDate = false;
        }

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        // 優先使用 ID 內建的時間戳進行排序，若無則使用轉換後的日期，確保最新貼文在最上方
        const timeA = parseInt(a.id?.replace('NW_', '')) || new Date(a.date?.replace(/-/g, '/')).getTime() || 0;
        const timeB = parseInt(b.id?.replace('NW_', '')) || new Date(b.date?.replace(/-/g, '/')).getTime() || 0;
        return timeB - timeA;
      });
  }, [news, searchTerm, startDate, endDate]);

  const handleOpenModal = (newsItem = null) => {
    setIsSearchOpen(false);
    setIsDateFilterOpen(false);
    
    if (newsItem) {
      setEditingNews(newsItem);
      setFormData({ 
        id: newsItem.id, 
        title: newsItem.title, 
        content: newsItem.content, 
        imageUrl: newsItem.imageUrl || '', 
        linkUrl: newsItem.linkUrl || '',
        linkText: newsItem.linkText || '' 
      });
    } else {
      setEditingNews(null);
      setFormData({ id: '', title: '', content: '', imageUrl: '', linkUrl: '', linkText: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingNews) {
      onUpdateNews({ ...editingNews, ...formData });
    } else {
      onAddNews(formData);
    }
    setIsModalOpen(false);
  };

  const containerClass = isMobileDevice
    ? "bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden flex flex-col"
    : "space-y-6";

  return (
    <div className="w-full">
      <div className="search-fade fixed left-0 right-0 z-40 bg-transparent py-3 transition-opacity" style={{top: isSimulatingUser ? "104px" : "64px"}}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 toolbar-shell">
          <div className="toolbar-leading justify-end">
            
  {/* 1️⃣ 日期區間篩選 (包含觸發按鈕與輸入框) */}
  <div className={`toolbar-morph ${isDateFilterOpen ? 'is-open date-search-open' : ''}`}>
    {/* 👉 這個就是日曆觸發按鈕 (剛剛可能不小心刪到這個) */}
    <button 
      type="button" 
      className="click-pop toolbar-morph-btn"
      style={{ pointerEvents: 'auto' }}
      onPointerDown={handleDateFilterClick}
      aria-label="展開日期選單"
    >
      <Calendar size={18} />
    </button>

    {/* 展開後的日期輸入框 (加入起迄日防呆邏輯) */}
    <div className={`flex items-center absolute right-[0.5rem] h-full ${!isDateFilterOpen ? 'pointer-events-none' : ''}`} style={{ width: 'calc(100% - 3.25rem)' }}>
       <input 
         type="date" 
          className={`toolbar-morph-date date-input-full-click ${!startDate ? 'border-b border-white/40' : ''}`} // ⭐ 無日期時顯示底線
         value={startDate}
         max={endDate} 
         onChange={handleStartDateChange} 
         onClick={(e) => { try { e.target.showPicker(); } catch(err){} }}
       />
       <span className="date-separator">-</span>
       <input 
         type="date" 
         className={`toolbar-morph-date date-input-full-click ${!endDate ? 'border-b border-white/40' : ''}`} // ⭐ 無日期時顯示底線
         value={endDate}
         min={startDate} 
         onChange={handleEndDateChange} 
         onClick={(e) => { try { e.target.showPicker(); } catch(err){} }}
       />
       {/* 關閉/清除按鈕 */}
       {(startDate || endDate || isDateFilterOpen) && (
         <button 
           type="button" 
           className="ml-1 text-gray-400 hover:text-white transition-colors p-1"
           style={{ pointerEvents: 'auto' }}
           onPointerDown={(e) => {
             e.preventDefault();
             e.stopPropagation();
             if(!startDate && !endDate) {
               setIsDateFilterOpen(false);
             } else {
               setStartDate('');
               setEndDate('');
             }
           }}
         >
           <X size={14} />
         </button>
       )}
    </div>
  </div>

  {/* 2️⃣ 文字搜尋 */}
  <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
    <button 
      type="button" 
      className="click-pop toolbar-morph-btn" 
      style={{ pointerEvents: 'auto' }}
      onPointerDown={(e) => {
        openSearchMorph(e);
        setIsDateFilterOpen(false); // 👉 點擊搜尋時，手動強制收合日期按鈕
      }} 
      aria-label="展開搜尋欄"
    >
      <Search size={18} />
    </button>
    <input 
      ref={searchInputRef}
      className="toolbar-morph-field toolbar-morph-input"
      placeholder="搜尋公告..." 
      value={searchTerm} 
      onChange={e => setSearchTerm(e.target.value)}
      onBlur={closeSearchMorph}
    />
  </div>

  {/* 3️⃣ 新增公告按鈕 (僅管理員可見) */}
  {isAdmin && !isSimulatingUser && (
    <div className="toolbar-morph">
    <Button onClick={() => handleOpenModal()} title="發佈新公告" aria-label="發佈新公告" className="toolbar-morph-btn">
      <Plus size={18} />
    </Button>
    </div>
  )}
</div>
        </div>
      </div>

      <div className="content-reveal pt-24 md:pt-28 relative z-10 max-w-3xl mx-auto">
        {filteredAndSortedNews.length === 0 ? (
          <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass px-4">
             <Bell size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-[15px] md:text-[17px] text-gray-400 tracking-wider">目前還沒有任何符合的公告。</p>
          </div>
        ) : (
          <div className={containerClass}>
            {filteredAndSortedNews.map((n) => (
              <NewsCard key={n.id} n={n} isAdmin={isAdmin && !isSimulatingUser} onEdit={handleOpenModal} onDelete={onDeleteNews} showConfirm={showConfirm} isMobileDevice={isMobileDevice} />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingNews ? "編輯公告" : "發佈新公告"} placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none shadow-inner tracking-wider" placeholder="公告標題" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <textarea required rows={5} className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none shadow-inner tracking-wider resize-none" placeholder="輸入公告內容..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
          <div className="flex items-center gap-3">
            <ImageIcon className="text-gray-400 shrink-0" size={20} />
            <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none shadow-inner tracking-wider text-sm" placeholder="附加圖片網址 (選填)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <div className="flex items-center gap-3">
            <ExternalLink className="text-gray-400 shrink-0" size={20} />
            <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none shadow-inner tracking-wider text-sm" placeholder="附加按鈕連結 (選填)" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
          </div>
          {formData.linkUrl && (
            <div className="flex items-center gap-3">
              <Tag className="text-gray-400 shrink-0" size={20} />
              <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none shadow-inner tracking-wider text-sm" placeholder="自訂連結顯示名稱 (選填)" value={formData.linkText} onChange={e => setFormData({...formData, linkText: e.target.value})} />
            </div>
          )}
          <Button type="submit" className="w-full justify-center mt-6">{editingNews ? "儲存變更" : "發佈公告"}</Button>
        </form>
      </Modal>
    </div>
  );
};