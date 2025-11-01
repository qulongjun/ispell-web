/*
 * @Description: 学习计划设置视图 (子组件 - 支持创建/更新，已国际化)
 * @Date: 2025-10-29 19:40:00
 * @LastEditTime: 2025-11-01 15:31:07
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl'; // 导入国际化Hook
import toast from 'react-hot-toast';
import type { Book, PlanDetails } from '@/types/book.types';

/** 预设的计划天数 */
const PRESET_DAYS = [15, 30, 45, 60, 75, 90];

/** 复习策略ID定义（与翻译键对应） */
type ReviewStrategyId = 'NONE' | 'EBBINGHAUS' | 'SM2' | 'LEITNER';

/** 复习策略配置（仅保留ID，文本通过国际化获取） */
const REVIEW_STRATEGIES: Array<{ id: ReviewStrategyId; recommended: boolean }> =
  [
    { id: 'NONE', recommended: false },
    { id: 'EBBINGHAUS', recommended: true },
    { id: 'SM2', recommended: false },
    { id: 'LEITNER', recommended: false },
  ];

/** 计划设置视图的 Props */
interface PlanSetupViewProps {
  book: Book;
  onStart: (plan: PlanDetails) => void; // 创建或更新计划
  onCancel: () => void;
  initialPlan?: PlanDetails | null; // 传入已有的计划 (用于编辑)
}

