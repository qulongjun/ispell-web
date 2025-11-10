/*
 * @Date: 2025-11-09
 * @Description: 设置表单的通用控件（按钮、下拉、开关等）
 */
'use client';

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';

// --- 按钮控件 ---

/**
 * 表单提交按钮组件 (样式参考 ProfileInfoSection)
 */
export const FormButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, ...props }) => (
  <button
    type="button" // 默认为 "button"，防止意外触发表单提交
    className={`inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// --- 表单控件 ---

/**
 * 滑块输入组件
 */
interface SliderItemProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  displayValue: string;
  disabled?: boolean;
}
export function SliderItem({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
  disabled,
}: SliderItemProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-gray-900 dark:accent-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={label}
      />
    </div>
  );
}

/**
 * 下拉选择组件
 */
interface SelectItemProps<T extends string> {
  label: string;
  options: { label: string; value: T }[];
  selectedValue: T;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}
export function SelectItem<T extends string>({
  label,
  options,
  selectedValue,
  onChange,
  disabled,
}: SelectItemProps<T>) {
  // 下拉箭头图标（适配明暗模式）
  const lightArrow = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
  const darkArrow = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

  return (
    <div>
      <label
        htmlFor={label}
        className="text-sm font-medium text-gray-900 dark:text-white block mb-1.5"
      >
        {label}
      </label>
      <select
        id={label}
        value={selectedValue}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 py-2.5 px-3 pr-10 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-gray-600 dark:focus:ring-gray-600 appearance-none bg-no-repeat bg-right bg-[length:1.5em_1.5em] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundImage: `var(--select-arrow, ${lightArrow})` }}
        onFocus={(e) => {
          const isDark =
            document.documentElement.getAttribute('data-theme') === 'dark';
          e.target.style.setProperty(
            '--select-arrow',
            isDark ? darkArrow : lightArrow
          );
        }}
        onClick={(e) => {
          const isDark =
            document.documentElement.getAttribute('data-theme') === 'dark';
          (e.target as HTMLSelectElement).style.setProperty(
            '--select-arrow',
            isDark ? darkArrow : lightArrow
          );
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * 开关切换组件
 */
interface ToggleItemProps {
  label: string;
  checked: boolean;
  onChange: (newCheckedState: boolean) => void;
  disabled?: boolean;
  hint?: string; // 添加了 hint 属性
}
export function ToggleItem({
  label,
  checked,
  onChange,
  disabled,
  hint, // 获取 hint 属性
}: ToggleItemProps) {
  return (
    // 添加了外层 div 
    <div> 
      <div className="flex items-center justify-between">
        <label
          htmlFor={label}
          className={`text-sm font-medium text-gray-900 dark:text-white ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          {label}
        </label>
        <button
          id={label}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          disabled={disabled}
          className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            checked
              ? 'bg-gray-900 dark:bg-gray-700'
              : 'bg-gray-200 dark:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {/* 添加了 hint 渲染逻辑 */}
      {hint && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}