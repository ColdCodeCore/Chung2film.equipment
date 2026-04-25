import React, { useState } from 'react';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import Badge from '../common/Badge';

// === 雙軌設計：最新公告卡片元件 ===
export default function NewsCard ({ n, isAdmin, onEdit, onDelete, showConfirm, isMobileDevice }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    showConfirm('確定要刪除這則公告嗎？', () => onDelete(n.id));
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(n);
  };

  return (
    <div 
      className={isMobileDevice 
        ? "border-b border-white/5 last:border-0 p-5 hover:bg-white/5 transition-colors cursor-pointer" 
        : "bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-glass border border-white/10 hover:bg-white/10 transition-colors cursor-default"
      }
      onClick={() => { if (isMobileDevice) setIsExpanded(!isExpanded); }}
    >
      <div className="flex justify-between items-center mb-3">
        <Badge status="最新公告" />
        <div className="flex items-center gap-3">
          {/* 只顯示日期，隱藏具體時間 */}
          <span className="text-gray-400 text-xs md:text-sm font-mono tracking-wider">{n.date ? n.date.split(' ')[0] : ''}</span>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={handleEdit} className="click-pop text-gray-400 hover:text-sky-500 p-1 rounded hover:bg-white/10"><Edit size={16} /></button>
              <button onClick={handleDelete} className="click-pop text-gray-400 hover:text-red-500 p-1 rounded hover:bg-white/10"><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="text-lg md:text-xl font-bold text-[#c9ebff] tracking-wider mb-2 leading-snug">{n.title}</h3>
      
      {/* 收合區塊：手機版動畫收合，電腦版強制展開 */}
      <div className={isMobileDevice
        ? `grid transition-[grid-template-rows,opacity,margin-top] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'}`
        : `grid grid-rows-[1fr] opacity-100 mt-3 transition-none`
      }>
        <div className="overflow-hidden min-h-0">
          <p className="text-gray-300 text-sm md:text-[15px] tracking-wider leading-relaxed whitespace-pre-wrap">{n.content}</p>
          
          {n.imageUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex justify-center">
              <img src={n.imageUrl} alt="News attachment" className="w-full max-h-[80vh] h-auto object-contain rounded-xl" />
            </div>
          )}
        </div>
      </div>
      
      {n.linkUrl && (
        <div className="flex justify-center mt-5" onClick={(e) => e.stopPropagation()}>
          <a href={n.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-bold text-sm tracking-wider bg-sky-500/10 px-6 py-2.5 rounded-full border border-sky-500/20 transition-all hover:bg-sky-500/20">
            <ExternalLink size={16} /> {n.linkText || '點此前往相關連結'}
          </a>
        </div>
      )}
    </div>
  );
};