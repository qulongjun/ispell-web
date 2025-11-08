/*
 * @Date: 2025-10-27 02:37:15
 * @LastEditTime: 2025-11-08 23:14:08
 * @Description: 单词拼写功能的设置表单组件
 */
'use client';

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { useSpelling } from '@/contexts/spelling.context';
import { AccentType, DisplayMode, GenderType } from '@/types/word.types';

/**
 * 语音来源选项配置
 * 包含默认发音(API)和自定义发音(Browser)两种选择
 */
const SPEECH_SOURCE_OPTIONS = [
  { value: 'false' as const }, // 默认发音 (API)
  { value: 'true' as const }, // 自定义发音 (Browser)
];

/**
 * 口音选项配置
 * 支持美式英语和英式英语两种口音
 */
const ACCENT_OPTIONS = [
  { value: 'en-US' as AccentType }, // 美式英语
  { value: 'en-GB' as AccentType }, // 英式英语
];

/**
 * 语音性别选项配置
 * 支持自动、男声、女声三种选择（仅自定义发音模式可用）
 */
const GENDER_OPTIONS = [
  { value: 'auto' as GenderType }, // 随机性别
  { value: 'male' as GenderType }, // 男声
  { value: 'female' as GenderType }, // 女声
];

/**
 * 单词显示模式选项配置
 * 提供多种单词显示方式，用于调整拼写练习难度
 */
const DISPLAY_MODE_OPTIONS = [
  { value: 'full' as DisplayMode }, // 完整显示（默认）
  { value: 'hideVowels' as DisplayMode }, // 隐藏元音字母
  { value: 'hideConsonants' as DisplayMode }, // 隐藏辅音字母
  { value: 'hideRandom' as DisplayMode }, // 随机隐藏部分字母
  { value: 'hideAll' as DisplayMode }, // 完全隐藏单词
];

/**
 * 单词拼写设置表单组件
 * 提供直观的界面用于配置拼写练习的各项参数，包括：
 * - 语音设置：发音来源、口音、语速（自定义模式）、语音性别（自定义模式）
 * - 单词显示设置：显示模式、是否在例句中隐藏目标单词
 * - 内容设置：是否显示例句、是否显示例句翻译
 * 所有设置实时生效并通过上下文管理状态
 */
