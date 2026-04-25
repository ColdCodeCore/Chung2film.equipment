import React,{ useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import Button from './Button';
import { fixMobileViewport } from '../../utils/helpers';

export default function Dialog ({ dialog, closeDialog }) {
  const [render, setRender] = useState(dialog.isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (dialog.isOpen) {
      setRender(true);
      setIsClosing(false);
    } else if (render) {
      setIsClosing(true);
      const timer = setTimeout(() => setRender(false), 300); 
      return () => clearTimeout(timer);
    }
  }, [dialog.isOpen, render]);

  if (!render) return null;
  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}>
      <div className={`bg-black/60 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 ${isClosing ? 'window-pop-out' : 'window-pop-in'}`}>
        <h3 className="text-[15px] md:text-[17px] font-bold tracking-wider mb-3 flex items-center gap-2 text-white whitespace-nowrap">
          {dialog.type === 'confirm' ? <AlertTriangle className="text-[#c4a8b2]" size={24}/> : <AlertCircle className="text-sky-500" size={24}/>}
          {dialog.type === 'confirm' ? '請確認操作' : '系統提示'}
        </h3>
        <p className="text-[13px] md:text-[15px] text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed tracking-wider">{dialog.message}</p>
        <div className="flex justify-end gap-3">
          {dialog.type === 'confirm' && (
            <Button variant="secondary" onClick={() => { fixMobileViewport(false); closeDialog(); }}>取消</Button>
          )}
          <Button variant={dialog.type === 'confirm' ? 'danger' : 'primary'} onClick={() => { fixMobileViewport(false); dialog.onConfirm?.(); closeDialog(); }}>
            確定
          </Button>
        </div>
      </div>
    </div>
  );
};