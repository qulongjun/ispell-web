'use client';
/*
 * @Date: 2025-10-31 10:21:20
 * @LastEditTime: 2025-11-07 23:53:28
 * @Description: 捐赠页面 (已优化布局并添加公示空状态)
 */
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, QrCode, CheckCircle, FileText, X, ZoomIn } from 'lucide-react';

// 二维码类型定义 (不变)
type QrCodeType = 'alipay' | 'wechat';

// 公示数据类型 (不变)
interface PublicityItem {
  period: string;
  totalDonation: number;
  operationCost: number;
  publicWelfareExpense: number;
  certificateUrl: string; // 捐款证书图片地址
}

// 二维码组件属性 (不变)
interface DonationQrCodeProps {
  type: QrCodeType;
  titleKey: 'alipayTitle' | 'wechatTitle';
}

// 捐赠说明项属性 (不变)
interface DonationItemProps {
  textKey: 'item1' | 'item2' | 'item3' | 'item4';
}

// 二维码组件 (不变)
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

// 捐赠说明项组件 (不变)
const DonationItem: React.FC<DonationItemProps> = ({ textKey }) => {
  const t = useTranslations('Donation.instructions');
  return (
    <div className="flex items-start gap-2 mb-1.5">
      <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-gray-700 dark:text-gray-300">{t(textKey)}</p>
    </div>
  );
};

// 捐款公示数据 (来自您提供的最新文件)
const publicityData: PublicityItem[] = [
  // {
  //   period: '2025年10月',
  //   totalDonation: 12860.5,
  //   operationCost: 860.5,
  //   publicWelfareExpense: 12000.0,
  //   certificateUrl: 'https://picsum.photos/seed/cert10/800/600',
  // },
  // {
  //   period: '2025年9月',
  //   totalDonation: 9542.3,
  //   operationCost: 742.3,
  //   publicWelfareExpense: 8800.0,
  //   certificateUrl: 'https://picsum.photos/seed/cert9/800/600',
  // },
];

const DonationPage: React.FC = () => {
  const t = useTranslations('Donation');
  const [showPublicity, setShowPublicity] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(
    null
  );

  // 打开证书大图查看 (不变)
  const openCertificate = (url: string) => {
    setSelectedCertificate(url);
  };

  // 关闭证书查看 (不变)
  const closeCertificate = () => {
    setSelectedCertificate(null);
  };

  return (
    <div className="w-full flex flex-col items-center flex-1">
      {/* 证书大图查看器 (不变) */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={closeCertificate}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={closeCertificate}
              className="absolute -top-10 right-0 p-1 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
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

      {/* 捐款公示弹窗 (不变) */}
      {showPublicity && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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

            {/* [!! 关键修改 !!] 添加空状态逻辑 */}
            <div className="p-6 space-y-6">
              {publicityData.length > 0 ? (
                <>
                  {/* 遍历数据 */}
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
                  {/* 更新提示 (仅当有数据时显示) */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('publicity.updateHint')}
                  </p>
                </>
              ) : (
                <>
                  {/* 空状态提示 */}
                  <div className="text-center py-10 px-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('publicity.empty')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                      {t('publicity.updateHint')}
                    </p>
                  </div>
                </>
              )}
            </div>
            {/* [!! 移除 !!] 旧的 updateHint p 标签 */}
          </div>
        </div>
      )}

      {/* 主体内容 (不变) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* 标题区域 (不变) */}
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

        {/* 核心文案区域 (不变) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8">
          <p className="text-gray-700 dark:text-gray-300 text-base mb-4 leading-relaxed">
            {t('main.desc1')}
          </p>
          <p className="text-gray-900 dark:text-white text-base font-semibold mb-0 text-center">
            {t('main.desc2')}
          </p>
        </div>

        {/* 立即捐赠区域 (不变) */}
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

        {/* 捐赠说明+公示按钮区域 (不变) */}
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

        {/* 页脚感谢语 (不变) */}
        <div className="text-center mt-12 mb-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('footer.thankYou')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;