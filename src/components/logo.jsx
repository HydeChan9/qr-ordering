export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* 左邊小圖示：手機 + 扳手 */}
      <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
        {/* 手機外框 */}
        <div className="w-4 h-6 border border-white/80 rounded-md relative">
          <div className="w-2 h-0.5 bg-white/80 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />
        </div>

        {/* 小扳手（右下角） */}
        <svg
          viewBox="0 0 24 24"
          className="w-3 h-3 absolute -bottom-1 -right-1 text-blue-100 drop-shadow"
        >
          <path
            d="M21 7.5a4.5 4.5 0 0 1-6.36 4.12L9.5 16.75a2 2 0 1 1-2.25-2.25l5.13-5.14A4.5 4.5 0 0 1 21 7.5Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* 右邊文字 */}
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold text-white tracking-wide">
          NovaFix Hub
        </span>
        <span className="text-xs text-blue-200/80">
          On-Site Mobile Repairs
        </span>
      </div>
    </div>
  );
}
