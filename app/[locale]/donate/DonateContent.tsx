/*
 * @Date: 2025-11-08 17:55:27
 * @LastEditTime: 2025-11-08 17:55:43
 * @Description:
 */
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, QrCode, CheckCircle, FileText, X } from 'lucide-react';

type QrCodeType = 'alipay' | 'wechat';

/** 单笔捐赠记录 */
interface DonationRecord {
  donor: string;
  amount: number;
}

/**
 * 捐赠人名称脱敏：多字只显示首尾、中间用 *；2 或 3 字只显示第一个
 */
function maskDonorName(name: string): string {
  if (!name || name.length === 0) return name;
  if (name.length === 1) return name;
  if (name.length <= 3) return name[0] + '*'.repeat(name.length - 1);
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

/** 捐款公示数据项 */
interface PublicityItem {
  period: string;
  totalDonation: number;
  operationCost: number;
  publicWelfareExpense: number;
  donations: DonationRecord[];
}

/**
 * 捐赠二维码组件属性接口
 */
interface DonationQrCodeProps {
  type: QrCodeType;
  titleKey: 'alipayTitle' | 'wechatTitle';
}

/**
 * 捐赠说明项组件属性接口
 */
interface DonationItemProps {
  textKey: 'item1' | 'item2' | 'item3' | 'item4';
}

/**
 * 捐赠二维码展示组件
 */
const DonationQrCode: React.FC<DonationQrCodeProps> = ({ type, titleKey }) => {
  const t = useTranslations('Donation.qrCode');
  const qrCodeUrl = {
    alipay: '/images/qrcode/alipay.png',
    wechat: '/images/qrcode/wechat.png',
  }[type];

  return (
    <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 w-full max-w-sm">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-1">
        <QrCode className="w-5 h-5" />
        {t(titleKey)}
      </h3>
      <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-3 overflow-hidden">
        <img
          src={qrCodeUrl}
          alt={`${t(titleKey)}捐赠二维码`}
          className="w-full h-full object-contain p-2"
          loading="lazy"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('scanHint')}
      </p>
    </div>
  );
};

/**
 * 捐赠说明项组件
 */
const DonationItem: React.FC<DonationItemProps> = ({ textKey }) => {
  const t = useTranslations('Donation.instructions');
  return (
    <div className="flex items-start gap-2 mb-1.5">
      <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 shrink-0" />
      <p className="text-sm text-gray-700 dark:text-gray-300">{t(textKey)}</p>
    </div>
  );
};

/**
 * 捐款公示数据列表（示例数据）
 */
const publicityData: PublicityItem[] = [
  {
    period: '2026年1月',
    totalDonation: 260.04,
    operationCost: 26.0,
    publicWelfareExpense: 234.04,
    donations: [
      { donor: '爱拼才会赢', amount: 100 },
      { donor: '单词君', amount: 88.88 },
      { donor: '匿名', amount: 50 },
      { donor: '背词小透明', amount: 21.16 },
    ],
  },
  {
    period: '2025年12月',
    totalDonation: 125.5,
    operationCost: 12.6,
    publicWelfareExpense: 112.9,
    donations: [
      { donor: '深夜学习者', amount: 66.0 },
      { donor: '匿名', amount: 30 },
      { donor: 'SpellMaster', amount: 29.5 },
    ],
  },
];

/**
 * 客户端交互主组件
 */
const DonationContent: React.FC<{ locale: string }> = ({ locale }) => {
  const t = useTranslations('Donation');
  const [showPublicity, setShowPublicity] = useState(false);

  return (
    <div className="w-full flex flex-col items-center flex-1">
      {/* 捐款公示弹窗 */}
      {showPublicity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('publicity.title')}
              </h3>
              <button
                onClick={() => setShowPublicity(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                aria-label={t('aria.closePublicity')}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {publicityData.length > 0 ? (
                <>
                  {publicityData.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                        {item.period}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t('publicity.totalDonation')}
                          </p>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            ¥{item.totalDonation.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t('publicity.operationCost')}
                          </p>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            ¥{item.operationCost.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t('publicity.publicWelfareExpense')}
                          </p>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            ¥{item.publicWelfareExpense.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {item.donations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('publicity.donationList')}
                          </p>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/80 text-left text-gray-600 dark:text-gray-400">
                                  <th className="px-3 py-2 font-medium">
                                    {t('publicity.donor')}
                                  </th>
                                  <th className="px-3 py-2 font-medium text-right">
                                    {t('publicity.amount')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {item.donations.map((d, i) => (
                                  <tr
                                    key={i}
                                    className="text-gray-700 dark:text-gray-300"
                                  >
                                    <td className="px-3 py-2">
                                      {maskDonorName(d.donor)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">
                                      ¥{d.amount.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('publicity.updateHint')}
                  </p>
                </>
              ) : (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('publicity.empty')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    {t('publicity.updateHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 页面主体内容 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Gift className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('main.title')}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('main.subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
          <p className="text-gray-700 dark:text-gray-300 text-base mb-4 leading-relaxed">
            {t('main.desc1')}
          </p>
          <p className="text-gray-900 dark:text-white text-base font-semibold mb-0 text-center">
            {t('main.desc2')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            {t('donateNow.title')}
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <DonationQrCode type="alipay" titleKey="alipayTitle" />
            <DonationQrCode type="wechat" titleKey="wechatTitle" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 max-w-xl mx-auto">
            {t('donateNow.hint')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('instructions.title')}
            </h2>
            <button
              onClick={() => setShowPublicity(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('aria.viewPublicity')}
            >
              <FileText className="w-5 h-5" />
              {t('instructions.viewPublicityBtn')}
            </button>
          </div>
          <div className="space-y-2 mx-auto">
            <DonationItem textKey="item1" />
            <DonationItem textKey="item2" />
            <DonationItem textKey="item3" />
            <DonationItem textKey="item4" />
          </div>
        </div>

        <div className="text-center mt-12 mb-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('footer.thankYou')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationContent;
