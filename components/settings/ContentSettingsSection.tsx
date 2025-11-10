/*
 * @Date: 2025-11-09
 * @Description: 内容（例句）设置卡片组件
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '@/contexts/setting.context';
import { apiUpdateSettings } from '@/services/settingService';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import SectionCard from '@/components/common/SectionCard';
import { Loader2, Save } from 'lucide-react';
import {
  ToggleItem,
  FormButton,
} from '@/components/settings/SettingsFormControls';

/**
 * 内容设置卡片
 * 管理例句和翻译的显示
 */
const ContentSettingsSection = () => {
  const t = useTranslations('Settings');
  const tCommon = useTranslations('common');

  // 1. 全局状态
  const {
    showSentences: globalShowSentences,
    showSentenceTranslation: globalShowSentenceTranslation,
    refreshSettings,
  } = useSettings();

  // 2. 本地状态
  const [localShowSentences, setLocalShowSentences] =
    useState(globalShowSentences);
  const [localShowSentenceTranslation, setLocalShowSentenceTranslation] =
    useState(globalShowSentenceTranslation);
  const [isSaving, setIsSaving] = useState(false);

  // 3. 脏状态检查
  const isDirty = useMemo(() => {
    return (
      localShowSentences !== globalShowSentences ||
      localShowSentenceTranslation !== globalShowSentenceTranslation
    );
  }, [
    localShowSentences,
    localShowSentenceTranslation,
    globalShowSentences,
    globalShowSentenceTranslation,
  ]);

  // 4. 刷新本地状态
  useEffect(() => {
    if (!isSaving) {
      setLocalShowSentences(globalShowSentences);
      setLocalShowSentenceTranslation(globalShowSentenceTranslation);
    }
  }, [globalShowSentences, globalShowSentenceTranslation]);

  // 5. 事件处理器 (新)
  const handleShowSentencesChange = (newCheckedState: boolean) => {
    setLocalShowSentences(newCheckedState);
    // 联动：当关闭“显示例句”时，自动关闭“显示例句翻译”
    if (newCheckedState === false) {
      setLocalShowSentenceTranslation(false);
    }
  };

  // 6. 保存逻辑
  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      await apiUpdateSettings({
        showSentences: localShowSentences,
        showSentenceTranslation: localShowSentenceTranslation,
      });
      await refreshSettings();
      toast.success(tCommon('messages.operationSuccess'));
    } catch (error) {
      toast.error(tCommon('messages.operationFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SectionCard
      title={t('sectionTitles.content')}
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
      <ToggleItem
        label={t('labels.showSentences')}
        checked={localShowSentences}
        onChange={handleShowSentencesChange} // 使用新的处理器
        disabled={isSaving}
      />
      <ToggleItem
        label={t('labels.showSentenceTranslation')}
        checked={localShowSentenceTranslation}
        onChange={setLocalShowSentenceTranslation}
        disabled={isSaving || !localShowSentences} // 例句关闭时禁用此项
      />
    </SectionCard>
  );
};

export default ContentSettingsSection;