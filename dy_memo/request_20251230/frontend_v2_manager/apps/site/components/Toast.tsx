import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ToastProps {
  message: string
  show: boolean
  type?: 'success' | 'warning'
}

export const Toast: React.FC<ToastProps> = ({ message, show, type = 'success' }) => {
  return (
    <div
      className={`
                fixed bottom-[100px] left-1/2 -translate-x-1/2 transform transition-all duration-300 z-[9999]
                flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-slate-800/95 text-white font-semibold text-[15px]
                ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}
            `}
    >
      {type === 'success' ? (
        <CheckCircle size={22} className="text-green-400" />
      ) : (
        <AlertCircle size={22} className="text-yellow-400" />
      )}
      <span>{message}</span>
    </div>
  )
}
