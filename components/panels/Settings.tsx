'use client';
/*
 * @Date: 2025-10-27 02:37:15
 * @LastEditTime: 2025-11-01 15:41:10
 * @Description: 单词拼写功能的设置面板组件（支持国际化）
 */

import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useTranslations } from 'next-intl'; // 导入国际化Hook
import { useSpelling } from '@/contexts/spelling.context';
import { AccentType, DisplayMode, GenderType } from '@/types/word.types';
import { Settings as SettingsIcon, X } from 'lucide-react';

/**
 * 选项配置（仅保留value，label通过国际化获取）
 */
const SPEECH_SOURCE_OPTIONS = [
  { value: 'false' as const }, // 默认发音 (API)
  { value: 'true' as const }, // 自定义发音 (Browser)
];
const ACCENT_OPTIONS = [
  { value: 'en-US' as AccentType }, // 美式
  { value: 'en-GB' as AccentType }, // 英式
];
const GENDER_OPTIONS = [
  { value: 'auto' as GenderType }, // 随机
  { value: 'male' as GenderType }, // 男声
  { value: 'female' as GenderType }, // 女声
];
const DISPLAY_MODE_OPTIONS = [
  { value: 'full' as DisplayMode }, // 默认
  { value: 'hideVowels' as DisplayMode }, // 隐藏元音
  { value: 'hideConsonants' as DisplayMode }, // 隐藏辅音
  { value: 'hideRandom' as DisplayMode }, // 随机隐藏
  { value: 'hideAll' as DisplayMode }, // 全部隐藏
];

/**
 * 设置表单
 */
const SettingsForm = () => {
  const t = useTranslations('Settings'); // 国际化翻译Hook（独立Settings命名空间）

  // 从Hook获取状态
  const {
    speechConfig,
    setSpeechConfig,
    displayMode,
    setDisplayMode,
    isCustomSpeech,
    setIsCustomSpeech,
    showSentences,
    setShowSentences,
  } = useSpelling();

  // 事件处理函数
  const handleSpeechSourceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setIsCustomSpeech(e.target.value === 'true');
  };
  const handleRateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSpeechConfig((config) => ({
      ...config,
      rate: parseFloat(e.target.value),
    }));
  };
  const handleAccentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newAccent = e.target.value as AccentType;
    setSpeechConfig((config) => ({
      ...config,
      accent: newAccent,
      lang: newAccent,
    }));
  };
  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSpeechConfig((config) => ({
      ...config,
      gender: e.target.value as GenderType,
    }));
  };
  const handleDisplayModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDisplayMode(e.target.value as DisplayMode);
  };

  return (
    <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* 语音设置 */}
      <section>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
          {t('sectionTitles.speechSettings')}
        </h3>
        <div className="space-y-3">
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

      {/* 单词显示设置 */}
      <section>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
          {t('sectionTitles.displaySettings')}
        </h3>
        <SelectItem
          label={t('labels.displayMode')}
          options={DISPLAY_MODE_OPTIONS.map((option) => ({
            value: option.value,
            label: t(`options.displayMode.${option.value}`),
          }))}
          selectedValue={displayMode}
          onChange={handleDisplayModeChange}
        />
      </section>

      {/* 内容显示设置 */}
      <section>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
          {t('sectionTitles.contentSettings')}
        </h3>
        <ToggleItem
          label={t('labels.showSentences')}
          checked={showSentences}
          onChange={setShowSentences}
        />
      </section>
    </div>
  );
};

// 滑块组件（保持逻辑，仅国际化label）
interface SliderItemProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
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
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-gray-600 dark:accent-gray-400"
      />
    </div>
  );
}

// 下拉选择组件（保持逻辑，仅国际化label）
interface SelectItemProps<T extends string> {
  label: string;
  options: { label: string; value: T }[];
  selectedValue: T;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

function SelectItem<T extends string>({
  label,
  options,
  selectedValue,
  onChange,
}: SelectItemProps<T>) {
  return (
    <div>
      <label
        htmlFor={label}
        className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1"
      >
        {label}
      </label>
      <select
        id={label}
        value={selectedValue}
        onChange={onChange}
        className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-0 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-0 dark:focus:border-gray-600"
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

// 开关组件（保持逻辑，仅国际化label）
interface ToggleItemProps {
  label: string;
  checked: boolean;
  onChange: Dispatch<SetStateAction<boolean>>;
}

function ToggleItem({ label, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={label}
        className="text-xs font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <button
        id={label}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange((prev) => !prev)}
        className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
          checked ? 'bg-gray-600' : 'bg-gray-300 dark:bg-gray-700'
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

/**
 * 设置面板主组件（国际化无障碍标签）
 */
const Settings = () => {
  const t = useTranslations('Settings');

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label={t('aria.openSettings')}
          className="fixed bottom-6 right-4 sm:right-6 p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-full shadow-lg group transition-all duration-300  hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-600 focus:ring-offset-2 z-30"
        >
          <SettingsIcon className="transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          align="end"
          className="z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl outline-none dark:bg-gray-900 dark:border-gray-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2"
        >
          <SettingsForm />
          <Popover.Close
            className="absolute right-2 top-2 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label={t('aria.closeSettings')}
          >
            <X className="h-4 w-4" />
          </Popover.Close>
          <Popover.Arrow className="fill-white dark:fill-gray-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default Settings;
