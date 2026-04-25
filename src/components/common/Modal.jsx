import React,{ useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fixMobileViewport } from '../../utils/helpers';

export default function Modal ({ isOpen, onClose, title, children, type = "default", size = "md", placement = "center" }) {
  const [render, setRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setIsClosing(false);
    } else if (render) {
      setIsClosing(true);
      const timer = setTimeout(() => setRender(false), 300); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, render]);

  if (!render) return null;
  const headerColor = type === "danger" ? "text-[#c4a8b2]" : "text-white";
  const maxWidth = size === "lg" ? "max-w-2xl" : (size === "sm" ? "max-w-md" : "max-w-lg");
  return (
    <div className={`fixed inset-0 z-[60] flex ${placement === "top" ? "items-start justify-center pt-24 md:pt-28" : "items-center justify-center"} p-4 bg-black/70 backdrop-blur-sm print:hidden ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}>
      <div className={`bg-black/60 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto transform transition-all ${isClosing ? 'window-pop-out' : 'window-pop-in'}`}>
        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-black/40 z-10">
          <h3 className={`text-lg md:text-xl font-bold tracking-wider whitespace-nowrap ${headerColor} flex items-center gap-2`}>
            {type === "danger" && <AlertTriangle size={24} />}
            {title}
          </h3>
          <button onClick={() => { fixMobileViewport(false); onClose(); }} className="click-pop text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 text-gray-200">{children}</div>
      </div>
    </div>
  );
};
