'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import {
  getReservationDateOptions,
  getTodayDateString,
  validateAndNormalize12HrTime,
  time12ToMinutes,
  getCurrentLocalMinutes,
  validateReservation,
  ReservationValidation,
} from '@/lib/reservationUtils';

interface ReservationWindowProps {
  date: string;
  onDateChange: (date: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  disabled?: boolean;
  roomId?: string;
  theme?: 'amber' | 'emerald' | 'slate';
  onValidationChange?: (isValid: boolean, errorMsg?: string) => void;
  checkOverlapFn?: (startMins: number, endMins: number) => { overlapping: boolean; conflictDesc?: string };
}

interface HourOption {
  label: string;
  hourNum: number;
  meridiem: 'AM' | 'PM';
  h24: number;
}

const HOUR_OPTIONS: HourOption[] = [
  { label: '09 AM', hourNum: 9, meridiem: 'AM', h24: 9 },
  { label: '10 AM', hourNum: 10, meridiem: 'AM', h24: 10 },
  { label: '11 AM', hourNum: 11, meridiem: 'AM', h24: 11 },
  { label: '12 PM', hourNum: 12, meridiem: 'PM', h24: 12 },
  { label: '01 PM', hourNum: 1, meridiem: 'PM', h24: 13 },
  { label: '02 PM', hourNum: 2, meridiem: 'PM', h24: 14 },
  { label: '03 PM', hourNum: 3, meridiem: 'PM', h24: 15 },
  { label: '04 PM', hourNum: 4, meridiem: 'PM', h24: 16 },
];

const MINUTE_OPTIONS = ['00', '15', '30', '45'];

/**
 * Compact Responsive 12-Hour Time Input Component
 * Features:
 * - Two-column mobile picker: HOUR | MIN.
 * - Sized & positioned to be fully contained inside ~390–430px mobile container.
 * - For End Time (or right-aligned inputs), opens aligned right to prevent horizontal overflow.
 * - Automatically repositions above the field when vertical space below is limited.
 * - Scrollable columns with internal scrolling.
 * - Automatically disables past times for Today.
 */
const Time12InputField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  themeColor: 'amber' | 'emerald' | 'slate';
  selectedDate: string;
  isEndTime?: boolean;
  otherTimeValue?: string;
}> = ({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder = '09:00 AM',
  error,
  themeColor,
  selectedDate,
  isEndTime = false,
  otherTimeValue,
}) => {
  const [typedText, setTypedText] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic placement state: handles both horizontal and vertical viewport bounds
  const [popoverPos, setPopoverPos] = useState<{
    vertical: 'bottom' | 'top';
    horizontal: 'left' | 'right';
    maxListHeight: number;
  }>({
    vertical: 'bottom',
    horizontal: isEndTime ? 'right' : 'left',
    maxListHeight: 160,
  });

  // Sync internal text state with external prop
  useEffect(() => {
    setTypedText(value);
  }, [value]);

  // Measure and position the popover dynamically so it never overflows or clips
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const calcPosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pickerWidth = 190;
      const pickerHeight = 225;

      const viewportHeight = window.innerHeight;
      // 75px safety buffer for bottom navigation & action buttons
      const spaceBelow = viewportHeight - rect.bottom - 75;
      const spaceAbove = rect.top - 70;

      let vertical: 'bottom' | 'top' = 'bottom';
      let maxListH = 160;

      // Auto-reposition above input if not enough room below
      if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) {
        vertical = 'top';
        maxListH = Math.min(160, Math.max(110, spaceAbove - 60));
      } else {
        vertical = 'bottom';
        maxListH = Math.min(160, Math.max(110, spaceBelow - 60));
      }

      // Detect mobile canvas container bounds
      const mobileCanvas =
        containerRef.current.closest('.spotfree-canvas') ||
        containerRef.current.closest('.max-w-\\[430px\\]') ||
        document.body;
      const canvasRect = mobileCanvas.getBoundingClientRect();

      let horizontal: 'left' | 'right' = isEndTime ? 'right' : 'left';

      // If left-aligned would extend beyond right edge of container, flip to right
      if (rect.left + pickerWidth > canvasRect.right - 10) {
        horizontal = 'right';
      }
      // If right-aligned would extend beyond left edge, flip to left
      if (rect.right - pickerWidth < canvasRect.left + 10) {
        horizontal = 'left';
      }

      setPopoverPos({
        vertical,
        horizontal,
        maxListHeight: maxListH,
      });
    };

    calcPosition();
    window.addEventListener('resize', calcPosition);
    window.addEventListener('scroll', calcPosition, true);
    return () => {
      window.removeEventListener('resize', calcPosition);
      window.removeEventListener('scroll', calcPosition, true);
    };
  }, [isOpen, isEndTime]);

  // Close popover on outside click or escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Real device local current minutes & today check
  const isToday = selectedDate === getTodayDateString();
  const currentMinutes = getCurrentLocalMinutes();
  const startMinutes = isEndTime && otherTimeValue ? time12ToMinutes(otherTimeValue) : null;

  // Parse currently typed/stored value to determine active hour & minute in picker
  const parsedHourMinute = (() => {
    const match = typedText.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
    if (match) {
      const rawH = parseInt(match[1], 10);
      const m = match[2];
      const mer = match[3].toUpperCase() as 'AM' | 'PM';
      const foundHour = HOUR_OPTIONS.find((h) => h.hourNum === rawH && h.meridiem === mer);
      if (foundHour) {
        return { hour: foundHour, minute: m };
      }
    }
    return null;
  })();

  // Determine initial active hour: match value or first available future hour
  const defaultHour = (() => {
    if (parsedHourMinute) return parsedHourMinute.hour;
    if (isToday) {
      const availableHour = HOUR_OPTIONS.find((h) => {
        const latestMins = h.h24 === 16 ? 960 : h.h24 * 60 + 45;
        return latestMins >= currentMinutes;
      });
      return availableHour || HOUR_OPTIONS[0];
    }
    return HOUR_OPTIONS[0];
  })();

  const [activeHour, setActiveHour] = useState<HourOption>(defaultHour);
  const [activeMinute, setActiveMinute] = useState<string>(parsedHourMinute?.minute || '00');

  useEffect(() => {
    if (parsedHourMinute) {
      setActiveHour(parsedHourMinute.hour);
      setActiveMinute(parsedHourMinute.minute);
    }
  }, [value, isOpen]);

  // Handle manual typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setTypedText(newText);
    onChange(newText);
  };

  // On blur, normalize valid input (e.g. "9:00 am" -> "09:00 AM")
  const handleBlur = () => {
    const res = validateAndNormalize12HrTime(typedText);
    if (res.isValid && res.normalized) {
      setTypedText(res.normalized);
      onChange(res.normalized);
    }
  };

  // Click on an hour button in the Hour column
  const handleSelectHour = (h: HourOption) => {
    setActiveHour(h);

    let targetMin = activeMinute;
    if (h.h24 === 16 && targetMin !== '00') {
      targetMin = '00';
    } else if (isToday) {
      const testMins = h.h24 * 60 + parseInt(targetMin, 10);
      if (testMins < currentMinutes) {
        const validMin = MINUTE_OPTIONS.find((m) => h.h24 * 60 + parseInt(m, 10) >= currentMinutes);
        if (validMin) targetMin = validMin;
      }
    }

    setActiveMinute(targetMin);
    const newTime = `${String(h.hourNum).padStart(2, '0')}:${targetMin} ${h.meridiem}`;
    setTypedText(newTime);
    onChange(newTime);
  };

  // Click on a minute button in the Minute column
  const handleSelectMinute = (m: string) => {
    setActiveMinute(m);
    const newTime = `${String(activeHour.hourNum).padStart(2, '0')}:${m} ${activeHour.meridiem}`;
    setTypedText(newTime);
    onChange(newTime);
    setIsOpen(false);
  };

  // Theme styling for active selections
  const activeSelectionClass =
    themeColor === 'emerald'
      ? 'bg-emerald-600 text-white font-bold shadow-xs'
      : themeColor === 'slate'
      ? 'bg-slate-800 text-white font-bold shadow-xs'
      : 'bg-amber-600 text-white font-bold shadow-xs';

  const borderClass = error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/40 text-rose-950'
    : themeColor === 'emerald'
    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white'
    : themeColor === 'slate'
    ? 'border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 bg-white'
    : 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white';

  return (
    <div ref={containerRef} className="flex flex-col gap-1 w-full relative">
      <label htmlFor={id} className="text-[11px] font-bold text-slate-800">
        {label}
      </label>

      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={typedText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`w-full text-xs font-bold text-slate-900 px-3 py-2 pr-9 rounded-xl border transition-all shadow-2xs ${borderClass} ${
            disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''
          }`}
        />

        {/* Compact Picker Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          title={`Select ${label}`}
          aria-label={`Select ${label}`}
          aria-expanded={isOpen}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
            isOpen
              ? 'text-slate-900 bg-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
          }`}
        >
          <span className="material-symbols-outlined text-base">schedule</span>
        </button>

        {/* Two-Column Mobile Picker: HOUR | MIN */}
        {isOpen && (
          <div
            className={`absolute z-50 w-[190px] bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-100 ${
              popoverPos.vertical === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } ${
              popoverPos.horizontal === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-800 truncate">Select {label}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                aria-label="Close time picker"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            {/* Two Columns: HOUR | MIN */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Hour Column */}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center pb-1 mb-1 border-b border-slate-100">
                  HOUR
                </span>
                <div
                  style={{ maxHeight: `${popoverPos.maxListHeight}px` }}
                  className="flex flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5"
                >
                  {HOUR_OPTIONS.map((h) => {
                    const latestMins = h.h24 === 16 ? 960 : h.h24 * 60 + 45;
                    const isPassedToday = isToday && currentMinutes > latestMins;
                    const isBeforeStart = isEndTime && startMinutes !== null && latestMins <= startMinutes;
                    const isHourDisabled = isPassedToday || isBeforeStart;
                    const isSelected = activeHour.h24 === h.h24;

                    return (
                      <button
                        key={h.label}
                        type="button"
                        disabled={isHourDisabled}
                        onClick={() => handleSelectHour(h)}
                        className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg text-center transition-all cursor-pointer ${
                          isSelected
                            ? activeSelectionClass
                            : isHourDisabled
                            ? 'opacity-25 bg-slate-50 text-slate-300 cursor-not-allowed pointer-events-none'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                        }`}
                      >
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute Column */}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center pb-1 mb-1 border-b border-slate-100">
                  MIN
                </span>
                <div
                  style={{ maxHeight: `${popoverPos.maxListHeight}px` }}
                  className="flex flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5"
                >
                  {MINUTE_OPTIONS.map((m) => {
                    const slotMins = activeHour.h24 * 60 + parseInt(m, 10);
                    const isPast4PM = activeHour.h24 === 16 && m !== '00';
                    const isPassedToday = isToday && slotMins < currentMinutes;
                    const isBeforeStart = isEndTime && startMinutes !== null && slotMins <= startMinutes;
                    const isMinuteDisabled = isPast4PM || isPassedToday || isBeforeStart;
                    const isSelected = activeMinute === m && !isMinuteDisabled;

                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={isMinuteDisabled}
                        onClick={() => handleSelectMinute(m)}
                        className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg text-center transition-all cursor-pointer ${
                          isSelected
                            ? activeSelectionClass
                            : isMinuteDisabled
                            ? 'opacity-25 bg-slate-50 text-slate-300 cursor-not-allowed pointer-events-none'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {error && (
        <span className="text-[10px] font-semibold text-rose-600 flex items-start gap-1 mt-0.5 leading-tight animate-in fade-in duration-100">
          <span className="material-symbols-outlined text-xs shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </span>
      )}
    </div>
  );
};

/**
 * SpotFree Reservation Window
 * Clean, self-explanatory Date & Time interface:
 * - Real local date picker (Today + next 5 calendar days)
 * - 12-Hour format Start Time & End Time fields
 * - Two-column mobile picker: HOUR | MIN
 * - Responsive layout adapted to ~390–430px mobile width
 */
export const ReservationWindow: React.FC<ReservationWindowProps> = ({
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  disabled = false,
  roomId,
  theme = 'amber',
  onValidationChange,
  checkOverlapFn,
}) => {
  const dateOptions = getReservationDateOptions();
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  const startTimeId = useId();
  const endTimeId = useId();

  // Close date menu on outside click or escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setIsDateMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDateMenuOpen(false);
      }
    };
    if (isDateMenuOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDateMenuOpen]);

  // Selected date info
  const selectedDateOpt = dateOptions.find((opt) => opt.value === date) || dateOptions[0];

  // Validate date + times
  const validation: ReservationValidation = validateReservation(
    date,
    startTime,
    endTime,
    checkOverlapFn
  );

  // Notify parent of validation changes
  useEffect(() => {
    if (onValidationChange) {
      const firstError =
        validation.startDateError ||
        validation.startTimeError ||
        validation.endTimeError ||
        validation.generalError;
      onValidationChange(validation.isValid, firstError);
    }
  }, [
    validation.isValid,
    validation.startDateError,
    validation.startTimeError,
    validation.endTimeError,
    validation.generalError,
    onValidationChange,
  ]);

  const containerThemeClass =
    theme === 'emerald'
      ? 'bg-emerald-50/80 border-emerald-200'
      : theme === 'slate'
      ? 'bg-slate-50 border-slate-200'
      : 'bg-amber-50 rounded-xl border border-amber-200';

  const headerThemeText =
    theme === 'emerald'
      ? 'text-emerald-950'
      : theme === 'slate'
      ? 'text-slate-900'
      : 'text-amber-900';

  const activeDateItemClass =
    theme === 'emerald'
      ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold'
      : theme === 'slate'
      ? 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
      : 'bg-amber-50 text-amber-950 border-amber-300 font-bold';

  return (
    <div className={`p-3.5 rounded-xl border flex flex-col gap-3 animate-in fade-in duration-150 ${containerThemeClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className={`text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${headerThemeText}`}>
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>Reservation Window</span>
        </label>
      </div>

      {/* Date Picker */}
      <div ref={dateDropdownRef} className="flex flex-col gap-1 w-full relative">
        <label className="text-[11px] font-bold text-slate-800">
          Date
        </label>

        {/* Date Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsDateMenuOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={isDateMenuOpen}
          aria-label="Select reservation date"
          className={`w-full text-left text-xs font-bold text-slate-900 px-3 py-2.5 rounded-xl bg-white border shadow-2xs transition-all flex items-center justify-between cursor-pointer ${
            validation.startDateError
              ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/40'
              : isDateMenuOpen
              ? 'border-slate-800 ring-2 ring-slate-800/10'
              : theme === 'emerald'
              ? 'border-emerald-300 hover:border-emerald-400'
              : theme === 'slate'
              ? 'border-slate-300 hover:border-slate-400'
              : 'border-amber-300 hover:border-amber-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-slate-500">calendar_month</span>
            <span>{selectedDateOpt.fullLabel}</span>
          </div>
          <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform ${isDateMenuOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Date Dropdown Menu (Today and Next 5 Days) */}
        {isDateMenuOpen && (
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            {dateOptions.map((opt) => {
              const isSelected = opt.value === date;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onDateChange(opt.value);
                    setIsDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all border cursor-pointer ${
                    isSelected
                      ? activeDateItemClass
                      : 'border-transparent hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-base ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {opt.isToday ? 'today' : 'event'}
                    </span>
                    <span className="font-bold text-slate-900">{opt.fullLabel}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {opt.isToday && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                        TODAY
                      </span>
                    )}
                    {isSelected && (
                      <span className="material-symbols-outlined text-sm text-slate-800">check</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Date Validation Error */}
        {validation.startDateError && (
          <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-xs">error</span>
            {validation.startDateError}
          </span>
        )}
      </div>

      {/* Start Time & End Time - Two-column responsive layout */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <Time12InputField
          id={startTimeId}
          label="Start Time"
          value={startTime}
          onChange={onStartTimeChange}
          disabled={disabled}
          placeholder="09:00 AM"
          error={validation.startTimeError}
          themeColor={theme}
          selectedDate={date}
          isEndTime={false}
          otherTimeValue={endTime}
        />

        <Time12InputField
          id={endTimeId}
          label="End Time"
          value={endTime}
          onChange={onEndTimeChange}
          disabled={disabled}
          placeholder="10:00 AM"
          error={validation.endTimeError}
          themeColor={theme}
          selectedDate={date}
          isEndTime={true}
          otherTimeValue={startTime}
        />
      </div>

      {/* Overlap or General Validation Error */}
      {validation.generalError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-900 text-xs font-semibold animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-base text-rose-600 shrink-0">warning</span>
          <span>{validation.generalError}</span>
        </div>
      )}
    </div>
  );
};
