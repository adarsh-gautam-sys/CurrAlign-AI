import React from 'react';

const Navbar = ({ onNavigate, hasAnalysis }) => {

    const handleGetStarted = () => {
        // Smart nav: if analysis exists → readiness, else → workspace upload
        if (hasAnalysis) {
            onNavigate('readiness');
        } else {
            onNavigate('workspace');
        }
    };

    return (
        <div className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <header className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('top')}>
                        <div className="text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">analytics</span>
                        </div>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight hidden sm:block">CurrAlign AI</h2>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight sm:hidden">CurrAlign</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => onNavigate('top')} className="text-slate-600 hover:text-primary text-sm font-medium transition-colors bg-transparent border-none cursor-pointer">Home</button>
                            <button onClick={() => onNavigate('workspace')} className="text-slate-600 hover:text-primary text-sm font-medium transition-colors bg-transparent border-none cursor-pointer">Analyze</button>
                            <button onClick={() => onNavigate('about')} className="text-slate-600 hover:text-primary text-sm font-medium transition-colors bg-transparent border-none cursor-pointer">About</button>
                        </nav>
                        <button onClick={handleGetStarted} className="bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-primary/20">
                            Get Started
                        </button>
                    </div>
                </header>
            </div>
        </div>
    );
};

export default Navbar;
