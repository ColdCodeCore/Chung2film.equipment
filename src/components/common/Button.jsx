import React from 'react';

export default function Button({ children, onClick, variant = 'primary', className = '', type = "button", ...props }) {
  const baseStyle = "click-pop px-4 py-2 rounded-full font-medium tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-[13px] md:text-[15px]";
  const variants = {
    primary: "bg-sky-500/[0.34] text-[#edf7ff] hover:bg-sky-500/[0.28] active:bg-sky-500 border border-sky-500/20 shadow-btn",
    secondary: "bg-white/[0.045] text-gray-200 border border-white/8 hover:bg-white/[0.07]",
    danger: "bg-[#5b4f55]/[0.34] text-[#eadfe3] hover:bg-[#5b4f55]/[0.28] border border-[#8d7a83]/[0.18]",
    success: "bg-[#53635d]/[0.34] text-[#e4efe9] hover:bg-[#53635d]/[0.28] border border-[#83958d]/[0.18]"
  };
  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}