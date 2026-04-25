import React from 'react';

export default function Badge ({ status, type = 'item' }) {
  const styles = {
    available: "bg-[#33463f]/30 text-[#b6c9bf] border-[#5d7469]/22",
    borrowed: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    maintenance: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    inquire: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    active: "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24",
    returned: "bg-white/[0.04] text-gray-400 border-white/10",
    renewable: "bg-[#33463f]/30 text-[#b6c9bf] border-[#5d7469]/22",
    '審核中': "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    '已借出': "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24",
    '已退回': "bg-white/[0.04] text-gray-400 border-white/10",
    '已歸還': "bg-white/[0.04] text-gray-400 border-white/10",
    '已逾期': "bg-[#3b1a20]/90 text-[#ffb3b3] border-[#ff4d4d]/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    admin: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    user: "bg-white/[0.04] text-gray-400 border-white/10",
    '最新公告': "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24"
  };

  const labels = {
    available: "在架上", borrowed: "已借出", maintenance: "維修中",
    inquire: "請洽詢", active: "使用中", returned: "已歸還",
    renewable: "可續借", '審核中': "審核中", '已借出': "已借出",
    '已退回': "已退回", '已歸還': "已歸還", '已逾期': "已逾期",
    admin: "管理員", user: "一般會員", '最新公告': '最新公告'
  };

  let label = labels[status] || status;
  if (type === 'user') {
    if (status === 'active') label = '已啟用';
    if (status === 'pending') label = '待審核';
  }

  return <span className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-medium tracking-wider border whitespace-nowrap leading-none ${styles[status] || styles.available}`}>{label}</span>;
};