import React, { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import Badge from '../common/Badge';

// === 雙軌設計：器材卡片 ===
export default function ItemCard ({ item, reservations, onAddToCart, currentUser, userHasOverdue, isMobileDevice, cartAnimObj }) {
  // 判斷是否正在播放動畫
  const isAnimating = cartAnimObj === item.id;
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // 安全地取出該器材被預約的時段 (替換掉容易報錯的 flatMap)
  const itemReservations = [];
  (reservations || []).forEach(r => {
    if (r.status === '已借出' && Array.isArray(r.items)) {
      r.items.forEach(i => {
        if (i.itemId === item.id || i.name === item.name) {
          itemReservations.push({ ...i, userId: r.userId, userName: r.userName });
        }
      });
    }
  });

  const now = new Date();
  const currentUses = itemReservations
    .filter(i => {
      const start = new Date(`${i.startDate}T${i.startTime || '00:00'}`);
      const effectiveStart = new Date(start.getTime() - 2 * 60 * 60 * 1000);
      const end = new Date(`${i.endDate}T${i.endTime || '23:59'}`);
      return now >= effectiveStart && now <= end;
    });

  const currentlyUsedQty = currentUses.reduce((sum, i) => sum + (i.borrowQty || 1), 0);
  const currentRemainingQty = item.qty - currentlyUsedQty;
  const isOutOfStock = currentRemainingQty <= 0;
  
  const isCurrentlyBorrowedByMe = currentUses.some(i => i.userId === currentUser?.id || i.userName === currentUser?.name);
  
  let displayStatus = item.status;
  if (displayStatus !== 'maintenance' && displayStatus !== 'inquire') {
    if (isCurrentlyBorrowedByMe) {
      displayStatus = 'renewable';
    } else {
      displayStatus = isOutOfStock ? 'borrowed' : 'available';
    }
  }

  const disableAddBtn = (displayStatus !== 'available' && displayStatus !== 'renewable') || userHasOverdue;
  let btnTitle = displayStatus === 'available' ? '加入預約單' : (displayStatus === 'renewable' ? '申請續借' : '暫不可借用');
  if (userHasOverdue) btnTitle = '有逾期未還器材，暫停借用功能';

  const opacityClass = (displayStatus !== 'available' && displayStatus !== 'renewable') ? 'opacity-80' : '';

  return (
    <div 
      className={isMobileDevice
        ? `border-b border-white/5 last:border-0 p-4 sm:p-5 flex flex-col hover:bg-white/5 transition-colors select-none cursor-pointer ${opacityClass}`
        : `bg-white/5 backdrop-blur-xl rounded-3xl shadow-glass border border-white/10 p-6 flex flex-col hover:-translate-y-1 hover:bg-white/10 transition-all select-none cursor-default ${opacityClass}`
      }
      onClick={() => { if (isMobileDevice) setShowMobileDetails(!showMobileDetails); }}
    >
      {/* 標題與標籤區域：根據設備動態調整排列 */}
      {/* ⭐ 根據您提供的程式碼，將外層改為 flex-row 實現同一列對齊，並移除重複的手機版判斷 */}
      <div className="flex flex-row items-center justify-between gap-4 w-full">
        
        {/* 左側：器材資訊區塊 (名稱與標籤) */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          <h3 className="font-bold text-[15px] sm:text-[17px] text-white tracking-wider line-clamp-2 leading-snug break-words">
            {item.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center bg-black/40 text-gray-300 border border-white/10 text-[11px] sm:text-xs px-3 py-1 rounded-full shadow-sm tracking-wider whitespace-nowrap leading-none">{item.type}</span>
            <span className={`inline-flex items-center text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full border shadow-sm tracking-wider whitespace-nowrap leading-none ${isOutOfStock ? 'text-[#eadce2] bg-[#66545c]/[0.38] border-[#8a727b]/[0.34]' : 'text-[#d4eeff] bg-sky-500/[0.22] border-sky-500/[0.28]'}`}>
              剩餘: {currentRemainingQty > 0 ? currentRemainingQty : 0} / {item.qty}
            </span>
            <Badge status={displayStatus} />
          </div>
        </div>
        
        {/* 右側：+ 號按鈕區塊 (與左側資訊橫向對齊) */}
        <div className="shrink-0 flex items-center justify-center">
          <button 
            className={`circle-add-btn flex items-center justify-center text-2xl font-bold 
              ${isAnimating 
                // 動畫發光狀態
                ? 'animate-btn-pop' 
                // 平常狀態：增加 hover 時的微小放大與陰影回饋
                : 'bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/40 hover:scale-110 hover:shadow-[0_0_10px_rgba(56,189,248,0.3)]'
              }                    
              ${disableAddBtn ? 'text-gray-500 border-white/10 cursor-not-allowed opacity-60' : ''}`
            }
            disabled={disableAddBtn} 
            onClick={(e) => { e.stopPropagation(); if (!disableAddBtn) onAddToCart(item); }}
            title={btnTitle}
          >
            {!disableAddBtn ? <Plus size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* 展開詳情區塊：電腦版強制顯示，手機版以動畫收合 */}
      <div className={isMobileDevice
        ? `grid ${showMobileDetails ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'} transition-all duration-500 ease-in-out border-t border-white/5 pt-4 flex-1 overflow-hidden`
        : `flex flex-col opacity-100 mt-4 border-t border-white/10 pt-4 flex-1 overflow-visible`
      }>
        <div className="min-h-0 w-full">
          <p className="text-xs md:text-sm text-gray-400 mb-3 tracking-wider">配件: {item.accessories || '無'}</p>
          
          {itemReservations.length > 0 && (
            <div className="mb-2 bg-[#4d3c43]/30 border border-[#7c666d]/40 p-3 rounded-2xl text-xs md:text-sm text-[#c2acb3] w-full overflow-hidden">
              <p className="font-bold mb-1 flex items-center gap-1 tracking-wider whitespace-nowrap"><Calendar size={12}/> 已被預約時段：</p>
              <ul className="list-disc pl-4 space-y-1">
                {itemReservations.map((ir, idx) => (
                  <li key={idx} className="tracking-wider">{ir.startDate} {ir.startTime || '00:00'} ~ {ir.endDate} {ir.endTime || '23:59'} <span className="font-bold whitespace-nowrap">(借 {ir.borrowQty} 件)</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};