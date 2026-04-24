import { useState, useEffect } from 'react';

const useSettings = () => {
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'system',
    currency: localStorage.getItem('currency') || 'GBP',
    defaultView: localStorage.getItem('defaultView') || 'grid',
    defaultSort: localStorage.getItem('defaultSort') || 'created_at',
    itemsPerPage: localStorage.getItem('itemsPerPage') || '24',
    priceAlerts: localStorage.getItem('priceAlerts') === 'true',
    milestoneAlerts: localStorage.getItem('milestoneAlerts') === 'true'
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(key, value);

    // Apply theme immediately
    if (key === 'theme') {
      applyTheme(value);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const formatCurrency = (value) => {
    const currencyMap = {
      'GBP': { locale: 'en-GB', currency: 'GBP' },
      'USD': { locale: 'en-US', currency: 'USD' },
      'EUR': { locale: 'en-EU', currency: 'EUR' },
      'JPY': { locale: 'ja-JP', currency: 'JPY' },
      'CAD': { locale: 'en-CA', currency: 'CAD' },
      'AUD': { locale: 'en-AU', currency: 'AUD' }
    };

    const config = currencyMap[settings.currency] || currencyMap['GBP'];
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
    }).format(value || 0);
  };

  // Apply theme on initial load
  useEffect(() => {
    applyTheme(settings.theme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return {
    settings,
    updateSetting,
    formatCurrency
  };
};

export default useSettings;