import React from 'react';
import { Calendar, Package, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import { getLocalDateString } from '../utils/helpers';

export default function UserCart ({ cart = [], onRemoveFromCart, onUpdateCartItem, onUpdateAllCartDates, onSubmitReservation,item }) {
  const globalDates = cart[0] || {};

  return (
    <div className="content-reveal max-w-3xl mx-auto space-y-6 relative z-10">
      {cart.length === 0 ? (
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass px-4">
          <p className="text-[15px] md:text-[17px] text-gray-300 font-bold tracking-wider whitespace-nowrap">預約單是空的，快去器材庫逛逛吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-glass border border-white/10">
            <h3 className="font-bold text-[15px] md:text-[17px] text-sky-500 mb-4 flex items-center gap-2 tracking-wider">
              <Calendar size={18}/> 借用期間設定
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-gray-500 shrink-0 text-xs md:text-sm tracking-wider">起</span>
                <input 
                  type="date" 
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[7.2rem] md:w-[7.8rem] text-center shrink-0 transition-colors shadow-inner date-input-full-click" 
                  value={globalDates.startDate} 
                  min={getLocalDateString()}
                  onChange={(e) => onUpdateAllCartDates('startDate', e.target.value)} 
                  onClick={(e) => { try { e.target.showPicker(); } catch(err){} }}
                />
                <select className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[4.6rem] md:w-[5.2rem] text-center shrink-0 transition-colors shadow-inner cursor-pointer" value={globalDates.startTime} onChange={(e) => onUpdateAllCartDates('startTime', e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(time => <option key={time} value={time} className="bg-gray-900">{time}</option>)}
                </select>
              </div>
              <div className="text-gray-600 hidden md:block px-2">—</div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-gray-500 shrink-0 text-xs md:text-sm tracking-wider">迄</span>
                <input 
                  type="date" 
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[7.2rem] md:w-[7.8rem] text-center shrink-0 transition-colors shadow-inner date-input-full-click" 
                  value={globalDates.endDate}
                  // ⭐ 修改這裡：確保最小限制日期是「起日」或「今天」，兩者取較晚的那一天
                  min={globalDates.startDate && globalDates.startDate > getLocalDateString() ? globalDates.startDate : getLocalDateString()} 
                  onChange={(e) => onUpdateAllCartDates('endDate', e.target.value)} 
                  onClick={(e) => { try { e.target.showPicker(); } catch(err){} }}
                />
                <select className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[4.6rem] md:w-[5.2rem] text-center shrink-0 transition-colors shadow-inner cursor-pointer" value={globalDates.endTime} onChange={(e) => onUpdateAllCartDates('endTime', e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(time => <option key={time} value={time} className="bg-gray-900">{time}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-glass border border-white/10">
            <h3 className="font-bold text-[15px] md:text-[17px] text-gray-200 mb-4 flex items-center gap-2 tracking-wider">
              <Package size={18}/> 預約器材清單
            </h3>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-3 md:p-4 rounded-xl border border-white/5 shadow-inner transition-colors hover:border-white/10 hover:bg-black/30 group">
                  
                  <span className="font-bold text-[14px] md:text-[15px] text-gray-200 truncate flex-1 pr-4 tracking-wider text-sky-100">{item.name}</span>
                  
                  <div className="flex items-center justify-end gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 tracking-wider shrink-0">數量</span>
                      <select className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 text-white text-center text-[13px] min-w-[70px] shadow-inner transition-colors" value={item.borrowQty} onChange={(e) => onUpdateCartItem(index, 'borrowQty', parseInt(e.target.value) || 1)}>
                        {/* ⭐ 加入 fallback 防呆機制：如果 maxQty 遺失，自動抓總數量 item.qty，最少保底給 1 */}
                        {Array.from({ length: item?.maxQty || item?.qty || 1 }, (_, i) => i + 1).map(q => (
                          <option key={q} value={q} className="bg-gray-900">
                            {q} / {item?.maxQty || item?.qty || 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => onRemoveFromCart(index)} className="click-pop text-gray-500 hover:text-[#f87171] p-2 hover:bg-white/[0.05] rounded-xl transition-colors shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-6 mt-2 border-t border-white/10">
              <Button onClick={onSubmitReservation} className="px-6 md:px-8 py-3 w-full md:w-auto text-[14px] md:text-[15px]">
                送出預約申請
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};