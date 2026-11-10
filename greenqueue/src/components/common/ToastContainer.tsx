import React from 'react';
import { useApp } from '../../store/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { state, dispatch } = useApp();

  if (state.toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {state.toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/40 bg-[#101A22]/95',
          error: 'border-rose-500/40 bg-[#101A22]/95',
          warning: 'border-amber-500/40 bg-[#101A22]/95',
          info: 'border-sky-500/40 bg-[#101A22]/95',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-up ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#E8F1EE]">{toast.title}</h4>
              <p className="text-xs text-[#8DA29E] mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              className="text-[#8DA29E] hover:text-[#E8F1EE] transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

