import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '',
  hover = false,
  onClick,
  style
}) => {
  return (
    <div 
      className={`
        bg-white/90 backdrop-blur-sm border border-luxury-200/70 rounded-2xl shadow-lg
        ${hover ? 'hover:bg-white/80 hover:border-gold-400/50 hover:shadow-xl hover:shadow-gold-500/20' : ''}
        transition-all duration-300 ${className}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};