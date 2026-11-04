import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, ThemeMode } from '../utils/theme';

interface ThemeToggleProps {
  /**
   * 'compact' renders a single 1-click icon toggle button with an optional long-press/dropdown menu.
   * 'segmented' renders a 3-way segmented control (Light / Dark / System).
   */
  variant?: 'compact' | 'segmented';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  showLabel = false,
  className = '',
}) => {
  const { theme, effectiveTheme, isDark, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    if (dropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [dropdownOpen]);

  if (variant === 'segmented') {
    const modes: Array<{ id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
      { id: 'light', label: 'Light', icon: Sun },
      { id: 'dark', label: 'Dark', icon: Moon },
      { id: 'system', label: 'System', icon: Monitor },
    ];

    return (
      <div
        role="group"
        aria-label="Theme mode selector"
        className={`inline-flex items-center p-1 rounded-lg border border-[#E4DFD3] dark:border-[#1F3834] bg-[#F3EFE6] dark:bg-[#112220] text-xs ${className}`}
      >
        {modes.map((m) => {
          const Icon = m.icon;
          const isSelected = theme === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setTheme(m.id)}
              aria-pressed={isSelected}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer min-h-[32px] ${
                isSelected
                  ? 'bg-white dark:bg-[#18302D] text-[#0B3D3A] dark:text-[#7FD1BF] shadow-xs font-semibold'
                  : 'text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#F4F7F6]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant: 1-click toggle with accessible menu option
  return (
    <div className={`relative inline-flex items-center ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Current theme is ${theme} (${effectiveTheme} mode). Click to switch to ${isDark ? 'light' : 'dark'} mode.`}
        title={`Theme: ${theme.toUpperCase()} (${effectiveTheme}). Click to toggle.`}
        className="inline-flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#E4DFD3] dark:border-[#1F3834] bg-[#FAF8F4] dark:bg-[#112220] hover:bg-[#F3EFE6] dark:hover:bg-[#18302D] text-[#0B3D3A] dark:text-[#7FD1BF] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17806D] dark:focus-visible:ring-[#2DD4BF]"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-[#FBBF24] transition-transform duration-200 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-[#0B3D3A] dark:text-[#7FD1BF] transition-transform duration-200" />
        )}
        {showLabel && (
          <span className="text-xs font-medium text-[#142321] dark:text-[#F4F7F6]">
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </button>

      {/* Subtle chevron to open theme picker menu for explicit System/Light/Dark selection */}
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-expanded={dropdownOpen}
        aria-label="Open detailed theme options"
        title="Choose Light, Dark, or System theme"
        className="ml-0.5 p-1 text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#7FD1BF] rounded cursor-pointer transition-colors"
      >
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          role="menu"
          aria-label="Theme Selection"
          className="absolute right-0 top-full mt-1.5 w-40 z-50 bg-white dark:bg-[#12211F] border border-[#E4DFD3] dark:border-[#1F3834] rounded-lg shadow-lg p-1 space-y-0.5 text-xs animate-in fade-in zoom-in-95"
        >
          <div className="px-2.5 py-1.5 font-mono-tabular text-[10px] uppercase tracking-wider text-[#526360] dark:text-[#9BB0AC] border-b border-[#E4DFD3] dark:border-[#1F3834]">
            Theme Preference
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme('light');
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${
              theme === 'light'
                ? 'bg-[#F3EFE6] dark:bg-[#18302D] text-[#0B3D3A] dark:text-[#7FD1BF] font-semibold'
                : 'text-[#142321] dark:text-[#F4F7F6] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-[#B45309] dark:text-[#FBBF24]" />
              <span>Light</span>
            </span>
            {theme === 'light' && <span className="text-[#17806D] dark:text-[#2DD4BF] text-[10px]">✓</span>}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme('dark');
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#F3EFE6] dark:bg-[#18302D] text-[#0B3D3A] dark:text-[#7FD1BF] font-semibold'
                : 'text-[#142321] dark:text-[#F4F7F6] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-[#17806D] dark:text-[#7FD1BF]" />
              <span>Dark</span>
            </span>
            {theme === 'dark' && <span className="text-[#17806D] dark:text-[#2DD4BF] text-[10px]">✓</span>}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme('system');
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${
              theme === 'system'
                ? 'bg-[#F3EFE6] dark:bg-[#18302D] text-[#0B3D3A] dark:text-[#7FD1BF] font-semibold'
                : 'text-[#142321] dark:text-[#F4F7F6] hover:bg-[#FAF8F4] dark:hover:bg-[#18302D]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-[#526360] dark:text-[#9BB0AC]" />
              <span>System (Auto)</span>
            </span>
            {theme === 'system' && <span className="text-[#17806D] dark:text-[#2DD4BF] text-[10px]">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
};
