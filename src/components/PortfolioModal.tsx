import React, { useState } from 'react';
import { X, Wallet, ArrowDownLeft, RefreshCcw, DollarSign, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onDeposit: (amount: number) => void;
  onReset: () => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  balance,
  onDeposit,
  onReset,
}) => {
  const [depositAmount, setDepositAmount] = useState<string>('10000');

  if (!isOpen) return null;

  const handleDeposit = () => {
    const amt = Number(depositAmount) || 0;
    if (amt > 0) {
      onDeposit(amt);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f6be16', '#00ff94'],
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-hanken">
      <div className="bg-[#111417] border border-[#272a2d] rounded-lg p-6 max-w-md w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#99907f] hover:text-[#fff8f1]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded bg-[#f6be16]/15 text-[#f6be16] border border-[#f6be16]/30">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#fff8f1] text-base">Terminal Treasury & Liquidity</h3>
            <p className="text-xs text-[#99907f] font-mono">Institutional Mock Account Balance</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-4 bg-[#191c1f] rounded border border-[#272a2d] mb-4">
          <span className="text-[11px] text-[#99907f] font-mono uppercase block mb-1">
            Total Available Margin (USDT)
          </span>
          <div className="text-3xl font-extrabold text-[#fff8f1] font-mono tracking-tight">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Deposit Quick Form */}
        <div className="space-y-3 mb-6">
          <label className="text-xs text-[#d0c5b3] font-mono block">Add Demo Liquidity (USDT)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="flex-1 bg-[#191c1f] border border-[#272a2d] focus:border-[#f6be16] rounded px-3 py-2 text-sm text-[#fff8f1] font-mono outline-none"
            />
            <button
              onClick={handleDeposit}
              className="px-4 py-2 bg-[#00ff94] hover:bg-[#40e397] text-[#002111] font-bold rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            {[5000, 10000, 50000, 100000].map((amt) => (
              <button
                key={amt}
                onClick={() => setDepositAmount(amt.toString())}
                className="flex-1 py-1 bg-[#272a2d] hover:bg-[#37393d] rounded text-[10px] font-mono text-[#e1e2e7]"
              >
                +${(amt / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Reset Actions */}
        <div className="pt-3 border-t border-[#272a2d] flex items-center justify-between">
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-[#ff3b4a] hover:underline font-mono"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Account to $100k</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] rounded text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
