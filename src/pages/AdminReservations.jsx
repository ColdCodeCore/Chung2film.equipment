import React from 'react';
import { Filter, CheckCircle } from 'lucide-react';
import ReservationCard from '../components/features/ReservationCard'

export default function AdminReservations ({ reservations = [], onUpdateStatus }) {
  const visibleRes = reservations.filter(r => r.status !== '已歸還');

  return (
    <div className="space-y-6">
      <div className="content-reveal space-y-4 relative z-10">
        {visibleRes.map(res => (
          <ReservationCard key={res.id} res={res} isAdmin={true} onUpdateStatus={onUpdateStatus} />
        ))}
        {visibleRes.length === 0 && (
          <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass px-4">
            <CheckCircle className="mx-auto text-[#b1c8be]/80 mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" size={56} />
            <p className="text-[15px] md:text-[17px] text-gray-300 font-bold tracking-wider whitespace-nowrap">目前沒有需要處理的預約單，太棒了！</p>
          </div>
        )}
      </div>
    </div>
  );
};
