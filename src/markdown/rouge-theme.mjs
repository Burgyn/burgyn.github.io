// Shiki theme mirroring the colours the Jekyll site got from Rouge + assets/css/main.css.
const keyword = '#62cde3';
const string = '#e6db74';
const method = '#00bf63';
const type = '#bed5e5';
const punctuation = '#9fb2bf';

export default {
  name: 'burgyn-rouge',
  type: 'dark',
  colors: { 'editor.background': '#00000000', 'editor.foreground': '#ffffffcf' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#999999' } },
    { scope: ['keyword', 'storage', 'keyword.control', 'keyword.other', 'constant.language'], settings: { foreground: keyword } },
    { scope: ['keyword.type', 'storage.type', 'support.type', 'entity.name.type'], settings: { foreground: type } },
    { scope: ['keyword.operator'], settings: { foreground: punctuation } },
    { scope: ['string', 'punctuation.definition.string'], settings: { foreground: string } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: method } },
    { scope: ['punctuation'], settings: { foreground: punctuation } },
    { scope: ['constant.numeric'], settings: { foreground: '#ff6600' } },
    { scope: ['entity.name.namespace'], settings: { foreground: '#00ccff' } },
    { scope: ['entity.name.tag'], settings: { foreground: '#2f6f9f' } },
    { scope: ['entity.other.attribute-name', 'support.type.property-name'], settings: { foreground: '#4f9fcf' } },
    { scope: ['markup.inserted'], settings: { foreground: '#00bf63' } },
    { scope: ['markup.deleted'], settings: { foreground: '#ff6666' } },
  ],
};
