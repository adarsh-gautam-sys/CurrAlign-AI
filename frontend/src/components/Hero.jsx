import React from 'react';

const Hero = ({ onStartAnalysis, onViewDemo }) => {
    return (
        <section className="rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm overflow-hidden p-8 lg:p-12 relative">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-6 max-w-2xl">
                    <div className="flex flex-col gap-4">
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-primary border border-blue-100">
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            AI-Powered Analysis
                        </span>
                        <h1 className="text-slate-900 text-4xl sm:text-5xl font-black leading-[1.15] tracking-tight">
                            Is Your Curriculum <span className="text-primary">Industry-Ready?</span>
                        </h1>
                        <p className="text-slate-600 text-lg leading-relaxed max-w-lg">
                            Use advanced AI to align your syllabus with current job market requirements and bridge the skills gap effectively.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2">
                        {/* Start Analysis → scrolls to workspace */}
                        <button onClick={onStartAnalysis} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-base font-bold px-6 py-3 rounded-lg transition-all shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                            <span>Start Analysis</span>
                        </button>
                        {/* View Demo → triggers one-click demo flow */}
                        <button onClick={onViewDemo} className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-base font-bold px-6 py-3 rounded-lg transition-all shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                            <span>View Demo</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 pt-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 bg-cover bg-center" data-alt="User avatar 1" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCoo-s-kjfBd8Pb-POhuXB-rVzuOXqjlZmEYpL6ipaE6Iu9n2UeepEGqaXfhOO-msBs5jBKz_tsZsb80ge7Vm3H777deIe5mXUzrZjaRgriIc7pqd-DM72NPeOroLQu_5D09osorD5YPihEkK6hefq33xC9Lvsiof7qzHAumjdK4-h6-aY4edV-m5PzlG9x8GwJdJxiPvsWLR9Q2QWhC-wAJ6W-DZ5vaCAgYuv2pgqtFxDO5RSFgk0c24_6kGVUL7EHaXpsx7E4OsYI')" }}></div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 bg-cover bg-center" data-alt="User avatar 2" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATCXD6HDN-npCPwr0h7-sGWgLHK_Is_qZ7ERI9lyT9XM1NLSnbM4ghIMJWkpWxsP_uU9M-A77tAA6pNRobI61YSiM3c_Zf8z3BV_0_7zooMfSTrwC0bt7N2Qv4TQck-lEQ1o10LBYG4gOwSk2ieYclQO8lmqVz6lnkXLwbg7Q67Gh8lyK5EYhDyXWyKiuOsMDMEUsnR4SVt_aQVVv8rRg8ZmUVT-_qnlOA1cFNtY3ZUhjHFFZTVa8o2JL4xphxt-db-Pa3YJ2uj4Iy')" }}></div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 bg-cover bg-center" data-alt="User avatar 3" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAiMaVH_DZ-QgMaFgO5Cwf8BxkrzESaOqjmLi8drqa0j-PmUmUm0IuNqzipEv-eD3b0gHXk6YDtwWnr8UJOpfDehpo8p3hrJ7oJPouZAy5GXD9RJDNEsgcPob0iQ0dYcp-7dbnYUCTvBwlsthOgkhjZ_u5DrYKrU-NFBKEwvqUA-QiQGH5MdWMEfMks5OzZjk8VZyI9_frBeaJQkP7YVLKzG5qErUD-K74BIEjNjrD1Epv2owRVxW7Q2sBMZpJqwpVDmTmF3WRai3xx')" }}></div>
                        </div>
                        <p>Trusted by 500+ educators</p>
                    </div>
                </div>
                <div className="relative h-full min-h-[300px] lg:min-h-[400px] rounded-xl overflow-hidden shadow-xl border border-slate-100">
                    <div className="absolute inset-0 bg-cover bg-center" data-alt="Modern office team analyzing data on screens" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAfAEO8EDUq_5NFI5h70_1x9ZsABuXOC2HN-iAuDr0BaZsAJ5Ky1sliT9gR9EJ3boLULAUlBlMK0NJAhh-v4jHcETactxhib7gMz_yHsGUEVBP9sGLYFYSK2Fa_7K_ielp-xRjWYOAi7hCV0uATmS56QZNqTTJjMX0oAcTVfeUpF3Km3UnkWCgzfsOTiJJptBg-9B5Si7bGuSrWC4PY_mZWwe7w0YxV2w_iFGul-W3F1XmwWczN1a8qBx3BnnGUFCBdaFK2740hc-c4')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
