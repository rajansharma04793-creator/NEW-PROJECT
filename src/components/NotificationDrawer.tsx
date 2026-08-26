import React, { useState } from 'react';
import { AppNotification, AssetPair } from '../types';
import { Bell, BellRing, X, CheckCheck, Sparkles, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelectPair?: (pair: AssetPair) => void;
  onOpenAlertsModal?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectPair,
  onOpenAlertsModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'price_alert' | 'ai_signal' | 'order'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'price_alert') return n.type === 'price_alert' || n.type === 'alert';
    if (filter === 'ai_signal') return n.type === 'ai_signal';
    if (filter === 'order') return n.type === 'order';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs font-hanken animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#111417] h-full border-l border-[#272a2d] shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="p-4 bg-[#191c1f] border-b border-[#272a2d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#f6be16]/15 text-[#f6be16]">
                <BellRing className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[#fff8f1] text-sm flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#f6be16] text-[#111417] font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[10px] text-[#f6be16] hover:underline font-mono flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark Read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-2 bg-[#14171a] border-b border-[#272a2d] text-xs font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#272a2d] text-[#fff8f1]'
                  : 'text-[#99907f] hover:text-[#e1e2e7]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('price_alert')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                filter === 'price_alert'
                  ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/30'
                  : 'text-[#99907f] hover:text-[#e1e2e7]'
              }`}
            >
              🔔 Price Alerts
            </button>
            <button
              onClick={() => setFilter('ai_signal')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                filter === 'ai_signal'
                  ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/30'
                  : 'text-[#99907f] hover:text-[#e1e2e7]'
              }`}
            >
              ⚡ AI Signals
            </button>
            <button
              onClick={() => setFilter('order')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                filter === 'order'
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30'
                  : 'text-[#99907f] hover:text-[#e1e2e7]'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-[#99907f] space-y-2">
              <Bell className="w-6 h-6 mx-auto opacity-40" />
              <p className="text-xs">No notifications in this category</p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isPriceAlert = n.type === 'price_alert' || n.type === 'alert';
              const isAi = n.type === 'ai_signal';
              const isOrder = n.type === 'order';

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all ${
                    n.read
                      ? 'bg-[#191c1f]/40 border-[#272a2d] text-[#99907f]'
                      : isPriceAlert
                      ? 'bg-[#191c1f] border-[#f6be16]/40 text-[#e1e2e7] shadow-sm'
                      : isAi
                      ? 'bg-[#191c1f] border-[#00ff94]/40 text-[#e1e2e7]'
                      : 'bg-[#191c1f] border-[#37393d] text-[#e1e2e7]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {isPriceAlert && (
                        <span className="p-1 rounded bg-[#f6be16]/15 text-[#f6be16]">
                          <BellRing className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {isAi && (
                        <span className="p-1 rounded bg-[#00ff94]/15 text-[#00ff94]">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {isOrder && (
                        <span className="p-1 rounded bg-[#38bdf8]/15 text-[#38bdf8]">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {!isPriceAlert && !isAi && !isOrder && (
                        <span className="p-1 rounded bg-[#99907f]/15 text-[#99907f]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      )}

                      <span
                        className={`font-bold text-xs ${
                          !n.read ? 'text-[#fff8f1]' : 'text-[#d0c5b3]'
                        }`}
                      >
                        {n.title}
                      </span>
                    </div>

                    <span className="text-[10px] text-[#99907f] font-mono shrink-0">
                      {new Date(n.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-[#d0c5b3] font-mono mt-1">
                    {n.message}
                  </p>

                  {/* Quick Action Button */}
                  {n.symbol && onSelectPair && (
                    <div className="mt-2 pt-2 border-t border-[#272a2d] flex items-center justify-between text-[10px] font-mono">
                      <button
                        onClick={() => {
                          onSelectPair(n.symbol!);
                          onClose();
                        }}
                        className="text-[#f6be16] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Trade {n.symbol}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>

                      {isPriceAlert && onOpenAlertsModal && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenAlertsModal();
                          }}
                          className="text-[#99907f] hover:text-[#e1e2e7] cursor-pointer"
                        >
                          Manage Alerts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between text-[10px] text-[#99907f] font-mono">
          <span>Lumina Terminal Feed</span>
          {onOpenAlertsModal && (
            <button
              onClick={() => {
                onClose();
                onOpenAlertsModal();
              }}
              className="text-[#f6be16] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Bell className="w-3 h-3" />
              Configure Alerts
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
