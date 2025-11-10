/*
 * @Date: 2025-11-09
 * @Description: 背诵（显示模式）设置卡片组件
 */
'use client';

import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useSettings } from '@/contexts/setting.context';
import { apiUpdateSettings } from '@/services/settingService';
import { DisplayMode } from '@/types/setting.types';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import SectionCard from '@/components/common/SectionCard';
import { Loader2, Save } from 'lucide-react';
// 导入（或创建）表单控件
import {
  SelectItem,
  ToggleItem,
  FormButton,
} from '@/components/settings/SettingsFormControls';

/**
 * 背诵设置卡片
 * 管理显示模式和例句单词隐藏
 */
const DisplaySettingsSection = () => {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('common');

  // 1. 全局状态
  const {
    displayMode: globalDisplayMode,
    hideWordInSentence: globalHideWordInSentence,
    refreshSettings,
  } = useSettings();

  // 2. 本地状态
  const [localDisplayMode, setLocalDisplayMode] = useState(globalDisplayMode);
  const [localHideWordInSentence, setLocalHideWordInSentence] = useState(
    globalHideWordInSentence
  );
  const [isSaving, setIsSaving] = useState(false);

  // 3. 脏状态检查
  const isDirty = useMemo(() => {
    return (
      localDisplayMode !== globalDisplayMode ||
      localHideWordInSentence !== globalHideWordInSentence
    );
  }, [
    localDisplayMode,
    localHideWordInSentence,
    globalDisplayMode,
    globalHideWordInSentence,
  ]);

  // 4. 刷新本地状态
  useEffect(() => {
    if (!isSaving) {
      setLocalDisplayMode(globalDisplayMode);
      setLocalHideWordInSentence(globalHideWordInSentence);
    }
  }, [globalDisplayMode, globalHideWordInSentence]);

  // 5. 事件处理器
  const handleDisplayModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as DisplayMode;
    setLocalDisplayMode(newMode);
    // 联动：切换到非默认模式时，自动开启“隐藏例句单词”
    if (newMode !== 'full') {
      setLocalHideWordInSentence(true);
    }
  };

  // 6. 保存逻辑
  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      await apiUpdateSettings({
        displayMode: localDisplayMode,
        hideWordInSentence: localHideWordInSentence,
      });
      await refreshSettings();
      toast.success(tCommon('messages.operationSuccess'));
    } catch (error) {
      toast.error(tCommon('messages.operationFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  // 选项常量
  const DISPLAY_MODE_OPTIONS = [
    { value: 'full', label: t('options.displayMode.full') },
    { value: 'hideVowels', label: t('options.displayMode.hideVowels') },
    { value: 'hideConsonants', label: t('options.displayMode.hideConsonants') },
    { value: 'hideRandom', label: t('options.displayMode.hideRandom') },
    { value: 'hideAll', label: t('options.displayMode.hideAll') },
  ];

  return (
    <SectionCard
      title={t('sectionTitles.display')}
      footer={
        <FormButton onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {tCommon('buttons.save')}
        </FormButton>
      }
    >
      <SelectItem
        label={t('labels.displayMode')}
        options={DISPLAY_MODE_OPTIONS}
        selectedValue={localDisplayMode}
        onChange={handleDisplayModeChange}
        disabled={isSaving}
      />
      <ToggleItem
        label={t('labels.hideWordInSentence')}
        checked={localHideWordInSentence}
        onChange={setLocalHideWordInSentence}
        disabled={isSaving}
        hint={t('labels.hideWordInSentenceHint')} // 添加了提示
      />
    </SectionCard>
  );
};

export default DisplaySettingsSection;