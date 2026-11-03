import React, { useState } from 'react';
import { ChevronLeft, Delete, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalculatorAppProps {
  onBack: () => void;
}

interface HistoryItem {
  equation: string;
  result: string;
}

export const CalculatorApp: React.FC<CalculatorAppProps> = ({ onBack }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleNum = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOp = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      const fullEq = equation + display;
      // safe eval using Function
      const result = new Function('return ' + fullEq)();
      const resStr = String(result);
      setDisplay(resStr);
      setEquation('');
      setHistory(prev => [{ equation: fullEq, result: resStr }, ...prev].slice(0, 20));
    } catch {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const btnClass = "p-6 rounded-[24px] text-2xl font-bold transition-all active:scale-95 flex items-center justify-center select-none shadow-sm shadow-black/5 hover:shadow-md";
  const numBtn = `${btnClass} bg-slate-50 text-slate-800 border border-slate-200/50 hover:bg-white hover:border-slate-300`;
  const opBtn = `${btnClass} bg-orange-50 text-orange-600 border border-orange-200/50 hover:bg-orange-100 hover:border-orange-300`;

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-3 pb-2">
        <button
          onClick={onBack}
          className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-2xs"
          title="Back to Notebooks"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
          <span>Back to Notebooks</span>
        </button>
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">Calculator</h2>
      </div>

      <div className="bg-slate-100/50 p-2 sm:p-4 rounded-[40px] flex gap-4 h-full">
        {/* Main Calculator */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex-1 flex flex-col justify-end max-w-sm mx-auto w-full relative">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="absolute top-6 left-6 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 transition-colors z-10 block xl:hidden"
          >
            <History className="w-5 h-5" />
          </button>

          <div className="bg-slate-900 rounded-[28px] p-6 mb-6 text-right break-all shadow-inner relative overflow-hidden flex flex-col justify-end min-h-[160px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="text-lg text-slate-400 font-medium h-7 tracking-wider">{equation}</div>
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter mt-2">{display}</div>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:gap-4 flex-1">
            <button onClick={handleClear} className={`${btnClass} bg-rose-50 text-rose-500 border border-rose-200/50 hover:bg-rose-100 col-span-2 shadow-inner`}>AC</button>
            <button onClick={handleDelete} className={`${btnClass} bg-slate-100 text-slate-600 border border-slate-200/50 hover:bg-slate-200 shadow-inner`}><Delete className="w-6 h-6" /></button>
            <button onClick={() => handleOp('/')} className={opBtn}>÷</button>
            
            <button onClick={() => handleNum('7')} className={numBtn}>7</button>
            <button onClick={() => handleNum('8')} className={numBtn}>8</button>
            <button onClick={() => handleNum('9')} className={numBtn}>9</button>
            <button onClick={() => handleOp('*')} className={opBtn}>×</button>
            
            <button onClick={() => handleNum('4')} className={numBtn}>4</button>
            <button onClick={() => handleNum('5')} className={numBtn}>5</button>
            <button onClick={() => handleNum('6')} className={numBtn}>6</button>
            <button onClick={() => handleOp('-')} className={opBtn}>-</button>
            
            <button onClick={() => handleNum('1')} className={numBtn}>1</button>
            <button onClick={() => handleNum('2')} className={numBtn}>2</button>
            <button onClick={() => handleNum('3')} className={numBtn}>3</button>
            <button onClick={() => handleOp('+')} className={opBtn}>+</button>
            
            <button onClick={() => handleNum('0')} className={`${numBtn} col-span-2`}>0</button>
            <button onClick={() => handleNum('.')} className={numBtn}>.</button>
            <button onClick={handleEqual} className={`${btnClass} bg-orange-500 text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600`}>=</button>
          </div>
        </div>

        {/* History Panel - fixed on desktop, toggleable on mobile */}
        <AnimatePresence>
          {(showHistory || window.innerWidth >= 1280) && (
            <motion.div 
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 320, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              className="hidden xl:flex bg-white rounded-[32px] p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" />
                  History
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={() => setHistory([])}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                    <History className="w-12 h-12 mb-3 opacity-20" />
                    No calculation history yet
                  </div>
                ) : (
                  history.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-slate-200 transition-colors group" onClick={() => {
                      setDisplay(item.result);
                      setEquation('');
                    }}>
                      <div className="text-slate-400 text-sm mb-1">{item.equation} =</div>
                      <div className="text-xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">{item.result}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
