'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, QrCode, CheckCircle, FileText, X, ZoomIn } from 'lucide-react';

// 二维码类型定义
type QrCodeType = 'alipay' | 'wechat';

// 公示数据类型（包含证书图片）
interface PublicityItem {
  period: string;
  totalDonation: number;
  operationCost: number;
  publicWelfareExpense: number;
  certificateUrl: string; // 捐款证书图片地址
}

// 二维码组件属性
interface DonationQrCodeProps {
  type: QrCodeType;
  titleKey: 'alipayTitle' | 'wechatTitle';
}

// 捐赠说明项属性（使用独立键名）
interface DonationItemProps {
  textKey: 'item1' | 'item2' | 'item3' | 'item4';
}

// 二维码组件
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
      <div className="w-56 h-56 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-3 overflow-hidden">
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

// 捐赠说明项组件
const DonationItem: React.FC<DonationItemProps> = ({ textKey }) => {
  const t = useTranslations('Donation.instructions');
  return (
    <div className="flex items-start gap-2 mb-1.5">
      <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-gray-700 dark:text-gray-300">{t(textKey)}</p>
    </div>
  );
};

// 捐款公示数据（包含证书图片）
const publicityData: PublicityItem[] = [
  {
    period: '2025年10月',
    totalDonation: 12860.5,
    operationCost: 860.5,
    publicWelfareExpense: 12000.0,
    certificateUrl: 'https://picsum.photos/seed/cert10/800/600',
  },
  {
    period: '2025年9月',
    totalDonation: 9542.3,
    operationCost: 742.3,
    publicWelfareExpense: 8800.0,
    certificateUrl: 'https://picsum.photos/seed/cert9/800/600',
  },
];

const DonationPage: React.FC = () => {
  const t = useTranslations('Donation');
  const [showPublicity, setShowPublicity] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(
    null
  );

  // 打开证书大图查看
  const openCertificate = (url: string) => {
    setSelectedCertificate(url);
  };

  // 关闭证书查看
  const closeCertificate = () => {
    setSelectedCertificate(null);
  };

  return (
    <div className="w-full flex flex-col items-center flex-1">
      {/* 固定底部的感谢语 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('footer.thankYou')}
          </p>
        </div>
      </div>

      {/* 证书大图查看器 */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={closeCertificate}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={closeCertificate}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label={t('aria.closeCertificate')}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedCertificate}
              alt={t('certificate.altText')}
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

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
              {publicityData.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                    {item.period}
                  </h4>

                  {/* 收支数据 */}
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

                  {/* 捐款证书 */}
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {t('publicity.certificateLabel')}
                    </p>
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => openCertificate(item.certificateUrl)}
                    >
                      <div className="bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <img
                          src={item.certificateUrl}
                          alt={`${item.period}${t(
                            'publicity.certificateLabel'
                          )}`}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      {/* 悬停显示放大图标 */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                        {t('publicity.viewFullCert')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('publicity.updateHint')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主体内容 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Gift className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('main.title')}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('main.subtitle')}
          </p>
        </div>

        {/* 核心文案区域 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
          <p className="text-gray-700 dark:text-gray-300 text-base mb-4 leading-relaxed">
            {t('main.desc1')}
          </p>
          <p className="text-gray-900 dark:text-white text-base font-semibold mb-0 text-center">
            {t('main.desc2')}
          </p>
        </div>

        {/* 立即捐赠区域 */}
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

        {/* 捐赠说明+公示按钮区域 */}
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
          <div className="space-y-2 max-w-2xl mx-auto">
            <DonationItem textKey="item1" />
            <DonationItem textKey="item2" />
            <DonationItem textKey="item3" />
            <DonationItem textKey="item4" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DonationPage;
