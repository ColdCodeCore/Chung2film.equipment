import React from 'react';
import { Menu, LogOut, Eye } from 'lucide-react';
import { LOGO_FULL_URL } from '../../utils/constants';
import { fixMobileViewport } from '../../utils/helpers';

export default function Header({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  handleLogout, 
  pendingCount,        // 外層總數 (包含購物車 + 我的待處理/逾期)
  cartTaskCount,       // 預約申請數 (購物車)
  userHistoryTaskCount, // 我的紀錄數 (審核中 + 實質逾期)
  adminTaskCount,      // 預約管理數 (全系統審核中 + 逾期)
  isSimulatingUser, 
  isUserMenuOpen, 
  setIsUserMenuOpen, 
  userMenuRef, 
  cart = [], // 加入預設值空陣列，防止 length 報錯崩潰
  cartAnimObj, 
  toggleSimulation,
}) {
  return (
    <header className={`fixed ${isSimulatingUser ? 'top-[40px]' : 'top-0'} left-0 right-0 z-[100] bg-[#05050A]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl flex items-center justify-between px-4 md:px-8 transition-all h-[64px]`}>
      
      {/* Logo 區域 */}
      <div className="flex items-center gap-3 md:gap-6 h-full min-w-0 flex-1">
        <div 
          className="flex items-center cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all shrink-0" 
          onClick={() => { fixMobileViewport(true); setActiveTab('news'); }}
        >
          <img src={LOGO_FULL_URL} alt="Logo" className="h-10 md:h-12 w-auto shrink-0 object-contain" />
        </div>
      </div>

      {/* 右側使用者選單 */}
      {currentUser && (
        <div className="flex items-center gap-4 h-full shrink-0 relative">
          <div ref={userMenuRef} className="relative h-full flex items-center">
            
            <button 
              type="button" 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
              className="click-pop flex items-center gap-2 md:gap-3 bg-white/[0.07] px-3 md:px-4 py-1.5 rounded-full border border-white/10 shadow-inner cursor-pointer hover:bg-white/10 relative"
            >
              {!isUserMenuOpen && pendingCount > 0 && (
                <span 
                  key={cartAnimObj || 'badge'} // 關鍵：讓 key 隨著動畫觸發變更
                  className={`absolute -top-1.5 -right-1 bg-[#f87171] text-white text-[10px] md:text-[11px] w-[18px] h-[18px] md:w-5 md:h-5 p-0 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] font-bold z-20 border border-[#05050A] ${cartAnimObj ? 'animate-pop-smooth' : ''}`}
                >
                {pendingCount}
                </span>)
              }
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-sky-500/[0.42] text-[#edf7ff] flex items-center justify-center font-bold text-xs border border-white/20 shadow-inner">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <span className="font-bold text-gray-200 text-xs md:text-sm tracking-wider hidden sm:block max-w-[120px] truncate">
                {currentUser?.name || 'User'}
              </span>
              <svg className={`w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform shrink-0 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {/* 下拉選單視窗 */}
            <div className={`absolute top-[50px] right-0 w-48 md:w-52 transition-all duration-300 transform origin-top z-[120] ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}>
              <div className="bg-[#05050A]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden py-2 flex flex-col gap-1 px-2 mt-2">
  
                {(!currentUser || currentUser.role !== 'admin' || isSimulatingUser) ? (
                  <>
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('news'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all ${activeTab === 'news' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>最新公告</button>
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('items'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all ${activeTab === 'items' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>器材列表</button>
      
                    {/* 預約申請 */}
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('cart'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all flex justify-between items-center ${activeTab === 'cart' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>
                      <span>預約申請</span>
                      {cartTaskCount > 0 && (
                        <span 
                          key={cartAnimObj || 'menu-cart'}
                          className={`bg-sky-500/80 text-[#f3ecef] w-5 h-5 flex items-center justify-center rounded-full text-[10px] md:text-[11px] font-bold shadow-btn shrink-0 ${cartAnimObj ? 'animate-pop-smooth' : ''}`}
                        >
                          {cartTaskCount}
                        </span>
                      )}
                    </button>
      
                    {/* 我的紀錄 */}
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('my_history'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all flex justify-between items-center ${activeTab === 'my_history' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>
                      <span> 我的紀錄</span>
                      {userHistoryTaskCount > 0 && (
                        <span 
                          className="bg-sky-500/80 text-[#f3ecef] w-5 h-5 flex items-center justify-center rounded-full text-[10px] md:text-[11px] font-bold shadow-btn shrink-0"
                        >
                          {userHistoryTaskCount}
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('news'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all ${activeTab === 'news' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>最新公告</button>
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('admin_dashboard'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all ${activeTab === 'admin_dashboard' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>數據統計</button>
      
                    {/* 預約管理 */}
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('admin_res'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all flex justify-between items-center ${activeTab === 'admin_res' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>
                      <span>預約管理</span>
                      {isUserMenuOpen && adminTaskCount > 0 && (
                        <span className={`bg-sky-500/80 text-[#f3ecef] text-[10px] md:text-[11px] w-5 h-5 flex items-center justify-center rounded-full shadow-btn ${cartAnimObj ? 'animate-pop-smooth' : ''}`}>{adminTaskCount}</span>
                      )}
                    </button>
      
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('admin_items'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all ${activeTab === 'admin_items' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>器材管理</button>
                    <button onClick={() => { fixMobileViewport(true); setActiveTab('admin_users'); setIsUserMenuOpen(false); }} className={`px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl transition-all ${activeTab === 'admin_users' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-300 hover:bg-white/10'}`}>會員管理</button>
                  </>
                )}
  
                <div className="h-px bg-white/10 my-1 mx-2"></div>
                <button onClick={handleLogout} className="px-4 py-2.5 w-full text-left font-bold text-xs md:text-sm rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                  <LogOut size={16} /> 登出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}