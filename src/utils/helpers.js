// 判斷日期是否重疊
export const isDateOverlap = (startD1, startT1, endD1, endT1, startD2, startT2, endD2, endT2) => {
  const dtStart1 = new Date(`${startD1}T${startT1 || '00:00'}`).getTime();
  const dtEnd1 = new Date(`${endD1}T${endT1 || '23:59'}`).getTime();
  const dtStart2 = new Date(`${startD2}T${startT2 || '00:00'}`).getTime();
  const dtEnd2 = new Date(`${endD2}T${endT2 || '23:59'}`).getTime();
  return dtStart1 < dtEnd2 && dtEnd1 > dtStart2; 
};

// 檢查是否逾期
export const checkIsOverdue = (res) => {
    // 1. 如果資料庫已經明確標示為「已逾期」，直接算入 (解決加總漏算的問題)
    if (res.status === '已逾期') return true;
    
    // 2. 原本的邏輯：只有「已借出」才需要動態檢查時間
    if (res.status !== '已借出') return false;
    
    const now = new Date();
    return res.items?.some(item => {
      if (!item.endDate) return false;
      // 沿用您的時間組合寫法，加入 replace 替換連字號，確保 iOS/Safari 不會壞掉
      const endDt = new Date(`${item.endDate.replace(/-/g, '/')} ${item.endTime || '23:59'}`);
      return now > endDt;
    }) || false;
  };

export const generateResId = (reservations) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `ch${yyyy}${mm}${dd}`;
  
  const todayRes = reservations.filter(r => r?.id?.startsWith(prefix));
  const maxNum = todayRes.reduce((max, r) => {
    const numStr = r.id.replace(prefix, '');
    const num = parseInt(numStr, 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  
  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`;
};

// 安全獲取快取的輔助函式
export const getCachedData = () => {
  try {
    const cached = localStorage.getItem('gasDataCache');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
};

// ⭐ 全域防護機制：強制重置手機瀏覽器虛擬鍵盤與視角偏移
export const fixMobileViewport = (scrollToTop = false) => {
  // 1. 強制移除輸入框焦點，讓手機虛擬鍵盤立刻收合
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  // 2. 如果涉及「換頁」，強制將畫面推回最上方，消除位移 Bug
  if (scrollToTop) {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);
  }
};

// 在元件外部或內部加入這個輔助函式取得本機日期
export const getLocalDateString = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000; // 本機與 UTC 的時間差
  return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
};