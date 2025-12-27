import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // For now, always use German. Later this can be made dynamic.
  const locale = 'de';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
