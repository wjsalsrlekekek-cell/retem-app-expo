/**
 * Google Cloud Translation API를 사용한 실시간 번역 유틸리티
 * - 채팅 메시지, 상품 제목/설명, 게시글, 리뷰 등 모든 텍스트 번역
 * - 인메모리 캐시로 중복 API 호출 방지
 */

// Firebase 프로젝트의 API 키 (Cloud Translation API 활성화 필요)
const GOOGLE_API_KEY = 'AIzaSyBOgeUYyl0-RSCz5IDFSky4RUWvgYMzOuM';
const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

// ────────────────────────────────────────────────
// 언어 코드 매핑
// ────────────────────────────────────────────────

const LANG_CODES: Record<string, string> = {
  ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN',
  vi: 'vi', th: 'th', tl: 'tl', id: 'id', uz: 'uz',
};

/** Language display names for the translation banner */
export const LANG_DISPLAY_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
  vi: 'Tiếng Việt', th: 'ไทย', tl: 'Filipino', id: 'Bahasa Indonesia', uz: "O'zbek",
};

/** Language name in each language for the "Translated from" banner */
export const langLabels: Record<string, Record<string, string>> = {
  en: { en: 'English', ko: '영어', ja: '英語', zh: '英语', vi: 'tiếng Anh', th: 'อังกฤษ', tl: 'Ingles', id: 'Inggris', uz: 'Ingliz tili' },
  ko: { en: 'Korean', ko: '한국어', ja: '韓国語', zh: '韩语', vi: 'tiếng Hàn', th: 'เกาหลี', tl: 'Korean', id: 'Korea', uz: 'Koreys tili' },
  ja: { en: 'Japanese', ko: '일본어', ja: '日本語', zh: '日语', vi: 'tiếng Nhật', th: 'ญี่ปุ่น', tl: 'Japanese', id: 'Jepang', uz: 'Yapon tili' },
  zh: { en: 'Chinese', ko: '중국어', ja: '中国語', zh: '中文', vi: 'tiếng Trung', th: 'จีน', tl: 'Chinese', id: 'Mandarin', uz: 'Xitoy tili' },
  vi: { en: 'Vietnamese', ko: '베트남어', ja: 'ベトナム語', zh: '越南语', vi: 'tiếng Việt', th: 'เวียดนาม', tl: 'Vietnamese', id: 'Vietnam', uz: 'Vyetnam tili' },
  th: { en: 'Thai', ko: '태국어', ja: 'タイ語', zh: '泰语', vi: 'tiếng Thái', th: 'ไทย', tl: 'Thai', id: 'Thailand', uz: 'Tay tili' },
  tl: { en: 'Filipino', ko: '필리핀어', ja: 'フィリピン語', zh: '菲律宾语', vi: 'tiếng Filipino', th: 'ฟิลิปปินส์', tl: 'Filipino', id: 'Filipina', uz: 'Filippin tili' },
  id: { en: 'Indonesian', ko: '인도네시아어', ja: 'インドネシア語', zh: '印尼语', vi: 'tiếng Indonesia', th: 'อินโดนีเซีย', tl: 'Indonesian', id: 'Indonesia', uz: 'Indonez tili' },
};

// ────────────────────────────────────────────────
// 인메모리 캐시
// ────────────────────────────────────────────────

const translationCache = new Map<string, string>();

function cacheKey(text: string, target: string): string {
  return `${target}|${text}`;
}

// ────────────────────────────────────────────────
// Google Cloud Translation API 호출
// ────────────────────────────────────────────────

/**
 * Google Cloud Translation API로 텍스트를 번역합니다.
 * - 소스 언어 자동 감지
 * - 캐시 적용
 * - 에러 시 원문 반환
 */
