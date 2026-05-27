import React from 'react';

export function WorkspaceIllus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 背景云朵 */}
      <ellipse cx="80" cy="60" rx="50" ry="20" fill="#E0E7FF" opacity="0.6" />
      <ellipse cx="320" cy="40" rx="40" ry="15" fill="#E0E7FF" opacity="0.5" />
      <ellipse cx="200" cy="30" rx="35" ry="12" fill="#DBEAFE" opacity="0.4" />

      {/* 樱花花瓣 */}
      <g opacity="0.7">
        <circle cx="50" cy="100" r="4" fill="#F9A8D4" />
        <circle cx="55" cy="96" r="3" fill="#F472B6" />
        <circle cx="340" cy="130" r="3.5" fill="#F9A8D4" />
        <circle cx="345" cy="126" r="2.5" fill="#F472B6" />
      </g>

      {/* 显示器 */}
      <rect x="130" y="100" width="140" height="95" rx="8" fill="#1E293B" />
      <rect x="136" y="106" width="128" height="75" rx="4" fill="#F8FAFC" />
      {/* 屏幕内容 */}
      <rect x="146" y="116" width="40" height="6" rx="3" fill="#3B82F6" opacity="0.6" />
      <rect x="146" y="128" width="55" height="4" rx="2" fill="#CBD5E1" />
      <rect x="146" y="136" width="45" height="4" rx="2" fill="#CBD5E1" />
      <rect x="146" y="144" width="50" height="4" rx="2" fill="#CBD5E1" />
      <rect x="210" y="116" width="45" height="40" rx="4" fill="#DBEAFE" />
      <circle cx="232" cy="136" r="8" fill="#93C5FD" />
      {/* 底座 */}
      <rect x="180" y="195" width="40" height="6" rx="3" fill="#475569" />
      <rect x="195" y="201" width="10" height="15" rx="2" fill="#475569" />

      {/* 键盘 */}
      <rect x="150" y="220" width="100" height="30" rx="6" fill="#CBD5E1" />
      <g fill="#94A3B8">
        {[0,1,2,3,4,5,6,7,8,9].map(i => (
          <rect key={i} x={158 + i * 9} y={226} width={7} height={5} rx="1.5" />
        ))}
      </g>

      {/* 任务卡片 */}
      <g>
        <rect x="290" y="160" width="80" height="25" rx="6" fill="#FEF3C7" />
        <rect x="296" y="166" width="30" height="4" rx="2" fill="#F59E0B" opacity="0.5" />
        <rect x="330" y="166" width="15" height="4" rx="2" fill="#10B981" opacity="0.5" />

        <rect x="290" y="190" width="80" height="25" rx="6" fill="#FCE7F3" />
        <rect x="296" y="196" width="25" height="4" rx="2" fill="#EC4899" opacity="0.5" />
        <rect x="325" y="196" width="20" height="4" rx="2" fill="#10B981" opacity="0.5" />
      </g>

      {/* 聊天气泡 */}
      <path d="M30 200 Q30 185 45 185 L80 185 Q95 185 95 200 L95 215 Q95 230 80 230 L55 230 L40 245 L45 230 L45 230 Q30 230 30 215 Z" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <circle cx="50" cy="205" r="3" fill="#60A5FA" />
      <circle cx="62" cy="205" r="3" fill="#60A5FA" />
      <circle cx="74" cy="205" r="3" fill="#60A5FA" />

      {/* 底部装饰 */}
      <path d="M0 290 Q100 260 200 285 Q300 310 400 280 L400 300 L0 300 Z" fill="#E0E7FF" opacity="0.5" />
    </svg>
  );
}

export function EmptyStateIllus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 文件夹 */}
      <rect x="55" y="50" width="90" height="70" rx="6" fill="#E2E8F0" />
      <rect x="55" y="65" width="90" height="55" rx="0" fill="#F1F5F9" />
      <path d="M55 65 L55 56 Q55 50 61 50 L80 50 L90 65 Z" fill="#CBD5E1" />

      {/* 文件夹中的文档 */}
      <rect x="65" y="80" width="30" height="4" rx="2" fill="#93C5FD" opacity="0.6" />
      <rect x="65" y="90" width="45" height="4" rx="2" fill="#CBD5E1" />
      <rect x="65" y="98" width="35" height="4" rx="2" fill="#CBD5E1" />
      <rect x="65" y="106" width="40" height="4" rx="2" fill="#CBD5E1" />

      {/* 放大镜 */}
      <circle cx="130" cy="80" r="14" fill="none" stroke="#94A3B8" strokeWidth="3" />
      <line x1="140" y1="92" x2="150" y2="102" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />

      {/* 小星星 */}
      <path d="M35 40 L38 47 L45 47 L39 52 L42 60 L35 55 L28 60 L31 52 L25 47 L32 47 Z" fill="#FDE68A" opacity="0.7" />
      <path d="M160 35 L162 40 L167 40 L163 44 L165 49 L160 46 L155 49 L157 44 L153 40 L158 40 Z" fill="#FDE68A" opacity="0.5" />
    </svg>
  );
}

export function SakuraDecoration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="45" r="6" fill="#F9A8D4" opacity="0.3" />
      <path d="M50 50 C45 40 40 35 50 30 C60 35 55 40 50 50Z" fill="#F472B6" opacity="0.6" />
      <path d="M50 50 C40 45 35 40 30 50 C35 60 40 55 50 50Z" fill="#F472B6" opacity="0.6" />
      <path d="M50 50 C60 55 65 60 70 50 C65 40 60 45 50 50Z" fill="#F472B6" opacity="0.6" />
      <path d="M50 50 C55 60 60 65 50 70 C40 65 45 60 50 50Z" fill="#F472B6" opacity="0.6" />
      <circle cx="50" cy="50" r="3" fill="#FDF2F8" />
    </svg>
  );
}
