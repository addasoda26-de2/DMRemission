import React from 'react';
import {
  Droplets,
  Users,
  History,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

export type NavTab = 'record' | 'patients' | 'history' | 'dashboard' | 'sheets';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userRole: 'vhv' | 'nurse';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  userRole,
}) => {
  const tabs = [
    {
      id: 'record' as NavTab,
      label: 'บันทึกน้ำตาล',
      icon: Droplets,
      badge: 'อสม.',
      color: 'emerald',
    },
    {
      id: 'patients' as NavTab,
      label: 'รายชื่อคนไข้',
      icon: Users,
      badge: null,
      color: 'teal',
    },
    {
      id: 'history' as NavTab,
      label: 'ประวัติตรวจ',
      icon: History,
      badge: null,
      color: 'sky',
    },
    {
      id: 'dashboard' as NavTab,
      label: userRole === 'nurse' ? 'แดชบอร์ด/ส่งออก' : 'สรุป & ส่งออก',
      icon: BarChart3,
      badge: 'พยาบาล',
      color: 'indigo',
    },
    {
      id: 'sheets' as NavTab,
      label: 'Google Sheet',
      icon: FileSpreadsheet,
      badge: null,
      color: 'green',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg safe-bottom">
      <div className="max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1 px-1 flex flex-col items-center justify-center relative rounded-2xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 scale-110 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[11px] sm:text-xs mt-0.5 tracking-tight whitespace-nowrap text-center">
                {tab.label}
              </span>

              {tab.badge && !isActive && (
                <span className="absolute top-1 right-2 text-[9px] bg-slate-100 text-slate-600 px-1 rounded-full scale-90 border border-slate-200">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