async function googleTranslate(text: string, targetLang: string): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  const target = LANG_CODES[targetLang] || targetLang;
  const key = cacheKey(text, target);

  if (translationCache.has(key)) {
    return translationCache.get(key)!;
  }

  try {
    const res = await fetch(`${TRANSLATE_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target,
        format: 'text',
      }),
    });

    if (!res.ok) {
      console.warn('Translation API error:', res.status);
      return text;
    }

    const data = await res.json();
    const translated = data?.data?.translations?.[0]?.translatedText;

    if (translated && translated !== text) {
      // HTML 엔티티 디코딩 (Google API가 HTML 엔티티로 반환하는 경우)
      const decoded = decodeHtmlEntities(translated);
      translationCache.set(key, decoded);
      return decoded;
    }

    return text;
  } catch (error) {
    console.warn('Translation failed:', error);
    return text;
  }
}

/**
 * 여러 텍스트를 한 번에 번역합니다 (배치 번역).
 * Google Translation API는 배열을 지원하여 API 호출을 절약합니다.
 */
async function googleTranslateBatch(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (texts.length === 0) return [];

  const target = LANG_CODES[targetLang] || targetLang;

  // 캐시에 있는 것과 없는 것 분리
  const results: string[] = new Array(texts.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = cacheKey(texts[i], target);
    if (translationCache.has(key)) {
      results[i] = translationCache.get(key)!;
    } else if (!texts[i] || texts[i].trim().length === 0) {
      results[i] = texts[i];
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
    }
  }

  if (uncachedTexts.length === 0) return results;

  try {
    const res = await fetch(`${TRANSLATE_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: uncachedTexts,
        target,
        format: 'text',
      }),
    });

    if (!res.ok) {
      // 실패 시 원문 반환
      for (const idx of uncachedIndices) {
        results[idx] = texts[idx];
      }
      return results;
    }

    const data = await res.json();
    const translations = data?.data?.translations ?? [];

    for (let j = 0; j < uncachedIndices.length; j++) {
      const idx = uncachedIndices[j];
      const translated = translations[j]?.translatedText;
      if (translated) {
        const decoded = decodeHtmlEntities(translated);
        translationCache.set(cacheKey(texts[idx], target), decoded);
        results[idx] = decoded;
      } else {
        results[idx] = texts[idx];
      }
    }

    return results;
  } catch {
    for (const idx of uncachedIndices) {
      results[idx] = texts[idx];
    }
    return results;
  }
}

// HTML 엔티티 디코딩
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ────────────────────────────────────────────────
// Public API — 상품/게시글/리뷰/댓글 번역
// ────────────────────────────────────────────────

/**
 * 상품 제목과 설명을 번역합니다.
 * 원본 언어와 같으면 null을 반환합니다.
 */
export async function translateProduct(
  _productId: string,
  lang: string,
  title: string,
  description: string
): Promise<{ title: string; description: string } | null> {
  if (lang === 'en') return null; // 영어가 기본 언어라고 가정

  const [translatedTitle, translatedDesc] = await googleTranslateBatch(
    [title, description],
    lang
  );

  // 번역 결과가 원본과 같으면 null
  if (translatedTitle === title && translatedDesc === description) return null;

  return { title: translatedTitle, description: translatedDesc };
}

/**
 * 게시글 내용을 번역합니다.
 */
export async function translatePost(_postId: string, lang: string, content: string): Promise<string | null> {
  if (lang === 'en') return null;
  const translated = await googleTranslate(content, lang);
  return translated !== content ? translated : null;
}

/**
 * 댓글 내용을 번역합니다.
 */
export async function translateComment(_commentId: string, lang: string, content: string): Promise<string | null> {
  if (lang === 'en') return null;
  const translated = await googleTranslate(content, lang);
  return translated !== content ? translated : null;
}

/**
 * 리뷰 내용을 번역합니다.
 */
export async function translateReview(_reviewId: string, lang: string, comment: string): Promise<string | null> {
  if (lang === 'en') return null;
  const translated = await googleTranslate(comment, lang);
  return translated !== comment ? translated : null;
}

/**
 * 범용 텍스트 번역 함수
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  return googleTranslate(text, targetLang);
}

// ────────────────────────────────────────────────
// Chat Translation
// ────────────────────────────────────────────────

/**
 * 채팅 메시지를 번역합니다 (Google Cloud Translation).
 * - 소스 언어는 Google API가 자동 감지
 * - fromLang 파라미터는 같은 언어 체크용으로만 사용
 */
export async function translateChatMessage(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  // 같은 언어면 번역 불필요
  const from = LANG_CODES[fromLang] || fromLang;
  const to = LANG_CODES[toLang] || toLang;
  if (from === to) return text;

  return googleTranslate(text, toLang);
}

/**
 * Check if two language codes are different (translation needed)
 */
export function chatNeedsTranslation(senderLang: string, myLang: string): boolean {
  return senderLang !== myLang;
}
