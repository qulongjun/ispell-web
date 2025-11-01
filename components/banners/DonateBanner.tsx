/*
 * @Date: 2025-10-31 10:08:45
 * @LastEditTime: 2025-10-31 14:03:16
 * @Description: 
 */
import React from 'react';
import { Gift } from 'lucide-react';
import Link from 'next/link';

const DonateBanner: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <Gift className="w-4 h-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
          
          <p className="text-center text-sm text-gray-800 dark:text-gray-200">
            您的每一份支持，都在助力偏远学子用英语连接更广阔的世界。
          </p>
          
          <Link 
            href="/donate" 
            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 
                      transition-colors duration-200 flex items-center gap-1 underline underline-offset-2"
          >
            了解更多
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonateBanner;
    