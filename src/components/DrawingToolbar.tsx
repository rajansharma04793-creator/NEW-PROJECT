import React, { useState } from 'react';
import { DrawingToolType, DrawingElement } from '../types';
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
  List,
  X,
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
  drawings?: DrawingElement[];
  onDeleteDrawing?: (id: string) => void;
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
  drawings = [],
  onDeleteDrawing,
  onUndo,
  onClearAll,
}) => {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDrawingsList, setShowDrawingsList] = useState(false);

  const toggleFlyout = (key: string) => {
    setOpenFlyout((prev) => (prev === key ? null : key));
    setShowColorPicker(false);
    setShowDrawingsList(false);
  };

  const selectAndClose = (tool: DrawingToolType) => {
    onSelectTool(tool);
    setOpenFlyout(null);
    setShowColorPicker(false);
    setShowDrawingsList(false);
  };

  return (
    <div className="flex flex-col items-center bg-[#14171a] border-r border-[#272a2d] py-1 px-1 text-[#99907f] z-30 select-none h-full max-h-full overflow-visible shadow-lg">
      {/* 1. Cursor / Crosshair */}
      <div className="relative group mb-1 shrink-0">
        <button
          onClick={() => selectAndClose('cursor')}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            activeTool === 'cursor'
              ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 shadow-[0_0_8px_rgba(0,255,148,0.2)]'
              : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
          }`}
          title="Crosshair / Standard Pointer (V)"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      <div className="w-5 h-[1px] bg-[#272a2d] my-0.5 shrink-0" />

      {/* 2. Lines & Rays Group */}
      <div className="relative mb-1 shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('trendline')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
            className="text-[10px] text-[#99907f] hover:text-[#00ff94] -ml-0.5 px-0.5 py-1 cursor-pointer font-bold"
            title="More Lines"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'lines' && (
          <div className="absolute left-full top-0 ml-2 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-48 font-mono text-xs text-[#d0c5b3] backdrop-blur-md animate-fadeIn">
            <button
              onClick={() => selectAndClose('trendline')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'trendline' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trendline (Alt+T)</span>
            </button>
            <button
              onClick={() => selectAndClose('horizontal_line')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'horizontal_line' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Horizontal Line</span>
            </button>
            <button
              onClick={() => selectAndClose('horizontal_ray')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'horizontal_ray' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <MoveRight className="w-3.5 h-3.5" />
              <span>Horizontal Ray</span>
            </button>
            <button
              onClick={() => selectAndClose('vertical_line')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'vertical_line' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Vertical Time Line</span>
            </button>
            <button
              onClick={() => selectAndClose('channel')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
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
      <div className="relative mb-1 shrink-0">
        <button
          onClick={() => selectAndClose('fib_retracement')}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
      <div className="relative mb-1 shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('rectangle')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
            className="text-[10px] text-[#99907f] hover:text-[#00ff94] -ml-0.5 px-0.5 py-1 cursor-pointer font-bold"
            title="More Shapes"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'shapes' && (
          <div className="absolute left-full top-0 ml-2 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-48 font-mono text-xs text-[#d0c5b3] backdrop-blur-md animate-fadeIn">
            <button
              onClick={() => selectAndClose('rectangle')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'rectangle' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Rectangle / OB Box</span>
            </button>
            <button
              onClick={() => selectAndClose('circle')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
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
      <div className="relative mb-1 shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('long_position')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
            className="text-[10px] text-[#99907f] hover:text-[#00ff94] -ml-0.5 px-0.5 py-1 cursor-pointer font-bold"
            title="More Position Tools"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'positions' && (
          <div className="absolute left-full top-0 ml-2 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-52 font-mono text-xs text-[#d0c5b3] backdrop-blur-md animate-fadeIn">
            <button
              onClick={() => selectAndClose('long_position')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'long_position' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Long Position R:R Box</span>
            </button>
            <button
              onClick={() => selectAndClose('short_position')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'short_position' ? 'bg-[#272a2d] text-[#ff3b4a] font-bold' : ''
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-[#ff3b4a]" />
              <span>Short Position R:R Box</span>
            </button>
            <button
              onClick={() => selectAndClose('price_range')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
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
      <div className="relative mb-1 shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => selectAndClose('brush')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
            className="text-[10px] text-[#99907f] hover:text-[#00ff94] -ml-0.5 px-0.5 py-1 cursor-pointer font-bold"
            title="More Annotations"
          >
            ▸
          </button>
        </div>

        {openFlyout === 'annotations' && (
          <div className="absolute left-full top-0 ml-2 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 w-48 font-mono text-xs text-[#d0c5b3] backdrop-blur-md animate-fadeIn">
            <button
              onClick={() => selectAndClose('brush')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'brush' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Freehand Brush</span>
            </button>
            <button
              onClick={() => selectAndClose('text')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'text' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Label</span>
            </button>
            <button
              onClick={() => selectAndClose('arrow_up')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'arrow_up' ? 'bg-[#272a2d] text-[#00ff94] font-bold' : ''
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Buy Pointer Arrow</span>
            </button>
            <button
              onClick={() => selectAndClose('arrow_down')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#272a2d] cursor-pointer ${
                activeTool === 'arrow_down' ? 'bg-[#272a2d] text-[#ff3b4a] font-bold' : ''
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#ff3b4a]" />
              <span>Sell Pointer Arrow</span>
            </button>
          </div>
        )}
      </div>

      {/* Eraser Tool - Click any drawing on chart to delete it */}
      <div className="relative mb-1 shrink-0">
        <button
          onClick={() => selectAndClose('eraser')}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-[#ff3b4a]/25 text-[#ff3b4a] border border-[#ff3b4a]/60 shadow-[0_0_10px_rgba(255,59,74,0.35)]'
              : 'hover:bg-[#272a2d] hover:text-[#ff3b4a]'
          }`}
          title="Eraser: Click on any drawing or line on the chart to delete it immediately"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <div className="w-5 h-[1px] bg-[#272a2d] my-1 shrink-0" />

      {/* 7. Color Swatch & Style Picker */}
      <div className="relative mb-1 shrink-0">
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setOpenFlyout(null);
          }}
          className="p-1 rounded-lg hover:bg-[#272a2d] flex items-center justify-center transition-colors cursor-pointer border border-[#272a2d]"
          title="Drawing Color & Line Style"
        >
          <div
            className="w-4 h-4 rounded-full border border-white/60 shadow-xs"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute left-full bottom-0 ml-2 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-2.5 z-50 w-48 font-mono text-xs space-y-2.5 backdrop-blur-md animate-fadeIn">
            <div>
              <span className="text-[10px] text-[#99907f] block uppercase mb-1.5 font-bold">Color</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onChangeColor(c);
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                      currentColor === c ? 'scale-120 border-white ring-2 ring-white/40' : 'border-transparent hover:scale-110'
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
        className={`p-1.5 rounded-lg transition-all cursor-pointer mb-1 shrink-0 ${
          isMagnetMode
            ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 shadow-[0_0_8px_rgba(0,255,148,0.2)]'
            : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
        }`}
        title={`Magnet Snap Mode: ${isMagnetMode ? 'ON (Snaps to High/Low/Open/Close)' : 'OFF'}`}
      >
        <Magnet className="w-4 h-4" />
      </button>

      {/* 9. Lock Drawings */}
      <button
        onClick={onToggleLock}
        className={`p-1.5 rounded-lg transition-all cursor-pointer mb-1 shrink-0 ${
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
        className={`p-1.5 rounded-lg transition-all cursor-pointer mb-1 shrink-0 ${
          !isDrawingsVisible
            ? 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
            : 'hover:bg-[#272a2d] hover:text-[#fff8f1]'
        }`}
        title={`Hide/Show All Drawings (${drawingCount} on chart)`}
      >
        {isDrawingsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* 11. Manage Individual Drawings (Objects Tree) */}
      <div className="relative mb-1 shrink-0">
        <button
          onClick={() => {
            setShowDrawingsList(!showDrawingsList);
            setShowColorPicker(false);
            setOpenFlyout(null);
          }}
          disabled={drawingCount === 0}
          className={`p-1.5 rounded-lg transition-all cursor-pointer relative disabled:opacity-25 ${
            showDrawingsList
              ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40'
              : 'hover:bg-[#272a2d] hover:text-[#38bdf8]'
          }`}
          title={`Drawings List / Object Tree (${drawingCount} items - click to manage or delete individual items)`}
        >
          <List className="w-4 h-4" />
          {drawingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#38bdf8] text-[#111417] text-[8px] font-bold rounded-full flex items-center justify-center">
              {drawingCount}
            </span>
          )}
        </button>

        {showDrawingsList && drawings.length > 0 && (
          <div className="absolute left-full bottom-0 ml-2 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-2.5 z-50 w-60 font-mono text-xs space-y-2 backdrop-blur-md animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
              <span className="font-bold text-[#fff8f1] flex items-center gap-1.5">
                <List className="w-3.5 h-3.5 text-[#38bdf8]" />
                Chart Drawings ({drawings.length})
              </span>
              <button
                onClick={() => setShowDrawingsList(false)}
                className="text-[#99907f] hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {drawings.map((d, index) => {
                const label = d.type.replace('_', ' ');
                const priceInfo = d.points[0]?.price ? `$${d.points[0].price.toFixed(d.points[0].price > 100 ? 2 : 4)}` : '';
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded bg-[#14171a] border border-[#272a2d] hover:border-[#38bdf8]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <div className="flex flex-col truncate">
                        <span className="capitalize text-[#e1e2e7] text-[11px] font-medium truncate">
                          {label} #{index + 1}
                        </span>
                        {priceInfo && (
                          <span className="text-[9px] text-[#99907f]">{priceInfo}</span>
                        )}
                      </div>
                    </div>

                    {/* Delete Individual Drawing Button */}
                    <button
                      onClick={() => {
                        if (onDeleteDrawing) onDeleteDrawing(d.id);
                      }}
                      className="p-1 rounded hover:bg-[#ff3b4a]/20 text-[#99907f] hover:text-[#ff3b4a] transition-colors cursor-pointer shrink-0 ml-1.5"
                      title="Delete this drawing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-[#272a2d] flex justify-between items-center">
              <button
                onClick={() => {
                  onClearAll();
                  setShowDrawingsList(false);
                }}
                className="w-full py-1 rounded bg-[#ff3b4a]/15 hover:bg-[#ff3b4a]/25 text-[#ff3b4a] border border-[#ff3b4a]/30 text-[10px] font-bold transition-colors cursor-pointer text-center"
              >
                Clear All Drawings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 12. Undo */}
      <button
        onClick={onUndo}
        disabled={drawingCount === 0}
        className="p-1.5 rounded-lg hover:bg-[#272a2d] hover:text-[#fff8f1] disabled:opacity-25 transition-all cursor-pointer mb-1 shrink-0"
        title="Undo Last Drawing (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* 13. Clear All Trash */}
      <button
        onClick={onClearAll}
        disabled={drawingCount === 0}
        className="p-1.5 rounded-lg hover:bg-[#ff3b4a]/20 hover:text-[#ff3b4a] disabled:opacity-25 transition-all cursor-pointer shrink-0"
        title="Delete All Drawings on this Chart"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