const SettingsForm = () => {
  const t = useTranslations('Settings'); // 国际化翻译

  // 从拼写上下文获取状态和状态更新函数
  const {
    speechConfig,
    setSpeechConfig,
    displayMode,
    setDisplayMode,
    isCustomSpeech,
    setIsCustomSpeech,
    showSentences,
    setShowSentences,
    showSentenceTranslation,
    setShowSentenceTranslation,
    hideWordInSentence,
    setHideWordInSentence,
  } = useSpelling();

  /**
   * 处理语音来源变更（默认/自定义）
   * @param e 选择框事件对象
   */
  const handleSpeechSourceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setIsCustomSpeech(e.target.value === 'true');
  };

  /**
   * 处理语速变更（仅自定义语音模式可用）
   * @param e 滑块事件对象
   */
  const handleRateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSpeechConfig((config) => ({
      ...config,
      rate: parseFloat(e.target.value),
    }));
  };

  /**
   * 处理口音变更
   * @param e 选择框事件对象
   */
  const handleAccentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newAccent = e.target.value as AccentType;
    setSpeechConfig((config) => ({
      ...config,
      accent: newAccent,
      lang: newAccent, // 同步更新语言代码
    }));
  };

  /**
   * 处理语音性别变更（仅自定义语音模式可用）
   * @param e 选择框事件对象
   */
  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSpeechConfig((config) => ({
      ...config,
      gender: e.target.value as GenderType,
    }));
  };

  /**
   * 处理显示模式变更
   * 当模式不是完整显示时，自动开启"在例句中隐藏单词"选项
   * @param e 选择框事件对象
   */
  const handleDisplayModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as DisplayMode;
    setDisplayMode(newMode);

    // 非完整显示模式下强制隐藏例句中的目标单词
    if (newMode !== 'full') {
      setHideWordInSentence(true);
    }
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* 语音设置区域 */}
      <section>
        <div className="space-y-4">
          <SelectItem
            label={t('labels.speechSource')}
            options={SPEECH_SOURCE_OPTIONS.map((option) => ({
              value: option.value,
              label:
                option.value === 'false'
                  ? t('options.speechSource.default')
                  : t('options.speechSource.custom'),
            }))}
            selectedValue={String(isCustomSpeech)}
            onChange={handleSpeechSourceChange}
          />

          <SelectItem
            label={t('labels.accent')}
            options={ACCENT_OPTIONS.map((option) => ({
              value: option.value,
              label:
                option.value === 'en-US'
                  ? t('options.accent.american')
                  : t('options.accent.british'),
            }))}
            selectedValue={speechConfig.accent}
            onChange={handleAccentChange}
          />

          {/* 自定义语音模式下显示额外设置项 */}
          {isCustomSpeech && (
            <>
              <SliderItem
                label={t('labels.speechRate')}
                value={speechConfig.rate}
                min={0.5}
                max={1.5}
                step={0.1}
                onChange={handleRateChange}
                displayValue={speechConfig.rate.toFixed(1)}
              />

              <SelectItem
                label={t('labels.voiceGender')}
                options={GENDER_OPTIONS.map((option) => ({
                  value: option.value,
                  label:
                    option.value === 'auto'
                      ? t('options.gender.auto')
                      : option.value === 'male'
                      ? t('options.gender.male')
                      : t('options.gender.female'),
                }))}
                selectedValue={speechConfig.gender}
                onChange={handleGenderChange}
              />
            </>
          )}
        </div>
      </section>

      {/* 单词显示设置区域 */}
      <section>
        <div className="space-y-4">
          <SelectItem
            label={t('labels.displayMode')}
            options={DISPLAY_MODE_OPTIONS.map((option) => ({
              value: option.value,
              label: t(`options.displayMode.${option.value}`),
            }))}
            selectedValue={displayMode}
            onChange={handleDisplayModeChange}
          />

          <ToggleItem
            label={t('labels.hideWordInSentence')}
            checked={hideWordInSentence}
            onChange={setHideWordInSentence}
          />
        </div>
      </section>

      {/* 内容设置区域 */}
      <section>
        <div className="space-y-4">
          <ToggleItem
            label={t('labels.showSentences')}
            checked={showSentences}
            onChange={setShowSentences}
          />

          <ToggleItem
            label={t('labels.showSentenceTranslation')}
            checked={showSentenceTranslation}
            onChange={setShowSentenceTranslation}
          />
        </div>
      </section>
    </div>
  );
};

/**
 * 滑块输入组件
 * 用于需要精确数值调整的设置（如语速）
 */
interface SliderItemProps {
  /** 滑块标签文本 */
  label: string;
  /** 当前值 */
  value: number;
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 步长 */
  step: number;
  /** 值变更回调 */
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** 显示的格式化值 */
  displayValue: string;
}
function SliderItem({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
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
        className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-gray-900 dark:accent-gray-500"
        aria-label={label}
      />
    </div>
  );
}

/**
 * 下拉选择组件
 * 用于从多个选项中选择（如语音来源、口音）
 */
interface SelectItemProps<T extends string> {
  /** 选择框标签文本 */
  label: string;
  /** 选项列表 */
  options: { label: string; value: T }[];
  /** 当前选中值 */
  selectedValue: T;
  /** 选择变更回调 */
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}
function SelectItem<T extends string>({
  label,
  options,
  selectedValue,
  onChange,
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
        className="w-full rounded-lg border border-gray-300 py-2.5 px-3 pr-10 text-gray-900 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-gray-600 dark:focus:ring-gray-600 appearance-none bg-no-repeat bg-right bg-[length:1.5em_1.5em]"
        style={{ backgroundImage: `var(--select-arrow, ${lightArrow})` }}
        // 焦点和点击时更新箭头颜色以适配当前主题
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
 * 用于二元状态切换（如是否显示例句）
 */
interface ToggleItemProps {
  /** 开关标签文本 */
  label: string;
  /** 是否开启 */
  checked: boolean;
  /** 状态变更回调 */
  onChange: Dispatch<SetStateAction<boolean>>;
}
function ToggleItem({ label, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={label}
        className="text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <button
        id={label}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange((prev) => !prev)}
        className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          checked
            ? 'bg-gray-900 dark:bg-gray-700'
            : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsForm;
