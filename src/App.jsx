import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Eye } from 'lucide-react';

// 1. 引入樣式與設定檔
import './index.css';
import { LOGO_ICON_URL } from './utils/constants'; // 您可以把常數統一放一支檔案

// 2. 引入 API 與工具
import { api } from './api/gasService';
import { isDateOverlap, getCachedData, checkIsOverdue, generateResId, fixMobileViewport, getLocalDateString } from './utils/helpers';

// 3. 引入共用元件與佈局
import Dialog from './components/common/Dialog';
import SpaceLightBalls from './components/common/SpaceLightBalls';
import Header from './components/layout/Header';
import { useDynamicItems } from './hooks/useDynamicItems';

// 4. 引入頁面元件
import ReservationCard from './components/features/ReservationCard';
import LoginScreen from './pages/LoginScreen';
import NewsPage from './pages/NewsPage';
import UserDashboard from './pages/UserDashboard';
import UserCart from './pages/UserCart';
import AdminDashboard from './pages/AdminDashboard';
import AdminReservations from './pages/AdminReservations';
import AdminItems from './pages/AdminItems';
import AdminUsers from './pages/AdminUsers';

const AUTH_SESSION_KEY = 'authSession';

const readStoredAuthSession = () => {
  try {
    const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      if (parsedSession?.userId || parsedSession?.phoneLast5) {
        return {
          userId: parsedSession.userId || '',
          phoneLast5: parsedSession.phoneLast5 || '',
        };
      }
    }

    const legacyUser = localStorage.getItem('currentUser');
    if (legacyUser) {
      const parsedUser = JSON.parse(legacyUser);
      if (parsedUser?.id || parsedUser?.phoneLast5) {
        return {
          userId: parsedUser.id || '',
          phoneLast5: parsedUser.phoneLast5 || '',
        };
      }
    }
  } catch (error) {
    console.error('讀取登入 session 失敗:', error);
  }

  return null;
};

const resolveUserFromSession = (session, users = []) => {
  if (!session || users.length === 0) return null;

  return (
    users.find(user => session.userId && user.id === session.userId) ||
    users.find(user => session.phoneLast5 && user.phoneLast5 === session.phoneLast5) ||
    null
  );
};

