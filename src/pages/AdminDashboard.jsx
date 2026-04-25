import React, { useMemo } from 'react';
import { Filter, TrendingUp, Users, Activity } from 'lucide-react';

export default function AdminDashboard ({ items = [], users = [], reservations = [] }) {
  const stats = useMemo(() => {
    const itemCounts = {}; 
    const userRequestCounts = {}; 
    const userDistinctItems = {};

    reservations.filter(r => r.status === '已借出' || r.status === '已歸還').forEach(r => {
      userRequestCounts[r.userId] = (userRequestCounts[r.userId] || 0) + 1;
      if (!userDistinctItems[r.userId]) userDistinctItems[r.userId] = new Set();
      r.items.forEach(item => {
        const idToUse = item.itemId || item.name;
        itemCounts[idToUse] = (itemCounts[idToUse] || 0) + (item.borrowQty || 1);
        userDistinctItems[r.userId].add(idToUse);
      });
    });

    const topItems = Object.keys(itemCounts)
      .map(id => ({ name: items.find(i => i.id === id || i.name === id)?.name || id, count: itemCounts[id] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    
    const topUserRequests = Object.keys(userRequestCounts)
      .map(id => ({ name: users.find(u => u.id === id)?.name || id, count: userRequestCounts[id] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const topUserDistinct = Object.keys(userDistinctItems)
      .map(id => ({ name: users.find(u => u.id === id)?.name || id, count: userDistinctItems[id].size }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const maxItemCount = Math.max(...topItems.map(i => i.count), 1);
    const maxReqCount = Math.max(...topUserRequests.map(u => u.count), 1);
    const maxDistCount = Math.max(...topUserDistinct.map(u => u.count), 1);

    return { topItems, topUserRequests, topUserDistinct, maxItemCount, maxReqCount, maxDistCount };
  }, [items, reservations, users]);

  const BarChart = ({ data, max, color = "bg-sky-500", labelSuffix = "次" }) => (
    <div className="space-y-3">
      {data.length > 0 ? data.map((d, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 md:w-28 text-xs md:text-sm text-gray-300 truncate text-right font-medium tracking-wider">{d.name}</div>
          <div className="flex-1 h-3 md:h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div 
              className={`h-full ${color} rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor] opacity-90`} 
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 md:w-12 text-[10px] md:text-xs text-gray-400 tracking-widest whitespace-nowrap">{d.count} {labelSuffix}</div>
        </div>
      )) : <p className="text-center text-gray-500 text-sm py-4 tracking-widest">尚無數據</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="content-reveal grid md:grid-cols-2 gap-6 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><TrendingUp size={18} className="text-sky-500"/> 熱門器材 (總借出件數)</h3>
          <BarChart data={stats.topItems} max={stats.maxItemCount} color="bg-sky-500" labelSuffix="件" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><Users size={18} className="text-[#b1c8be]"/> 會員活躍度 (申請次數)</h3>
          <BarChart data={stats.topUserRequests} max={stats.maxReqCount} color="bg-[#61756c]" labelSuffix="次" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10 md:col-span-2">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><Activity size={18} className="text-[#c4a8b2]"/> 探索廣度 (借過不同物件數)</h3>
          <BarChart data={stats.topUserDistinct} max={stats.maxDistCount} color="bg-[#66545c]" labelSuffix="種" />
        </div>
      </div>
    </div>
  );
};