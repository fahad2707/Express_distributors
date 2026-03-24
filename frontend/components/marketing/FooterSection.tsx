"use client";

export function FooterSection() {
  return (
    <footer className="bg-[#06070b] border-t border-white/10 px-6 md:px-10 py-8 md:py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-slate-400/85">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#4f8cff] shadow-[0_0_24px_rgba(124,92,255,0.5)]" />
          <span className="tracking-[0.24em] uppercase">
            Express Distributors
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="relative group">
            <span className="relative pb-[2px] before:absolute before:inset-x-0 before:-bottom-[1px] before:h-[1px] before:origin-left before:scale-x-0 before:bg-slate-300/85 before:transition-transform before:duration-300 group-hover:before:scale-x-100">
              Privacy
            </span>
          </button>
          <button className="relative group">
            <span className="relative pb-[2px] before:absolute before:inset-x-0 before:-bottom-[1px] before:h-[1px] before:origin-left before:scale-x-0 before:bg-slate-300/85 before:transition-transform before:duration-300 group-hover:before:scale-x-100">
              Terms
            </span>
          </button>
          <span className="text-slate-500/85">
            © {new Date().getFullYear()} Express Distributors. All rights
            reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