export default function App() {
  // === 偵測設備類型：判斷是否為手機平板 (不受螢幕直/橫向解析度影響) ===  
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchAndNarrow = navigator.maxTouchPoints > 0 && window.innerWidth <= 1024;
    return isMobileUA || isTouchAndNarrow;
  });
  //const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'news');
  //const [currentUser, setCurrentUser] = useState(null);
  
  // 狀態管理
  //const [users, setUsers] = useState([]);
  //const [items, setItems] = useState([]);
  //const [itemTypes, setItemTypes] = useState([]);
  //const [reservations, setReservations] = useState([]);
  //const [news, setNews] = useState([]);
  //const [cart, setCart] = useState([]);
  //const [dialog, setDialog] = useState({ isOpen: false });
  
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      // 1. 利用 User-Agent 強制判定主流手機作業系統 (即使橫放變寬，依舊視為手機版)
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      // 2. 輔助判定：如果是支援觸控的設備，且寬度小於 1024px (涵蓋橫向手機與平板)
      const isTouchAndNarrow = navigator.maxTouchPoints > 0 && window.innerWidth <= 1024;
      
      setIsMobileDevice(isMobileUA || isTouchAndNarrow);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 直接從快取初始化狀態，達到瞬間顯示 (0 秒載入) 的效果
  const initCache = getCachedData();
  const [users, setUsers] = useState(() => initCache?.users || []);
  const [items, setItems] = useState(() => initCache?.items || []);
  const [itemTypes, setItemTypes] = useState(() => initCache?.types || []);
  const [reservations, setReservations] = useState(() => initCache?.reservations || []);
  const [news, setNews] = useState(() => initCache?.news || []);
  const [backendMeta, setBackendMeta] = useState(() => initCache?.meta || null);
  const [authSession, setAuthSession] = useState(() => readStoredAuthSession());
  
  // 只有在「完全沒有快取」的情況下，才顯示載入畫面
  const [isLoading, setIsLoading] = useState(() => !initCache); 
  
  const [currentUser, setCurrentUser] = useState(() => resolveUserFromSession(readStoredAuthSession(), initCache?.users || []));
  
  // 從快取讀取最後停留的 Tab 頁面
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (readStoredAuthSession()) {
      return savedTab || 'news';
    }
    return 'news';
  }); 

  // 當 Tab 改變時，自動記錄到快取中
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [isSimulatingUser, setIsSimulatingUser] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [cartAnimObj, setCartAnimObj] = useState(null);
  const [pendingActions, setPendingActions] = useState({});
  const [backgroundSyncCount, setBackgroundSyncCount] = useState(0);
  const pendingActionKeysRef = useRef(new Set());
  const visiblePendingKeysRef = useRef(new Set());

  // ⭐ 修正：在 useState 初始化時，安全地嘗試載入該使用者的購物車
  const [cart, setCart] = useState(() => {
    try {
      const session = readStoredAuthSession();
      if (session && session.userId) {
        const savedCart = localStorage.getItem(`cart_${session.userId}`);
        if (savedCart) return JSON.parse(savedCart);
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (currentUser) {
      const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)); } catch(e){}
      }
    } else {
      setCart([]);
    }
  }, [currentUser]);

  // ⭐ 修正：隨時監聽 cart 變動並儲存，確保不會遺失
  useEffect(() => {
    if (currentUser && currentUser.id) {
      localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    }
  }, [cart, currentUser]);

  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const showAlert = useCallback((message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: null }), []);
  const showConfirm = useCallback((message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm }), []);
  const closeDialog = useCallback(() => setDialog(prev => ({ ...prev, isOpen: false })), []);
  const persistCachedData = useCallback((overrides = {}) => {
    const nextCache = {
      meta: overrides.meta ?? backendMeta,
      types: overrides.types ?? itemTypes,
      items: overrides.items ?? items,
      users: overrides.users ?? users,
      reservations: overrides.reservations ?? reservations,
      news: overrides.news ?? news,
    };
    localStorage.setItem('gasDataCache', JSON.stringify(nextCache));
  }, [backendMeta, itemTypes, items, news, reservations, users]);

  const runWithPending = useCallback(async (key, task, { showOverlay = true } = {}) => {
    if (pendingActionKeysRef.current.has(key)) {
      return false;
    }

    pendingActionKeysRef.current.add(key);
    if (showOverlay) {
      visiblePendingKeysRef.current.add(key);
      setPendingActions(prev => ({ ...prev, [key]: true }));
    }

    try {
      return await task();
    } finally {
      pendingActionKeysRef.current.delete(key);
      if (visiblePendingKeysRef.current.has(key)) {
        visiblePendingKeysRef.current.delete(key);
        setPendingActions(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  }, []);

  const beginPendingAction = useCallback((key, { showOverlay = true } = {}) => {
    if (pendingActionKeysRef.current.has(key)) {
      return false;
    }

    pendingActionKeysRef.current.add(key);
    if (showOverlay) {
      visiblePendingKeysRef.current.add(key);
      setPendingActions(prev => ({ ...prev, [key]: true }));
    }
    return true;
  }, []);

  const endPendingAction = useCallback((key) => {
    pendingActionKeysRef.current.delete(key);
    if (visiblePendingKeysRef.current.has(key)) {
      visiblePendingKeysRef.current.delete(key);
      setPendingActions(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  const loadLatestData = useCallback(async ({ showConnectionAlert = true, showSyncOverlay = false } = {}) => {
    if (showSyncOverlay) {
      setBackgroundSyncCount(prev => prev + 1);
    }

    try {
      const data = await api.getInventory();
      localStorage.setItem('gasDataCache', JSON.stringify(data));
      setBackendMeta(data.meta || null);
      setItems(data.items || []);
      setItemTypes(data.types || []);
      setUsers(data.users || []);
      setReservations(data.reservations || []);
      setNews(data.news || []);
      return data;
    } catch (error) {
      console.error("背景載入資料失敗:", error);
      if (showConnectionAlert && !localStorage.getItem('gasDataCache')) {
        showAlert("無法連接到伺服器載入資料，請稍後再試。");
      }
      throw error;
    } finally {
      if (showSyncOverlay) {
        setBackgroundSyncCount(prev => Math.max(0, prev - 1));
      }
      setIsLoading(false);
    }
  }, [showAlert]);

  const syncLatestDataInBackground = useCallback(({ showSyncOverlay = true } = {}) => {
    loadLatestData({ showConnectionAlert: false, showSyncOverlay }).catch(error => {
      console.error('背景同步最新資料失敗:', error);
    });
  }, [loadLatestData]);

  const pendingActionKeys = useMemo(() => Object.keys(pendingActions), [pendingActions]);
  const globalSyncMessage = useMemo(() => {
    return pendingActionKeys.length > 0 || backgroundSyncCount > 0 ? '同步中' : '';
  }, [backgroundSyncCount, pendingActionKeys]);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (authSession) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authSession));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }

    // 清掉舊的整包 currentUser 快取，避免之後又被誤用。
    localStorage.removeItem('currentUser');
  }, [authSession]);

  // 登入超時檢查機制
  useEffect(() => {
    if (!currentUser) return;
    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
    const handleInactivityLogout = () => {
      setCurrentUser(null); setAuthSession(null); localStorage.removeItem('lastActivity');
      setIsSimulatingUser(false); setCart([]); setActiveTab('news');
      showAlert("因您已閒置超過 60 分鐘，系統已為您自動登出保護帳號安全。");
    };

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_LIMIT_MS) handleInactivityLogout();
    };

    const updateActivity = () => localStorage.setItem('lastActivity', Date.now().toString());

    checkInactivity(); updateActivity();
    window.addEventListener('mousemove', updateActivity); window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity); window.addEventListener('scroll', updateActivity);

    const intervalId = setInterval(checkInactivity, 60000);
    return () => {
      window.removeEventListener('mousemove', updateActivity); window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity); window.removeEventListener('scroll', updateActivity);
      clearInterval(intervalId);
    };
  }, [currentUser, showAlert]);

  // 背景自動同步最新資料 (Stale-While-Revalidate)
  useEffect(() => {
    loadLatestData().catch(() => {});
  }, [loadLatestData]);

  useEffect(() => {
    if (!authSession) {
      if (currentUser) setCurrentUser(null);
      return;
    }

    if (users.length === 0) return;

    const matchedUser = resolveUserFromSession(authSession, users);

    if (!matchedUser) {
      setCurrentUser(null);
      setAuthSession(null);
      setCart([]);
      setIsSimulatingUser(false);
      setActiveTab('news');
      return;
    }

    if (authSession.userId && authSession.userId !== matchedUser.id) {
      const previousCartKey = `cart_${authSession.userId}`;
      const nextCartKey = `cart_${matchedUser.id}`;
      const previousCart = localStorage.getItem(previousCartKey);

      if (previousCart && !localStorage.getItem(nextCartKey)) {
        localStorage.setItem(nextCartKey, previousCart);
      }
    }

    if (
      !currentUser ||
      currentUser.id !== matchedUser.id ||
      currentUser.name !== matchedUser.name ||
      currentUser.role !== matchedUser.role
    ) {
      setCurrentUser(matchedUser);
    }

    if (
      authSession.userId !== matchedUser.id ||
      authSession.phoneLast5 !== (matchedUser.phoneLast5 || '')
    ) {
      setAuthSession({
        userId: matchedUser.id,
        phoneLast5: matchedUser.phoneLast5 || '',
      });
    }
  }, [authSession, currentUser, users]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && activeTab.startsWith('admin_')) setActiveTab('dashboard');
  }, [currentUser, activeTab]);

  useEffect(() => { setIsUserMenuOpen(false); }, [activeTab, currentUser, isSimulatingUser]);


  // --- 核心邏輯：登入與註冊 ---

  // 清空所有驗證訊息 (切換模式或登入/登出時使用)
  const clearAuthMsg = useCallback(() => {
    setAuthError('');
    setAuthSuccess('');
  }, []);

  const handleLogin = (phoneLast5) => {
    clearAuthMsg();
    fixMobileViewport(true); // ⭐ 登入前收合鍵盤並重置滾動

    const normalizedPhoneLast5 = phoneLast5.trim();
    if (!normalizedPhoneLast5) return setAuthError('請輸入末五碼');
    if (!/^\d{5}$/.test(normalizedPhoneLast5)) return setAuthError('請輸入 5 位數字密碼');

    const matchedUsers = users.filter(u => u.phoneLast5 === normalizedPhoneLast5);
    if (matchedUsers.length === 1) {
      const user = matchedUsers[0];
      setCurrentUser(user);
      setAuthSession({
        userId: user.id,
        phoneLast5: user.phoneLast5 || normalizedPhoneLast5,
      });
      localStorage.setItem('lastActivity', Date.now().toString()); 
      
      // ⭐ 登入時載入該使用者的專屬預約清單
      try {
        const savedCart = localStorage.getItem(`cart_${user.id}`);
        setCart(savedCart ? JSON.parse(savedCart) : []);
      } catch (e) { setCart([]); }

      setIsSimulatingUser(false);
      setActiveTab('news'); 

      // ⭐ 修正 2：強制瀏覽器重置滾動條至最上方，消除觸控點偏移 Bug
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 50);

    } else {
      setAuthError('找不到此帳號，請確認密碼是否正確');
    }
  };

  const handleLogout = () => { 
    fixMobileViewport(true);
    setCurrentUser(null); 
    setAuthSession(null);
    clearAuthMsg(); // 登出時清空訊息，確保下次進入是乾淨的
    localStorage.removeItem('lastActivity'); 
    localStorage.removeItem('activeTab'); 
    setIsSimulatingUser(false); 
    setCart([]); 
    setActiveTab('news'); 
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.__ITEM_BORROWING_DEBUG__ = {
      gasApiUrl: (import.meta.env.VITE_GAS_API_URL || '').trim() || '未設定',
      backendMeta,
    };

    if (backendMeta?.version) {
      console.info('[item-borrowing-app] backend version:', backendMeta.version, backendMeta);
    }
  }, [backendMeta]);

  const handleRegister = async (form) => {
    // 註冊前先確保錯誤訊息清空
    setAuthError('');
    setAuthSuccess('');
    fixMobileViewport(true); // ⭐ 註冊送出後收合鍵盤並重置滾動

    const normalizedName = form.name.trim();
    const normalizedPhoneLast5 = form.phoneLast5.trim();

    if (!normalizedName) {
      setAuthError('請輸入會員名稱');
      return false;
    }

    if (!/^\d{5}$/.test(normalizedPhoneLast5)) {
      setAuthError('請輸入 5 位數字密碼');
      return false;
    }

    // 1. 檢查是否已註冊 (失敗路徑：留在註冊頁面並顯示錯誤)
    if (users.some(u => u.phoneLast5 === normalizedPhoneLast5)) { 
      setAuthError('此手機末五碼已被註冊'); 
      return false; // 回傳 false，讓 LoginScreen 組件不執行跳轉
    }

    if (!beginPendingAction('register', { showOverlay: false })) {
      return false;
    }

    const optimisticUser = {
      id: `TEMP_USR_${Date.now()}`,
      name: normalizedName,
      phoneLast5: normalizedPhoneLast5,
      role: 'user',
      status: 'active',
      department: '',
    };

    const nextUsers = [...users, optimisticUser];
    setUsers(nextUsers);
    persistCachedData({ users: nextUsers });
    setAuthSuccess('申請成功！請輸入密碼登入');

    Promise.resolve().then(async () => {
      try {
        await api.addUser({
          name: normalizedName,
          phoneLast5: normalizedPhoneLast5,
          role: 'user',
          status: 'active',
        });
        syncLatestDataInBackground({ showSyncOverlay: false });
      } catch (error) {
        console.error('註冊失敗:', error);
        const rollbackUsers = users;
        setUsers(rollbackUsers);
        persistCachedData({ users: rollbackUsers });
        setAuthSuccess('');
        setAuthError(error.message || '註冊同步失敗，請稍後再試');
      } finally {
        endPendingAction('register');
      }
    });

    return true;
  };

  const handleUpdateUser = async (updatedUser) => {
    const normalizedUser = {
      ...updatedUser,
      name: updatedUser.name.trim(),
      phoneLast5: updatedUser.phoneLast5.trim(),
    };

    if (!normalizedUser.name) {
      showAlert('請輸入會員姓名');
      return false;
    }

    if (!/^\d{5}$/.test(normalizedUser.phoneLast5)) {
      showAlert('手機末五碼必須是 5 位數字');
      return false;
    }

    const isDuplicate = users.some(u => u.id !== normalizedUser.id && u.phoneLast5 === normalizedUser.phoneLast5);
    if (isDuplicate) {
      showAlert('手機末五碼重複！更新失敗');
      return false;
    }

    return runWithPending('saveUser', async () => {
      const result = await api.updateUser(normalizedUser);
      const syncedUser = result?.user || normalizedUser;
      const nextUsers = users.map(user => user.id === syncedUser.id ? { ...user, ...syncedUser } : user);
      const nextCurrentUser = currentUser?.id === syncedUser.id ? { ...currentUser, ...syncedUser } : currentUser;
      const nextAuthSession = authSession && authSession.userId === syncedUser.id
        ? { userId: syncedUser.id, phoneLast5: syncedUser.phoneLast5 || '' }
        : authSession;

      setUsers(nextUsers);
      setCurrentUser(nextCurrentUser);
      setAuthSession(nextAuthSession);
      persistCachedData({ users: nextUsers });
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert('會員資料已更新');
      }
      return success;
    }).catch(error => {
      console.error('更新會員失敗:', error);
      showAlert(error.message || '會員更新失敗，請稍後再試');
      return false;
    });
  };

  const handleAddUser = async (newUserForm) => {
    const normalizedName = newUserForm.name.trim();
    const normalizedPhoneLast5 = newUserForm.phoneLast5.trim();

    if (!normalizedName) {
      showAlert('請輸入會員姓名');
      return false;
    }

    if (!/^\d{5}$/.test(normalizedPhoneLast5)) {
      showAlert('手機末五碼必須是 5 位數字');
      return false;
    }

    if (newUserForm.role === 'admin') {
      showAlert('請從後端設定管理員。');
      return false;
    }

    if (users.some(u => u.phoneLast5 === normalizedPhoneLast5)) {
      showAlert('手機末五碼重複！新增失敗');
      return false;
    }

    return runWithPending('saveUser', async () => {
      const result = await api.addUser({
        ...newUserForm,
        name: normalizedName,
        phoneLast5: normalizedPhoneLast5,
        status: 'active',
      });
      const createdUser = result?.user || {
        id: `TEMP_USR_${Date.now()}`,
        name: normalizedName,
        phoneLast5: normalizedPhoneLast5,
        role: 'user',
        status: 'active',
        department: '',
      };
      const nextUsers = [...users, createdUser];
      setUsers(nextUsers);
      persistCachedData({ users: nextUsers });
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert('會員已新增');
      }
      return success;
    }).catch(error => {
      console.error('新增會員失敗:', error);
      showAlert(error.message || '新增會員失敗，請稍後再試');
      return false;
    });
  };

  const handleUpdateResStatus = async (resId, status) => {
    // 檢查庫存等本地邏輯保持不變
    if (status === '已借出') {
      const targetRes = reservations.find(r => r.id === resId);
      if (!targetRes) return;
      const approvedRes = reservations.filter(r => r.status === '已借出' && r.id !== resId);
      
      for (const reqItem of targetRes.items) {
        const itemTotalQty = items.find(i => i.id === reqItem.itemId || i.name === reqItem.name)?.qty || 1;
        let overlappingQty = 0;

        approvedRes.forEach(ar => {
          ar.items.forEach(ai => {
            if ((ai.itemId === reqItem.itemId || ai.name === reqItem.name) && isDateOverlap(reqItem.startDate, reqItem.startTime, reqItem.endDate, reqItem.endTime, ai.startDate, ai.startTime, ai.endDate, ai.endTime)) {
              overlappingQty += (ai.borrowQty || 1);
            }
          });
        });

        if (overlappingQty + (reqItem.borrowQty || 1) > itemTotalQty) {
          showAlert(`核准失敗！數量不足。\n\n物件：${reqItem.name}\n衝突時段內已出借：${overlappingQty}件\n欲借：${reqItem.borrowQty || 1}件\n總庫存僅有：${itemTotalQty}件。`);
          return false;
        }
      }
    }
    
    // 【樂觀更新】瞬間改變卡片狀態 (審核中 -> 已借出 -> 已歸還)
    return runWithPending(`updateStatus:${resId}`, async () => {
      await api.updateStatus(resId, status);
      const refreshedData = await loadLatestData({ showConnectionAlert: false, showSyncOverlay: true });
      if (!refreshedData) {
        const nextReservations = reservations.map(r => r.id === resId ? { ...r, status } : r);
        setReservations(nextReservations);
        persistCachedData({ reservations: nextReservations });
      }
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert(status === '已歸還' ? '器材已確認歸還' : '預約狀態已更新');
      }
      return success;
    }).catch(error => {
      console.error('更新狀態失敗:', error);
      showAlert(error.message || '更新狀態失敗，請稍後再試');
      return false;
    });
  };

  const toggleSimulation = () => { 
    if (!currentUser || currentUser.role !== 'admin') return; 
    setIsSimulatingUser(!isSimulatingUser); 
    setActiveTab(!isSimulatingUser ? 'news' : 'admin_dashboard'); 
  };
  
  const normalizeHourTime = (value) => {
    if (!value) return '00:00';
    const [hour = '00'] = value.split(':');
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const addToCart = (item) => {
    // 1. 修正重複加入問題：將檢查移到 setCart 外部，優先阻擋
    if (cart.find(i => i.id === item.id)) {
      // ⭐️ 改回顯示已加入提示
      showAlert('此器材已在預約清單中');
      return;
    }

    // 2. 即時利用時間判斷器材是否已逾期，並計算當前借出數量
    const now = new Date();
    let isOverdue = false;
    let borrowedCount = 0;

    reservations.forEach(res => {
      if (res.status === '已借出' || res.status === '已逾期') {
        const borrowedItem = res.items?.find(i => i.itemId === item.id || i.name === item.name);
        if (borrowedItem) {
          borrowedCount += (borrowedItem.borrowQty || 1);
          // 將預計歸還日與現在時間做比對
          const endDt = new Date(`${borrowedItem.endDate?.replace(/-/g, '/')} ${borrowedItem.endTime || '23:59'}`);
          if (now > endDt || res.status === '已逾期') {
            isOverdue = true;
          }
        }
      }
    });

    const currentAvailableQty = item.qty - borrowedCount;

    // 3. 防呆檢查：直接阻擋「逾期未還」與「無可借數量」的狀態
    if (isOverdue && currentAvailableQty <= 0) {
      showAlert('此器材目前逾期尚未歸還，暫不開放借用。');
      return;
    }
    
    if (currentAvailableQty <= 0 || item.status === 'borrowed' || item.status === 'maintenance') {
      showAlert('此器材目前庫存不足。');
      return;
    }
    
    // 4. 正式加入預約清單
    setCart(prev => [...prev, { ...item, borrowQty: 1, startDate: '', endDate: '', startTime: '', endTime: '',
      maxQty: typeof item.availableQty === 'number'
        ? item.availableQty
        : (currentAvailableQty > 0 ? currentAvailableQty : (item.qty || 1))
    }]);
    
    // 觸發加入預約的彈跳動畫：將 cartAnimObj 設為當前器材的 ID
    setCartAnimObj(item.id);
    setTimeout(() => setCartAnimObj(null), 500); // 500 毫秒後重置動畫狀態，讓下次點擊可以再次觸發
  };
  
  const updateCartItem = (index, field, value) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      const itemToUpdate = newCart[index];

      // 🛡️ 防呆機制：如果找不到該陣列元素，直接返回原陣列，避免 undefined 報錯
      if (!itemToUpdate) return prevCart;

      let finalValue = value;
      
      if (field === 'borrowQty') {
        // 🛡️ 安全讀取：優先抓 maxQty，沒有就抓原始 qty，最少保底為 1
        const max = itemToUpdate.maxQty || itemToUpdate.qty || 1;
        if (finalValue > max) finalValue = max;
        if (finalValue < 1) finalValue = 1;
      }
      
      newCart[index] = { ...itemToUpdate, [field]: finalValue };
      return newCart;
    });
  };

  const updateAllCartDates = (field, value) => {
    if (field === 'startTime' || field === 'endTime') value = normalizeHourTime(value);

    // ⭐ 1. 取得當地今天的日期字串
    const todayStr = getLocalDateString(); 

    // ⭐ 2. 第一層防護：傳入的值如果是日期，且早於今天，強制覆寫為今天
    if ((field === 'startDate' || field === 'endDate') && value < todayStr) {
      value = todayStr;
      // 可選：如果您有 showAlert 函式，可以在這裡觸發提醒
      // showAlert('日期不得早於今天，已自動修正！');
    }

    setCart(prevCart => prevCart.map(item => {
      let newItem = { ...item };
      newItem[field] = value;

      if (['startDate', 'startTime', 'endDate', 'endTime'].includes(field)) {
        // ⭐ 3. 第二層防護：確保物件內的起日絕對不小於今天 (雙重保險)
        if (newItem.startDate < todayStr) {
          newItem.startDate = todayStr;
        }

        const startDt = new Date(`${newItem.startDate}T${newItem.startTime || '00:00'}`);
        const endDt = new Date(`${newItem.endDate}T${newItem.endTime || '00:00'}`);
        
        // 如果起日時間大於迄日時間，自動將迄日往後推 1 小時
        if (startDt > endDt) {
           const newEndDt = new Date(startDt.getTime() + 60 * 60 * 1000);
           newItem.endDate = `${newEndDt.getFullYear()}-${String(newEndDt.getMonth() + 1).padStart(2, '0')}-${String(newEndDt.getDate()).padStart(2, '0')}`;
           newItem.endTime = `${String(newEndDt.getHours()).padStart(2, '0')}:00`; 
        }
      }
      return newItem;
    }));
};
  
  const validateCartBeforeSubmit = useCallback(() => {
    if (!currentUser) return '請先登入後再送出預約';
    if (cart.length === 0) return '預約單是空的';

    for (const item of cart) {
      if (!item.startDate || !item.endDate) {
        return `請先完成 ${item.name} 的借用日期設定`;
      }

      if (!item.startTime || !item.endTime) {
        return `請先完成 ${item.name} 的借用時間設定`;
      }

      if (!item.itemId && !item.id) {
        return `找不到 ${item.name} 的器材編號，請重新加入預約單`;
      }

      const startDt = new Date(`${item.startDate}T${item.startTime || '00:00'}`);
      const endDt = new Date(`${item.endDate}T${item.endTime || '00:00'}`);
      if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime()) || startDt >= endDt) {
        return `${item.name} 的借用時段無效，請重新調整`;
      }
    }

    return '';
  }, [cart, currentUser]);

  const submitReservation = async () => { 
    const validationError = validateCartBeforeSubmit();
    if (validationError) {
      showAlert(validationError);
      return false;
    }

    fixMobileViewport(true); // ⭐ 結帳送出後收合鍵盤並重置滾動

    const newResId = generateResId(reservations); 
    const newReservation = { 
      id: newResId, 
      userId: currentUser.id, 
      userName: currentUser.name, 
      items: cart.map(i=>({itemId:i.itemId || i.id, name:i.name, startDate:i.startDate, startTime:i.startTime, endDate:i.endDate, endTime:i.endTime, borrowQty: i.borrowQty})), 
      status: '審核中', 
      submitDate: getLocalDateString()
    };

    if (!beginPendingAction('submitReservation', { showOverlay: false })) {
      return false;
    }

    const previousReservations = reservations;
    const previousCart = cart;
    const nextReservations = [...reservations, newReservation];

    setReservations(nextReservations);
    persistCachedData({ reservations: nextReservations });
    setCart([]); 
    showAlert(`預約單已送出，請等待管理員審核。\n您的預約單號為：${newResId}`); 
    setActiveTab('my_history');

    Promise.resolve().then(async () => {
      try {
        await api.addReservation(newReservation);
        syncLatestDataInBackground({ showSyncOverlay: false });
      } catch (error) {
        console.error('送出申請失敗:', error);
        setReservations(previousReservations);
        persistCachedData({ reservations: previousReservations });
        setCart(previousCart);
        showAlert(error.message || '送出申請失敗，請稍後再試');
      } finally {
        endPendingAction('submitReservation');
      }
    });

    return true;
  };
  
  const addItem = async (d) => {
    return runWithPending('saveItem', async () => {
      const result = await api.addItem({ ...d, status: 'available' });
      const nextItems = result?.item ? [...items, result.item] : items;
      const nextItemTypes = result?.item && !itemTypes.includes(result.item.type)
        ? [...itemTypes, result.item.type]
        : itemTypes;
      const nextNews = result?.news ? [...news, result.news] : news;

      setItems(nextItems);
      setItemTypes(nextItemTypes);
      setNews(nextNews);
      persistCachedData({ items: nextItems, types: nextItemTypes, news: nextNews });
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert('上架成功，且已自動發布系統公告。');
      }
      return success;
    }).catch(error => {
      console.error('上架失敗:', error);
      showAlert(error.message || '上架失敗，請稍後再試');
      return false;
    });
  };

  // 1. 新增貼文
  const addManualNews = async (newsForm) => {
    const newObj = {
      ...newsForm,
      id: `NW_${Date.now()}`,
      date: new Date().toLocaleString('zh-TW', {hour12: false})
    };
    
    return runWithPending('saveNews', async () => {
      await api.addNews(newObj);
      const nextNews = [...news, newObj];
      setNews(nextNews);
      persistCachedData({ news: nextNews });
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert('最新消息發佈成功！');
      }
      return success;
    }).catch(error => {
      console.error('同步至資料庫失敗:', error);
      showAlert(error.message || '最新消息發佈失敗，請稍後再試');
      return false;
    });
  };

  // 2. 編輯貼文
  const handleUpdateNews = async (newsForm) => {
    return runWithPending('saveNews', async () => {
      await api.updateNews(newsForm);
      const nextNews = news.map(n => n.id === newsForm.id ? newsForm : n);
      setNews(nextNews);
      persistCachedData({ news: nextNews });
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert('消息更新成功！');
      }
      return success;
    }).catch(error => {
      console.error('同步至資料庫失敗:', error);
      showAlert(error.message || '消息更新失敗，請稍後再試');
      return false;
    });
  };

  // 3. 刪除貼文
  const handleDeleteNews = async (newsId) => {
    return runWithPending('saveNews', async () => {
      await api.deleteNews(newsId);
      const nextNews = news.filter(n => n.id !== newsId);
      setNews(nextNews);
      persistCachedData({ news: nextNews });
      return true;
    }, { showOverlay: true }).then(success => {
      if (success !== false) {
        showAlert('消息已刪除！');
      }
      return success;
    }).catch(error => {
      console.error('同步至資料庫失敗:', error);
      showAlert(error.message || '消息刪除失敗，請稍後再試');
      return false;
    });
  };

  // ==========================================
  // 核心邏輯：精準計算待處理任務數量 (單一資料來源)
  // ==========================================

  // 1. 定義統一的「任務項目」過濾邏輯：包含「審核中」或「實質已逾期」
  const isTaskItem = useCallback((res) => {
    if (!res) return false;
    // 判斷標準：狀態為審核中、資料庫標記為已逾期，或是時間判定已逾期
    return res.status === '審核中' || res.status === '已逾期' || checkIsOverdue(res);
  }, []);

  const isAdminTaskItem = useCallback((res) => {
    if (!res) return false;
    return res.status === '審核中' || res.status === '已逾期' || checkIsOverdue(res);
  }, []);

  // 2. 預約申請 (購物車) 數量：僅計算目前加入預約單的器材數
  const cartTaskCount = useMemo(() => cart?.length || 0, [cart]);
  
  // 3. 我的紀錄數量：過濾出屬於該會員且處於「任務狀態 (審核中/退回/逾期)」的單據
  const userHistoryTaskCount = useMemo(() => {
    if (!currentUser) return 0;
    return reservations.filter(r => 
      (r.userId === currentUser.id || r.userName === currentUser.name) && isTaskItem(r)
    ).length;
  }, [reservations, currentUser, isTaskItem]);
  
  // 4. 預約管理數量：管理員視角，全系統處於「任務狀態 (審核中/逾期)」的總單據數
  const adminTaskCount = useMemo(() => {
    return reservations.filter(r => isAdminTaskItem(r)).length;
  }, [reservations, isAdminTaskItem]);

  // 5. 計算最外層 Header 紅色正圓泡泡的總數
  const pendingCount = useMemo(() => {
    if (!currentUser) return 0;
    
    // 如果是管理員且非模擬模式，紅點顯示「全系統待處理數」
    if (currentUser.role === 'admin' && !isSimulatingUser) {
      return adminTaskCount;
    }
    
    // 一般會員則顯示「購物車數量 + 自己的審核中/退回/逾期單據數」
    return cartTaskCount + userHistoryTaskCount;
  }, [currentUser, isSimulatingUser, cartTaskCount, userHistoryTaskCount, adminTaskCount]);

  // 輔助狀態：過濾出該會員的所有歷史紀錄 (用於顯示列表)
  const userHistoryReservations = useMemo(() => 
    reservations.filter(r => r.userId === currentUser?.id || r.userName === currentUser?.name),
    [reservations, currentUser]
  );

  // 輔助狀態：判斷該會員目前是否有任何逾期紀錄 (用於阻擋借用功能)
  const userHasOverdue = useMemo(() => 
    userHistoryReservations.some(r => checkIsOverdue(r)),
    [userHistoryReservations]
  );

  const dynamicItems = useDynamicItems(items, reservations);

  return (
    <>
      <SpaceLightBalls />
      <Dialog dialog={dialog} closeDialog={closeDialog} />
      {globalSyncMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#02030A]/42 backdrop-blur-[3px]">
          <div className="flex flex-col items-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            <div className="w-16 h-16 md:w-20 md:h-20 animate-bounce">
              <img src={LOGO_ICON_URL} alt="Syncing" className="w-full h-full object-contain" />
            </div>
            <div className="font-tc2 text-white text-[12px] md:text-[14px] tracking-[0.8em] pl-[0.8em] whitespace-nowrap">
              {globalSyncMessage}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[100dvh] bg-transparent flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            <div className="w-24 h-24 md:w-32 md:h-32 animate-bounce">
              <img src={LOGO_ICON_URL} alt="Loading" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="relative z-10">
          <LoginScreen onLogin={handleLogin} onRegister={handleRegister} authError={authError} authSuccess={authSuccess} clearAuthMsg={() => { setAuthError(''); setAuthSuccess(''); }} />
        </div>
      ) : (
        <div className="min-h-[100dvh] bg-transparent flex flex-col font-tc2 text-gray-200 overflow-x-hidden relative z-10">
          {isSimulatingUser && <div className="bg-sky-500/[0.72] backdrop-blur-md text-white border-b border-sky-500 text-center font-bold flex justify-center items-center gap-4 fixed top-0 left-0 right-0 h-[40px] z-[60] shadow-[0_4px_15px_rgba(14,165,233,0.3)]"><Eye size={20} /><span className="tracking-widest text-[13px] md:text-[15px] whitespace-nowrap">模擬會員視角中</span><button onClick={toggleSimulation} className="click-pop bg-gray-900/80 text-sky-500 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-white transition-colors text-xs tracking-wider whitespace-nowrap">退出模擬</button></div>}

          <Header 
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          pendingCount={pendingCount} // 外層泡泡總數
          cartTaskCount={cartTaskCount} // 👇 傳入算好的預約申請數字
          userHistoryTaskCount={userHistoryTaskCount} // 👇 傳入算好的我的紀錄數字
          adminTaskCount={adminTaskCount} // 👇 傳入算好的預約管理數字
          isSimulatingUser={isSimulatingUser}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          userMenuRef={userMenuRef}
          cartAnimObj={cartAnimObj}
          toggleSimulation={toggleSimulation}

          userHistoryReservations={userHistoryReservations}
        />
          
          <main className={`flex-1 ${isSimulatingUser ? 'pt-[168px]' : 'pt-24'} pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full z-0 relative`}>
            <div key={activeTab} className="page-reveal">
              {activeTab === 'dashboard' && <UserDashboard items={dynamicItems} itemTypes={itemTypes} reservations={reservations} onAddToCart={addToCart} isSimulatingUser={isSimulatingUser} currentUser={currentUser} userHasOverdue={userHasOverdue} isMobileDevice={isMobileDevice} cartAnimObj={cartAnimObj} />}
              {activeTab === 'items' && <UserDashboard items={dynamicItems} itemTypes={itemTypes} reservations={reservations} onAddToCart={addToCart} isSimulatingUser={isSimulatingUser} currentUser={currentUser} userHasOverdue={userHasOverdue} isMobileDevice={isMobileDevice} cartAnimObj={cartAnimObj} />}
              
              {/* 最新消息區塊 */}
              {activeTab === 'news' && <NewsPage news={news} isAdmin={currentUser?.role === 'admin'} isSimulatingUser={isSimulatingUser} onAddNews={addManualNews} onUpdateNews={handleUpdateNews} onDeleteNews={handleDeleteNews} showConfirm={showConfirm} isMobileDevice={isMobileDevice} />}

              {activeTab === 'cart' && <UserCart cart={cart} onRemoveFromCart={(idx) => setCart(cart.filter((_, i) => i !== idx))} onUpdateCartItem={updateCartItem} onUpdateAllCartDates={updateAllCartDates} onSubmitReservation={submitReservation} />}
              
              {activeTab === 'my_history' && (
                <div className="content-reveal space-y-6 relative z-10">
                  <div className="space-y-4">
                    {(userHistoryReservations && userHistoryReservations.length === 0) ? (
                      <p className="text-gray-400 bg-white/5 backdrop-blur-xl p-12 text-center rounded-3xl border border-white/10 shadow-glass font-bold tracking-wider text-[13px] md:text-[15px] whitespace-nowrap">尚無預約紀錄</p>
                    ) : (
                      userHistoryReservations?.map(r => (
                        <ReservationCard key={r.id} res={r} isAdmin={false} />
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'admin_res' && <AdminReservations reservations={reservations} onUpdateStatus={handleUpdateResStatus} />}
              {activeTab === 'admin_dashboard' && <AdminDashboard items={items} users={users} reservations={reservations} />}
              {activeTab === 'admin_items' && <AdminItems items={items} itemTypes={itemTypes} onAddItem={addItem} reservations={reservations} />}
              {activeTab === 'admin_users' && <AdminUsers users={users} onUpdateUser={handleUpdateUser} onAddUser={handleAddUser} showAlert={showAlert} />}
            </div>
          </main>
          
        </div>
      )}
    </>
  );
}
