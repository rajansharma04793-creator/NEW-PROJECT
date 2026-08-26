import React, { useState } from 'react';
import { DrawingToolType } from '../types';
import {
  MousePointer,
  Crosshair,
  TrendingUp,
  Minus,
  MoveRight,
  SplitSquareVertical,
  Layers,
  Square,
  Circle,
  TrendingDown,
  Ruler,
  Type,
  ArrowUpCircle,
  ArrowDownCircle,
  Paintbrush,
  Eraser,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Undo2,
  ChevronRight,
  Palette,
} from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  currentColor: string;
  onChangeColor: (color: string) => void;
  currentLineWidth: number;
  onChangeLineWidth: (width: number) => void;
  currentLineStyle: 'solid' | 'dashed' | 'dotted';
  onChangeLineStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
  isMagnetMode: boolean;
  onToggleMagnetMode: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  isDrawingsVisible: boolean;
  onToggleVisibility: () => void;
  drawingCount: number;
  onUndo: () => void;
  onClearAll: () => void;
}

const PRESET_COLORS = [
  '#00ff94', // Emerald Neon
  '#38bdf8', // Sky Blue
  '#f6be16', // Gold / Amber
  '#ff3b4a', // Crimson
  '#c084fc', // Purple
  '#fb923c', // Orange
  '#ffffff', // Clean White
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentColor,
  onChangeColor,
  currentLineWidth,
  onChangeLineWidth,
  currentLineStyle,
  onChangeLineStyle,
  isMagnetMode,
  onToggleMagnetMode,
  isLocked,
  onToggleLock,
  isDrawingsVisible,
  onToggleVisibility,
  drawingCount,
  onUndo,
  onClearAll,
}) => {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const toggleFlyout = (key: string) => {
    setOpenFlyout((prev) => (prev === key ? null : key));
  };

  const selectAndClose = (tool: DrawingToolType) => {
    onSelectTool(tool);
    setOpenFlyout(null);
  };

  return (
    <div className="flex flex-col items-center bg-[#14171a] border-r border-[#272a2d] py-2 px-1 text-[#99907f] z-20 select-none">
      {/* 1. Cursor / Crosshair */}
      <div className="relative group mb-1">
        <button
          onClick={() => selectAndClose('cursor')}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            activeTool === 'cursor'
              ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 shadow-[0_0_8px_rgba(0,255,148,0.2)]'
              : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
          }`}
          title="Crosshair / Standard Pointer (V)"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      <div className="w-5 h-[1px] bg-[#272a2d] my-1" />

      {/* 2. Lines & Rays Group */}
      <div className="relative mb-1">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('trendline')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              ['trendline', 'horizontal_line', 'horizontal_ray', 'vertical_line', 'channel'].includes(
                activeTool
              )
                ? 'bg-[#f6be16]/20 text-[#ffd87f] border border-[#f6be16]/40 shadow-[0_0_8px_rgba(246,190,22,0.2)]'
                : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
            }`}
            title="Trendline & Ray Tools"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFlyout('lines')}
            className="text-[9px] hover:text-[#fff8f1] -ml-0.5 cursor-pointer"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'lines' && (
          <div className="absolute left-full top-0 ml-1.5 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-44 font-mono text-xs text-[#d0c5b3]">
            <button
              onClick={() => selectAndClose('trendline')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'trendline' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trendline (Alt+T)</span>
            </button>
            <button
              onClick={() => selectAndClose('horizontal_line')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'horizontal_line' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Horizontal Line (Alt+H)</span>
            </button>
            <button
              onClick={() => selectAndClose('horizontal_ray')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'horizontal_ray' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <MoveRight className="w-3.5 h-3.5" />
              <span>Horizontal Ray (Alt+J)</span>
            </button>
            <button
              onClick={() => selectAndClose('vertical_line')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'vertical_line' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Vertical Time Line</span>
            </button>
            <button
              onClick={() => selectAndClose('channel')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'channel' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Parallel Channel</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Fibonacci Retracement */}
      <div className="relative mb-1">
        <button
          onClick={() => selectAndClose('fib_retracement')}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            activeTool === 'fib_retracement'
              ? 'bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/40 shadow-[0_0_8px_rgba(192,132,252,0.2)]'
              : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
          }`}
          title="Fibonacci Retracement (0.382, 0.5, 0.618 Golden Pocket, 0.786)"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Geometric Shapes & Zones */}
      <div className="relative mb-1">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('rectangle')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              ['rectangle', 'circle'].includes(activeTool)
                ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
            }`}
            title="Order Block Box & Supply/Demand Zones"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFlyout('shapes')}
            className="text-[9px] hover:text-[#fff8f1] -ml-0.5 cursor-pointer"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'shapes' && (
          <div className="absolute left-full top-0 ml-1.5 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-44 font-mono text-xs text-[#d0c5b3]">
            <button
              onClick={() => selectAndClose('rectangle')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'rectangle' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Rectangle / OB Box</span>
            </button>
            <button
              onClick={() => selectAndClose('circle')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'circle' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Circle / Key Level</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Positions & Risk/Reward Prediction */}
      <div className="relative mb-1">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('long_position')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              ['long_position', 'short_position', 'price_range'].includes(activeTool)
                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 shadow-[0_0_8px_rgba(0,255,148,0.2)]'
                : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
            }`}
            title="Long/Short Position Risk:Reward Calculator"
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFlyout('positions')}
            className="text-[9px] hover:text-[#fff8f1] -ml-0.5 cursor-pointer"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'positions' && (
          <div className="absolute left-full top-0 ml-1.5 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-48 font-mono text-xs text-[#d0c5b3]">
            <button
              onClick={() => selectAndClose('long_position')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'long_position' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Long Position R:R Box</span>
            </button>
            <button
              onClick={() => selectAndClose('short_position')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'short_position' ? 'bg-[#272a2d] text-[#ff3b4a] font-bold' : ''
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-[#ff3b4a]" />
              <span>Short Position R:R Box</span>
            </button>
            <button
              onClick={() => selectAndClose('price_range')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'price_range' ? 'bg-[#272a2d] text-[#ffd87f] font-bold' : ''
              }`}
            >
              <Ruler className="w-3.5 h-3.5 text-[#ffd87f]" />
              <span>Price Range Measure (%)</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Annotations, Arrows & Freehand Brush */}
      <div className="relative mb-1">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('brush')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              ['brush', 'text', 'arrow_up', 'arrow_down'].includes(activeTool)
                ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/40'
                : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
            }`}
            title="Brush, Text & Buy/Sell Arrows"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFlyout('annotations')}
            className="text-[9px] hover:text-[#fff8f1] -ml-0.5 cursor-pointer"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'annotations' && (
          <div className="absolute left-full top-0 ml-1.5 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-44 font-mono text-xs text-[#d0c5b3]">
            <button
              onClick={() => selectAndClose('brush')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'brush' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Freehand Brush</span>
            </button>
            <button
              onClick={() => selectAndClose('text')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'text' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Label</span>
            </button>
            <button
              onClick={() => selectAndClose('arrow_up')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'arrow_up' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Buy Pointer Arrow</span>
            </button>
            <button
              onClick={() => selectAndClose('arrow_down')}
              className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'arrow_down' ? 'bg-[#272a2d] text-[#ff3b4a] font-bold' : ''
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#ff3b4a]" />
              <span>Sell Pointer Arrow</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-5 h-[1px] bg-[#272a2d] my-1" />

      {/* 7. Color Swatch & Style Picker */}
      <div className="relative mb-1">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1 rounded hover:bg-[#272a2d] flex items-center justify-center transition-colors cursor-pointer"
          title="Drawing Color & Line Width"
        >
          <div
            className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute left-full top-0 ml-1.5 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-2 z-50 w-44 font-mono text-xs space-y-2">
            <div>
              <span className="text-[10px] text-[#99907f] block uppercase mb-1 font-bold">Color</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onChangeColor(c);
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                      currentColor === c ? 'scale-115 border-white ring-2 ring-white/30' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#99907f] block uppercase mb-1 font-bold">Line Width</span>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    onClick={() => onChangeLineWidth(w)}
                    className={`py-1 text-center rounded border transition-colors cursor-pointer ${
                      currentLineWidth === w
                        ? 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94] font-bold'
                        : 'bg-[#111417] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#99907f] block uppercase mb-1 font-bold">Line Style</span>
              <div className="grid grid-cols-3 gap-1">
                {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => onChangeLineStyle(st)}
                    className={`py-1 text-center text-[10px] rounded border transition-colors cursor-pointer capitalize ${
                      currentLineStyle === st
                        ? 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f] font-bold'
                        : 'bg-[#111417] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. Magnet Mode */}
      <button
        onClick={onToggleMagnetMode}
        className={`p-1.5 rounded transition-all cursor-pointer mb-1 ${
          isMagnetMode
            ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
            : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
        }`}
        title={`Magnet Mode (Snaps to High/Low/Open/Close): ${isMagnetMode ? 'ON' : 'OFF'}`}
      >
        <Magnet className="w-4 h-4" />
      </button>

      {/* 9. Lock Drawings */}
      <button
        onClick={onToggleLock}
        className={`p-1.5 rounded transition-all cursor-pointer mb-1 ${
          isLocked
            ? 'bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40'
            : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
        }`}
        title={`Lock All Drawings: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>

      {/* 10. Hide / Show Drawings */}
      <button
        onClick={onToggleVisibility}
        className={`p-1.5 rounded transition-all cursor-pointer mb-1 ${
          !isDrawingsVisible
            ? 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
            : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
        }`}
        title={`Hide/Show All Drawings (${drawingCount} active)`}
      >
        {isDrawingsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* 11. Undo */}
      <button
        onClick={onUndo}
        disabled={drawingCount === 0}
        className="p-1.5 rounded hover:bg-[#272a2d] hover:text-[#fff8f1] disabled:opacity-30 transition-all cursor-pointer mb-1"
        title="Undo Last Drawing (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* 12. Clear All Trash */}
      <button
        onClick={onClearAll}
        disabled={drawingCount === 0}
        className="p-1.5 rounded hover:bg-[#ff3b4a]/20 hover:text-[#ff3b4a] disabled:opacity-30 transition-all cursor-pointer"
        title="Remove All Drawings & Tools"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
