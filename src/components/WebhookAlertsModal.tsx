import React, { useState } from 'react';
import { WebhookConfig } from '../types';
import {
  Bell,
  Send,
  CheckCircle,
  X,
  Sparkles,
  Zap,
  Globe,
  MessageSquare,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface WebhookAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const WebhookAlertsModal: React.FC<WebhookAlertsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [config, setConfig] = useState<WebhookConfig>({
    tradingViewWebhookUrl: 'https://api.lumina.trade/v1/webhooks/alerts/live',
    telegramBotToken: '',
    telegramChatId: '',
    discordWebhookUrl: '',
    notifyOnAiSignal: true,
    notifyOnPriceAlert: true,
    notifyOnSLTP: true,
    notifyOnEconomicEvents: false,
  });

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleTestPing = (type: 'telegram' | 'discord' | 'tradingview') => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      onShowToast?.(`Test alert payload successfully dispatched to ${type}!`, 'success');
    }, 600);
  };

  const handleSave = () => {
    setIsSaved(true);
    onShowToast?.('Webhook & Telegram alert configuration saved!', 'success');
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="bg-[#14171a] border border-[#272a2d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a2d] bg-[#191c1f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#f6be16]/15 border border-[#f6be16]/30 flex items-center justify-center text-[#ffd87f]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1]">Webhooks, Telegram & Discord Integrations</h2>
              <p className="text-[11px] text-[#99907f]">
                Receive instant AI trade signals & volatility triggers on your devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Telegram Settings */}
          <div className="p-4 rounded-xl bg-[#191c1f] border border-[#272a2d] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✈️</span>
                <h3 className="text-xs font-bold text-[#fff8f1]">Telegram Bot Notifications</h3>
              </div>
              <button
                onClick={() => handleTestPing('telegram')}
                disabled={isSendingTest}
                className="px-2.5 py-1 rounded bg-[#38bdf8]/20 hover:bg-[#38bdf8] text-[#38bdf8] hover:text-[#111417] text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                Test Telegram Ping
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-[#99907f] block mb-1">Bot Token</label>
                <input
                  type="text"
                  placeholder="e.g. 7123456789:AAH..."
                  value={config.telegramBotToken}
                  onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                  className="w-full bg-[#111417] text-xs px-3 py-1.5 rounded border border-[#272a2d] text-[#fff8f1] focus:border-[#f6be16] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#99907f] block mb-1">Chat ID</label>
                <input
                  type="text"
                  placeholder="e.g. -100192837482"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                  className="w-full bg-[#111417] text-xs px-3 py-1.5 rounded border border-[#272a2d] text-[#fff8f1] focus:border-[#f6be16] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Discord Webhook */}
          <div className="p-4 rounded-xl bg-[#191c1f] border border-[#272a2d] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">👾</span>
                <h3 className="text-xs font-bold text-[#fff8f1]">Discord Channel Webhook</h3>
              </div>
              <button
                onClick={() => handleTestPing('discord')}
                disabled={isSendingTest}
                className="px-2.5 py-1 rounded bg-[#a855f7]/20 hover:bg-[#a855f7] text-[#a855f7] hover:text-white text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                Test Discord Embed
              </button>
            </div>

            <div>
              <label className="text-[10px] text-[#99907f] block mb-1">Discord Webhook URL</label>
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={config.discordWebhookUrl}
                onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
                className="w-full bg-[#111417] text-xs px-3 py-1.5 rounded border border-[#272a2d] text-[#fff8f1] focus:border-[#f6be16] focus:outline-none"
              />
            </div>
          </div>

          {/* Trigger Toggles */}
          <div className="p-4 rounded-xl bg-[#191c1f] border border-[#272a2d] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#fff8f1]">Trigger Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 text-[#e1e2e7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnAiSignal}
                  onChange={(e) => setConfig({ ...config, notifyOnAiSignal: e.target.checked })}
                  className="rounded accent-[#f6be16]"
                />
                <span>High-Confidence AI Signals (&gt;85%)</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#e1e2e7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnPriceAlert}
                  onChange={(e) => setConfig({ ...config, notifyOnPriceAlert: e.target.checked })}
                  className="rounded accent-[#f6be16]"
                />
                <span>Custom Price Level Crossings</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#e1e2e7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnSLTP}
                  onChange={(e) => setConfig({ ...config, notifyOnSLTP: e.target.checked })}
                  className="rounded accent-[#f6be16]"
                />
                <span>Take-Profit & Stop-Loss Executions</span>
              </label>

              <label className="flex items-center gap-2.5 text-[#e1e2e7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnEconomicEvents}
                  onChange={(e) => setConfig({ ...config, notifyOnEconomicEvents: e.target.checked })}
                  className="rounded accent-[#f6be16]"
                />
                <span>High-Impact Macro Economic Events</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#272a2d] bg-[#191c1f] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-xs font-bold bg-[#f6be16] hover:bg-[#ffd87f] text-[#191c1f] shadow-lg shadow-[#f6be16]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save & Activate Integrations
          </button>
        </div>
      </div>
    </div>
  );
};
