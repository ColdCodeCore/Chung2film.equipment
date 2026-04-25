import { useState, useEffect, useRef, useCallback } from 'react';

export const useToolbarMorph = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const containerRef = useRef(null); // 綁定在整條 Toolbar 的容器上

  const openSearchMorph = useCallback((e) => {
    if (e) {
      e.stopPropagation(); // 防止點擊冒泡觸發外部收合
    }

    // ⭐️ 將狀態分離，避免 React 批次更新時造成邏輯打結
    setIsFilterOpen(false);
    setIsSearchOpen(prev => {
      const next = !prev; // 判斷下一個狀態是否為「展開」，若已展開，再次點擊按鈕可手動收合
      if (next) {
        setTimeout(() => {
          if (searchInputRef.current) searchInputRef.current.focus();
        }, 100);
      }
      return next;
    });
  }, []);

  const closeSearchMorph = useCallback(() => {
    // 現在統一由外部點擊偵測來收合，不依賴 onBlur
    setSearchTerm(prev => {
      if (!prev.trim()) setIsSearchOpen(false);
      return prev;
    });
  }, []);

  const handleFilterClick = useCallback((e) => {
    // 延遲改變狀態，確保手機版原生 select 能夠正常彈出不被切斷
    setTimeout(() => {
      setIsFilterOpen(true);
      setIsSearchOpen(false);
    }, 50);
  }, []);

  // ⭐️ 外部點擊偵測：精準判定點擊範圍，徹底取代容易互相干擾的 onBlur 事件
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFilterOpen(false);
        setSearchTerm(prev => {
          if (!prev.trim()) setIsSearchOpen(false);
          return prev;
        });
      }
    };

    // 同時綁定 mouse 和 touch 事件，確保手機端滑動與點擊都能精準捕捉
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return {
    searchTerm, setSearchTerm, searchInputRef, containerRef,
    isSearchOpen, setIsSearchOpen, openSearchMorph, closeSearchMorph,
    isFilterOpen, setIsFilterOpen, handleFilterClick
  };
};