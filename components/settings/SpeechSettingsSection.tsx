/*
 * @Date: 2025-11-09
 * @Description: 语音设置卡片组件
 */
'use client';

import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useSettings } from '@/contexts/setting.context';
import { apiUpdateSettings } from '@/services/settingService';
import { AccentType, GenderType } from '@/types/setting.types';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import SectionCard from '@/components/common/SectionCard';
import { Loader2, Save } from 'lucide-react';
import {
  SelectItem,
  SliderItem,
  FormButton,
} from '@/components/settings/SettingsFormControls';

/**
 * 语音设置卡片
 * 管理与发音相关的所有设置，并独立保存
 */
const SpeechSettingsSection = () => {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('common');

  // 1. 从上下文获取“已保存”的全局状态
  const {
    speechConfig: globalSpeechConfig,
    isCustomSpeech: globalIsCustomSpeech,
    refreshSettings,
  } = useSettings();

  // 2. 创建本地状态 (Local State)，用于表单编辑
  const [localSpeechConfig, setLocalSpeechConfig] =
    useState(globalSpeechConfig);
  const [localIsCustomSpeech, setLocalIsCustomSpeech] =
    useState(globalIsCustomSpeech);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 3. 跟踪“脏”状态 (isDirty)
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(localSpeechConfig) !==
        JSON.stringify(globalSpeechConfig) ||
      localIsCustomSpeech !== globalIsCustomSpeech
    );
  }, [
    localSpeechConfig,
    localIsCustomSpeech,
    globalSpeechConfig,
    globalIsCustomSpeech,
  ]);

  // 4. 当全局状态（因刷新）变化时，重置本地状态
  useEffect(() => {
    if (!isSaving) {
      // 仅在非保存状态下同步，避免覆盖
      setLocalSpeechConfig(globalSpeechConfig);
      setLocalIsCustomSpeech(globalIsCustomSpeech);
    }
  }, [globalSpeechConfig, globalIsCustomSpeech]);

  // 5. 本地事件处理器
  const handleSpeechSourceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLocalIsCustomSpeech(e.target.value === 'true');
  };
  const handleRateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalSpeechConfig((config) => ({
      ...config,
      rate: parseFloat(e.target.value),
    }));
  };
  const handleAccentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newAccent = e.target.value as AccentType;
    setLocalSpeechConfig((config) => ({
      ...config,
      accent: newAccent,
      lang: newAccent,
    }));
  };
  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLocalSpeechConfig((config) => ({
      ...config,
      gender: e.target.value as GenderType,
    }));
  };

  // 6. 保存逻辑
  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    setApiError(null);
    try {
      await apiUpdateSettings({
        speechConfig: localSpeechConfig,
        isCustomSpeech: localIsCustomSpeech,
      });
      await refreshSettings(); // 成功后刷新全局状态
      toast.success(tCommon('messages.operationSuccess'));
    } catch (error) {
      toast.error(tCommon('messages.operationFailed'));
      setApiError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 选项常量
  const SPEECH_SOURCE_OPTIONS = [
    { value: 'false', label: t('options.speechSource.default') },
    { value: 'true', label: t('options.speechSource.custom') },
  ];
  const ACCENT_OPTIONS = [
    { value: 'en-US', label: t('options.accent.american') },
    { value: 'en-GB', label: t('options.accent.british') },
  ];
  const GENDER_OPTIONS = [
    { value: 'auto', label: t('options.gender.auto') },
    { value: 'male', label: t('options.gender.male') },
    { value: 'female', label: t('options.gender.female') },
  ];

  return (
    <SectionCard
      title={t('sectionTitles.speech')}
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
        label={t('labels.speechSource')}
        options={SPEECH_SOURCE_OPTIONS}
        selectedValue={String(localIsCustomSpeech)}
        onChange={handleSpeechSourceChange}
        disabled={isSaving}
      />
      <SelectItem
        label={t('labels.accent')}
        options={ACCENT_OPTIONS}
        selectedValue={localSpeechConfig.accent}
        onChange={handleAccentChange}
        disabled={isSaving}
      />
      {localIsCustomSpeech && (
        <>
          <SliderItem
            label={t('labels.speechRate')}
            value={localSpeechConfig.rate}
            min={0.5}
            max={1.5}
            step={0.1}
            onChange={handleRateChange}
            displayValue={localSpeechConfig.rate.toFixed(1)}
            disabled={isSaving}
          />
          <SelectItem
            label={t('labels.voiceGender')}
            options={GENDER_OPTIONS}
            selectedValue={localSpeechConfig.gender}
            onChange={handleGenderChange}
            disabled={isSaving}
          />
        </>
      )}
      {/* 可以在这里显示 apiError */}
    </SectionCard>
  );
};

export default SpeechSettingsSection;
