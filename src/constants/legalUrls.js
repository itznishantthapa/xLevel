export const LEGAL_DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    url: 'https://level.com.np/terms',
  },
  privacy: {
    title: 'Privacy Policy',
    url: 'https://level.com.np/privacy',
  },
};

export const getLegalDocument = (type) => LEGAL_DOCUMENTS[type] ?? null;
