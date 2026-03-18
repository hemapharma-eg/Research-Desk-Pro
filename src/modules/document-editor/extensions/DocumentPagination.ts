import { Document } from '@tiptap/extension-document';

export const DocumentPagination = Document.extend({
  addAttributes() {
    return {
      headerText: {
        default: '',
        parseHTML: element => element.getAttribute('data-header-text') || '',
        renderHTML: attributes => {
          if (!attributes.headerText) {
            return {};
          }
          return {
            'data-header-text': attributes.headerText,
          };
        },
      },
      footerText: {
        default: '',
        parseHTML: element => element.getAttribute('data-footer-text') || '',
        renderHTML: attributes => {
          if (!attributes.footerText) {
            return {};
          }
          return {
            'data-footer-text': attributes.footerText,
          };
        },
      },
      pageNumberPosition: {
        default: 'none', // 'none', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'
        parseHTML: element => element.getAttribute('data-page-number-position') || 'none',
        renderHTML: attributes => {
          if (attributes.pageNumberPosition === 'none') {
            return {};
          }
          return {
            'data-page-number-position': attributes.pageNumberPosition,
          };
        },
      },
    };
  },
});
