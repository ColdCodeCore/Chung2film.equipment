import React from 'react';
import { User, Calendar, Package } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { checkIsOverdue } from '../../utils/helpers';

export default function ReservationCard ({ res, isAdmin, onUpdateStatus }) {
  const firstItem = res.items[0] || {};
  const timePeriod = `${firstItem.startDate || ''} ${firstItem.startTime || '00:00'} ~ ${firstItem.endDate || ''} ${firstItem.endTime || '23:59'}`;
  const itemsStr = res.items.map(i => `${i.name} x${i.borrowQty || 1}`).join('、');

  // 判斷該單是否已逾期
  const isOverdue = checkIsOverdue(res);
  const displayStatus = isOverdue ? '已逾期' : res.status;

  return (
    <div className={`bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border transition-all hover:bg-white/10 mb-4 ${isOverdue ? 'border-[#ff4d4d]/30 hover:border-[#ff4d4d]/50 hover:shadow-[0_0_18px_rgba(239,68,68,0.15)]' : 'border-white/10 hover:border-sky-500/[0.24] hover:shadow-[0_0_18px_rgba(125,168,201,0.08)]'}`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 border-b border-white/10 pb-4">
         <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] md:text-[17px] text-sky-500 tracking-wider whitespace-nowrap">{res.id}</span>
            <span className="text-gray-200 font-medium flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/10 tracking-widest text-xs md:text-sm whitespace-nowrap"><User size={14} className="text-gray-400"/>{res.userName}</span>
            <Badge status={displayStatus} type="res" />
         </div>
         <div className="text-xs md:text-sm text-gray-400 font-mono tracking-wider whitespace-nowrap">申請日：{res.submitDate}</div>
      </div>
      
      <div className={`flex flex-col md:flex-row md:items-center gap-4 text-[11px] md:text-sm bg-black/20 p-3 md:p-3 rounded-xl border mb-4 shadow-inner ${isOverdue ? 'border-[#ff4d4d]/20 text-[#ffb3b3]' : 'border-white/5'}`}>
        <div className={`font-mono flex items-center gap-2 shrink-0 tracking-wider whitespace-nowrap ${isOverdue ? 'text-[#ffb3b3]' : 'text-gray-300'}`}>
          <Calendar size={16} className={isOverdue ? 'text-[#ff4d4d]' : 'text-sky-500'}/>
          {timePeriod}
        </div>
        <div className="hidden md:block text-gray-600">|</div>
        <div className={`font-medium flex items-center gap-2 break-all leading-relaxed tracking-wider ${isOverdue ? 'text-[#ffb3b3]' : 'text-gray-200'}`}>
          <Package size={16} className={`shrink-0 ${isOverdue ? 'text-[#ff4d4d]/70' : 'text-sky-500/70'}`}/>
          {itemsStr}
        </div>
      </div>

      {isAdmin && res.status !== '已歸還' && res.status !== '已退回' && (
        <div className="flex flex-row flex-wrap sm:flex-nowrap justify-end gap-2 pt-3">
          {res.status === '審核中' && (
            <>
              <Button variant="danger" onClick={() => onUpdateStatus(res.id, '已退回')} className="press-reveal-btn press-danger py-2.5 px-5 w-auto">退回申請</Button>
              <Button variant="success" onClick={() => onUpdateStatus(res.id, '已借出')} className="press-reveal-btn press-success py-2.5 px-5 w-auto">核准借出</Button>
            </>
          )}
          {res.status === '已借出' && (
            <Button variant="primary" onClick={() => onUpdateStatus(res.id, '已歸還')} className="press-reveal-btn press-primary py-2.5 px-5 w-auto">確認歸還</Button>
          )}
        </div>
      )}
    </div>
  );
};