const PlanSetupView: React.FC<PlanSetupViewProps> = ({
  book,
  onStart,
  onCancel,
  initialPlan = null, // 默认值为 null
}) => {
  // 国际化翻译Hook：指向 BookSelection 命名空间（PlanSetupView 嵌套其中）
  const t = useTranslations('BookSelection');

  // --- 状态 ---
  const [planType, setPlanType] = useState<
    'preset' | 'customDays' | 'customWords'
  >(initialPlan?.type || 'preset');
  const [presetDays, setPresetDays] = useState<number>(
    initialPlan?.type === 'preset' ? initialPlan.value : 60 // 优先用 initialPlan 或默认 60
  );
  const [customDays, setCustomDays] = useState<string>(
    initialPlan?.type === 'customDays' ? initialPlan.value.toString() : ''
  );
  const [customWords, setCustomWords] = useState<string>(
    initialPlan?.type === 'customWords' ? initialPlan.value.toString() : ''
  );
  const [reviewStrategy, setReviewStrategy] = useState<ReviewStrategyId>(
    (initialPlan?.reviewStrategy as ReviewStrategyId) || 'EBBINGHAUS' // 优先用 initialPlan 或默认艾宾浩斯
  );
  const [learningOrder, setLearningOrder] = useState<'SEQUENTIAL' | 'RANDOM'>(
    initialPlan?.learningOrder || 'SEQUENTIAL' // 优先用 initialPlan 或默认顺序
  );

  // 区分是创建还是更新模式
  const isEditing = !!initialPlan;

  // --- Effect: 当 initialPlan 变化时，重置表单状态 ---
  useEffect(() => {
    if (initialPlan) {
      setPlanType(initialPlan.type);
      setReviewStrategy(initialPlan.reviewStrategy as ReviewStrategyId);
      setLearningOrder(initialPlan.learningOrder);
      if (initialPlan.type === 'preset') {
        setPresetDays(initialPlan.value);
        setCustomDays('');
        setCustomWords('');
      } else if (initialPlan.type === 'customDays') {
        setCustomDays(initialPlan.value.toString());
        setPresetDays(60); // 重置预设为默认
        setCustomWords('');
      } else {
        // customWords
        setCustomWords(initialPlan.value.toString());
        setPresetDays(60);
        setCustomDays('');
      }
    } else {
      // 如果没有 initialPlan (例如从编辑切换到创建)，重置为默认值
      setPlanType('preset');
      setPresetDays(60);
      setCustomDays('');
      setCustomWords('');
      setReviewStrategy('EBBINGHAUS');
      setLearningOrder('SEQUENTIAL');
    }
  }, [initialPlan]); // 依赖 initialPlan

  // --- 处理自定义数字输入 ---
  const handleNumericChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    if (value === '') {
      setter('');
      return;
    }
    const num = parseInt(value, 10);
    // 检查是否是正整数
    if (!isNaN(num) && num > 0) {
      setter(num.toString());
    } else if (value === '0') {
      // 不允许输入0
    }
    // 忽略其他无效输入 (如 'e', '-', '.')
  };

  // --- 派生值计算 ---
  let wordsPerDay: number = 0;
  let totalDays: number = 0;
  if (planType === 'preset' && presetDays > 0)
    wordsPerDay = Math.ceil(book.totalWords / presetDays);
  else if (planType === 'customDays' && Number(customDays) > 0)
    wordsPerDay = Math.ceil(book.totalWords / Number(customDays));
  else if (planType === 'customWords' && Number(customWords) > 0)
    totalDays = Math.ceil(book.totalWords / Number(customWords));

  // --- “保存/更新”按钮点击 ---
  const handleConfirmClick = () => {
    let planBase: Omit<PlanDetails, 'reviewStrategy' | 'learningOrder'>;

    if (planType === 'preset') {
      planBase = { type: 'preset', value: presetDays };
    } else if (planType === 'customDays') {
      // 最终验证，防止空值或无效值提交
      const daysNum = Number(customDays);
      if (isNaN(daysNum) || daysNum <= 0) {
        toast.error(t('PlanSetupView.errors.invalidCustomDays')); // 国际化错误提示
        return;
      }
      planBase = { type: 'customDays', value: daysNum };
    } else {
      // customWords
      // 最终验证，防止空值或无效值提交
      const wordsNum = Number(customWords);
      if (isNaN(wordsNum) || wordsNum <= 0) {
        toast.error(t('PlanSetupView.errors.invalidCustomWords')); // 国际化错误提示
        return;
      }
      planBase = { type: 'customWords', value: wordsNum };
    }

    // 断言以添加 learningOrder 和 reviewStrategy
    const plan: PlanDetails = {
      ...(planBase as Omit<PlanDetails, 'reviewStrategy' | 'learningOrder'>), // 断言
      reviewStrategy: reviewStrategy as PlanDetails['reviewStrategy'], // 断言类型
      learningOrder: learningOrder,
    };

    onStart(plan); // 调用传入的回调 (可能是创建或更新)
  };

  // 获取当前选中的复习策略描述（国际化）
  const currentStrategyDescription = t(
    `PlanSetupView.reviewStrategies.${reviewStrategy}.description`
  );

  return (
    <div
      className={`flex flex-col p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900`}
    >
      {/* 动态标题（国际化：创建/修改） */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {isEditing
          ? t('PlanSetupView.titles.editPlan', { bookName: book.name })
          : t('PlanSetupView.titles.createPlan', { bookName: book.name })}
      </h3>

      {/* 预设计划（通用计划） */}
      <section>
        <h4 className="text-base font-semibold text-gray-600 dark:text-gray-300 mb-3">
          {t('PlanSetupView.sectionTitles.generalPlan')}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_DAYS.map((days) => (
            <button
              key={days}
              onClick={() => {
                setPlanType('preset');
                setPresetDays(days);
              }}
              className={`
                p-3 rounded-lg border-2 text-center transition-colors
                ${
                  planType === 'preset' && presetDays === days
                    ? 'bg-gray-200 border-gray-400 dark:bg-gray-700 dark:border-gray-500' // 激活
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500' // 默认
                }
              `}
            >
              <p className="font-medium text-gray-900 dark:text-white">
                {`${days} ${t('PlanSetupView.presetPlan.dayUnit')}`}{' '}
                {/* 国际化天数单位 */}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {days > 0
                  ? t('PlanSetupView.presetPlan.wordsPerDay', {
                      count: Math.ceil(book.totalWords / days),
                    })
                  : '-'}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 自定义计划 */}
      <section className="mt-6">
        <h4 className="text-base font-semibold text-gray-600 dark:text-gray-300 mb-3">
          {t('PlanSetupView.sectionTitles.customPlan')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 自定义天数 */}
          <div
            onClick={() => setPlanType('customDays')}
            className="p-3 rounded-lg border dark:border-gray-700 cursor-pointer bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="planType"
                  readOnly
                  checked={planType === 'customDays'}
                  className="form-radio text-gray-900 dark:text-gray-100"
                />
                <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">
                  {t('PlanSetupView.customPlan.customDays')}
                </span>
              </label>
              <input
                type="number"
                value={customDays}
                onChange={(e) =>
                  handleNumericChange(setCustomDays, e.target.value)
                }
                onFocus={() => setPlanType('customDays')}
                disabled={planType !== 'customDays'}
                className="w-28 text-center p-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
                placeholder={t('PlanSetupView.placeholders.days')} // 国际化占位符
                min="1"
              />
            </div>
            {planType === 'customDays' &&
              wordsPerDay > 0 &&
              Number.isFinite(wordsPerDay) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('PlanSetupView.customPlan.wordsPerDay', {
                    count: wordsPerDay,
                  })}{' '}
                </p>
              )}
          </div>
          {/* 自定义单词 */}
          <div
            onClick={() => setPlanType('customWords')}
            className="p-3 rounded-lg border dark:border-gray-700 cursor-pointer bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="planType"
                  readOnly
                  checked={planType === 'customWords'}
                  className="form-radio text-gray-900 dark:text-gray-100"
                />
                <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">
                  {t('PlanSetupView.customPlan.dailyWords')}
                </span>
              </label>
              <input
                type="number"
                value={customWords}
                onChange={(e) =>
                  handleNumericChange(setCustomWords, e.target.value)
                }
                onFocus={() => setPlanType('customWords')}
                disabled={planType !== 'customWords'}
                className="w-28 text-center p-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
                placeholder={t('PlanSetupView.placeholders.words')} // 国际化占位符
                min="1"
              />
            </div>
            {planType === 'customWords' &&
              totalDays > 0 &&
              Number.isFinite(totalDays) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('PlanSetupView.customPlan.totalDays', {
                    count: totalDays,
                  })}{' '}
                </p>
              )}
          </div>
        </div>
      </section>

      {/* 学习顺序 */}
      <section className="mt-6">
        <h4 className="text-base font-semibold text-gray-600 dark:text-gray-300 mb-3">
          {t('PlanSetupView.sectionTitles.learningOrder')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLearningOrder('SEQUENTIAL')}
            className={`p-3 rounded-lg border-2 text-center transition-colors ${
              learningOrder === 'SEQUENTIAL'
                ? 'bg-gray-200 border-gray-400 dark:bg-gray-700 dark:border-gray-500'
                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <p className="font-medium text-gray-900 dark:text-white">
              {t('PlanSetupView.learningOrder.sequential.name')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('PlanSetupView.learningOrder.sequential.desc')}
            </p>
          </button>
          <button
            onClick={() => setLearningOrder('RANDOM')}
            className={`p-3 rounded-lg border-2 text-center transition-colors ${
              learningOrder === 'RANDOM'
                ? 'bg-gray-200 border-gray-400 dark:bg-gray-700 dark:border-gray-500'
                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <p className="font-medium text-gray-900 dark:text-white">
              {t('PlanSetupView.learningOrder.random.name')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('PlanSetupView.learningOrder.random.desc')}
            </p>
          </button>
        </div>
      </section>

      {/* 复习策略 */}
      <section className="mt-6 space-y-3">
        <div className="flex items-center space-x-2">
          <label
            htmlFor="reviewStrategy"
            className="text-base font-semibold text-gray-600 dark:text-gray-300"
          >
            {t('PlanSetupView.sectionTitles.reviewStrategy')}
          </label>
        </div>
        <select
          id="reviewStrategy"
          value={reviewStrategy}
          onChange={(e) =>
            setReviewStrategy(e.target.value as ReviewStrategyId)
          }
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {REVIEW_STRATEGIES.map((strategy) => (
            <option key={strategy.id} value={strategy.id}>
              {strategy.recommended
                ? `${t(
                    `PlanSetupView.reviewStrategies.${strategy.id}.name`
                  )} (${t('PlanSetupView.reviewStrategies.recommended')})`
                : t(`PlanSetupView.reviewStrategies.${strategy.id}.name`)}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {currentStrategyDescription}
        </p>
      </section>

      {/* 操作按钮 */}
      <div className="pt-8 flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {t('PlanSetupView.buttons.cancel')}
        </button>
        {/* 动态按钮文本（国际化：创建/更新） */}
        <button
          onClick={handleConfirmClick}
          className="flex-1 py-3 rounded-lg bg-gray-900 text-white dark:bg-gray-200 dark:text-gray-900 font-medium transition-colors hover:bg-gray-700 dark:hover:bg-white"
        >
          {isEditing
            ? t('PlanSetupView.buttons.updatePlan')
            : t('PlanSetupView.buttons.createPlan')}
        </button>
      </div>
    </div>
  );
};

export default PlanSetupView;
