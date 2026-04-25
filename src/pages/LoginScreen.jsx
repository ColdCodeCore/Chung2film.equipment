import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import Button from '../components/common/Button';
import { LOGO_ICON_URL } from '../utils/constants';
import { fixMobileViewport } from '../utils/helpers';

export default function LoginScreen ({ onLogin, onRegister, authError, authSuccess, clearAuthMsg }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', phoneLast5: '' });
  const [loginCode, setLoginCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(loginCode);
    } else {
      // ⭐ 關鍵修正：捕捉 handleRegister 的回傳結果，成功才切換模式
      const success = onRegister(form);
      if (success) {
        setMode('login');
        setForm({ name: '', phoneLast5: '' }); 
        setLoginCode('');
      }
      // 若為 false (失敗)，則什麼都不做，讓使用者停留在註冊頁面查看 authError
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent flex items-center justify-center p-4 relative">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-glass w-full max-w-md transition-all duration-300 z-10 window-pop-in">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="h-16 md:h-20 w-auto flex items-center justify-center mb-4 relative">
            <img src={LOGO_ICON_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </div>
          <p className="text-gray-400 mt-2 text-sm tracking-widest">{mode === 'login' ? '請輸入密碼' : '註冊新帳號'}</p>
        </div>

        {authSuccess && <div className="mb-4 p-3 bg-[#61756c]/[0.34] border border-[#83958d]/[0.34] text-[#d7e7df] text-sm tracking-wider rounded-xl flex items-center gap-2"><CheckCircle size={16} />{authSuccess}</div>}
        {authError && <div className="mb-4 p-3 bg-[#66545c]/[0.34] border border-[#8a727b]/[0.34] text-[#eadce2] text-sm tracking-wider rounded-xl flex items-center gap-2"><AlertCircle size={16} />{authError}</div>}
        
        <form key={mode} onSubmit={handleSubmit} className="space-y-4 window-pop-in">
          {mode === 'login' ? (
             <div>
               <div className="relative">
                 <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                 <input 
                   type="text"
                   maxLength="5"
                   pattern="\d{5}"
                   value={loginCode} 
                   onChange={(e) => setLoginCode(e.target.value)} 
                   className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center text-xl md:text-2xl tracking-widest font-bold text-white placeholder-gray-600 transition-all shadow-inner" 
                   placeholder="_____" 
                   required 
                 />
               </div>
             </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-widest">會員名稱</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full px-4 py-2 bg-black/40 text-white border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-inner" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-widest">會員密碼</label>
                <input 
                  type="text" 
                  maxLength="5"
                  pattern="\d{5}"
                  value={form.phoneLast5} 
                  onChange={(e) => setForm({...form, phoneLast5: e.target.value})} 
                  className="w-full px-4 py-2 bg-black/40 text-white border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-inner" 
                  placeholder="例如: 12345"
                  required 
                />
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full mt-8 py-3 text-[15px] md:text-[17px]">
            {mode === 'login' ? '登入' : '送出註冊'}
          </Button>

          <div className="text-center mt-6">
            <span className="text-sm text-gray-400 tracking-wider">{mode === 'login' ? '找不到帳號？' : '已經有帳號？'}</span>
            <button 
              type="button" 
              onClick={() => { 
                setMode(mode === 'login' ? 'register' : 'login'); 
                clearAuthMsg();
                fixMobileViewport(false);
                setForm({ name: '', phoneLast5: '' });
                setLoginCode('');
              }} 
              className="ml-2 text-sm text-sky-500 font-bold tracking-wider hover:text-sky-300 hover:underline transition-all whitespace-nowrap"
            >
              {mode === 'login' ? '申請加入' : '返回登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};