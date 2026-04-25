import { useMemo } from 'react';

export const useDynamicItems = (items, reservations) => {
  return useMemo(() => {
    if (!items || !reservations) return [];
    
    return items.map(item => {
      let currentlyBorrowedQty = 0;
      let hasOverdueRecord = false;

      reservations.forEach(res => {
        // 只計算「已借出」與「已逾期」的預約單，因為這些會佔用現有庫存
        if (res.status === '已借出' || res.status === '已逾期') {
          const borrowedItem = res.items?.find(i => i.itemId === item.id || i.name === item.name);
          if (borrowedItem) {
            currentlyBorrowedQty += (borrowedItem.borrowQty || 1);
            
            // 檢查這個被借出的特定器材是否已經逾期
            const now = new Date();
            const endDt = new Date(`${borrowedItem.endDate?.replace(/-/g, '/')} ${borrowedItem.endTime || '23:59'}`);
            if (now > endDt || res.status === '已逾期') {
              hasOverdueRecord = true;
            }
          }
        }
      });

      const availableQty = item.qty - currentlyBorrowedQty;
      let finalStatus = item.status; // 預設使用資料庫原有的狀態 (例如維修中、需洽詢)

      // 只有當器材不是在「維修中(maintenance)」或「需洽詢(inquire)」等特殊狀態時，才進行動態覆寫
      if (finalStatus !== 'maintenance' && finalStatus !== 'inquire') {
        if (availableQty <= 0) {
          // 條件達成：可借數量為 0，且其中有逾期未還的紀錄
          if (hasOverdueRecord) {
            finalStatus = '未歸還';
          } else {
            // 數量為 0 但都還在正常借用期間內
            finalStatus = 'borrowed';
          }
        } else {
          finalStatus = 'available';
        }
      }

      return {
        ...item,
        availableQty: availableQty < 0 ? 0 : availableQty, // 確保畫面庫存不會顯示負數
        status: finalStatus // 覆寫 status 讓卡片判定無法借用
      };
    });
  }, [items, reservations]);
};