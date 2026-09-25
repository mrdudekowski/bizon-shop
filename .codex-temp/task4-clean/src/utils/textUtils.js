/**
 * Утилиты для работы с текстом
 */

/**
 * Парсит строку с bullet points (разделенную символом •) в массив элементов
 * 
 * @param {string} text - Текст с bullet points, разделенными символом •
 * @returns {string[]} Массив очищенных строк
 * 
 * @example
 * parseBulletPoints("Для асфальта • Низкий расход • Высокая скорость")
 * // ["Для асфальта", "Низкий расход", "Высокая скорость"]
 */
export const parseBulletPoints = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  return text
    .split('•')
    .map((item) => item.trim())
    .filter(Boolean);
};
