export { en } from './en';
export { ko } from './ko';
export { ja } from './ja';
export { zh } from './zh';
export { vi } from './vi';
export { th } from './th';
export { tl } from './tl';
export { id } from './id';

export const supportedLanguages = ['en', 'ko', 'ja', 'zh', 'vi', 'th', 'tl', 'id'];

export const languageNames: Record<string, string> = {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    zh: '中文',
    vi: 'Tiếng Việt',
    th: 'ไทย',
    tl: 'Filipino',
    id: 'Bahasa Indonesia',
};

export const languageFlags: Record<string, string> = {
    en: '🇺🇸',
    ko: '🇰🇷',
    ja: '🇯🇵',
    zh: '🇨🇳',
    vi: '🇻🇳',
    th: '🇹🇭',
    tl: '🇵🇭',
    id: '🇮🇩',
};
