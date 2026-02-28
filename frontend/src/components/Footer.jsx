import React from 'react';

const Footer = ({ status, isConnected }) => {
    return (
        <footer className="w-full bg-white border-t border-slate-200 mt-12 py-8">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-slate-500 text-sm">
                    © 2026 CurrAlign AI. All rights reserved.
                </div>
                <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">code</span>
                    Built for AMD Slingshot Hackathon
                    <span className={`ml-4 px-2 py-1 rounded text-xs font-bold text-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                        {status}
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
