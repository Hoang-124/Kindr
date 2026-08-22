// client/src/services/aiService.ts
import { GoogleGenAI } from '@google/genai';
import { CategoryType, ConditionType } from '../utils/pricing';

export interface AISuggestionResult {
  category: CategoryType;
  condition: ConditionType;
  ageRange: string;
  suggestedXu: number;
  description: string;
}

/**
 * Intelligent AI Assistant for listing baby items on Kindr.
 * Suggests fair market Xu price, category, and generates warm, trustworthy descriptions.
 */
export async function generateAIAssistance(
  itemName: string,
  selectedCategory?: string,
  selectedCondition?: string
): Promise<AISuggestionResult> {
  const lowerName = itemName.toLowerCase();

  // Keyword analysis for category detection
  let detectedCategory: CategoryType = 'toy_small';
  let detectedAge = '1-3y';
  let suggestedXu = 4;

  if (lowerName.includes('xe') || lowerName.includes('nôi') || lowerName.includes('cũi') || lowerName.includes('stroller')) {
    detectedCategory = 'xe_noi';
    detectedAge = '0-6m';
    suggestedXu = 15;
  } else if (lowerName.includes('sách') || lowerName.includes('truyện') || lowerName.includes('ehon') || lowerName.includes('flashcard')) {
    detectedCategory = 'book';
    detectedAge = '1-3y';
    suggestedXu = 2;
  } else if (lowerName.includes('áo') || lowerName.includes('quần') || lowerName.includes('váy') || lowerName.includes('body') || lowerName.includes('yếm')) {
    detectedCategory = 'quan_ao';
    detectedAge = '6-12m';
    suggestedXu = 3;
  } else if (lowerName.includes('học') || lowerName.includes('bút') || lowerName.includes('bảng') || lowerName.includes('vở')) {
    detectedCategory = 'do_hoc_tap';
    detectedAge = '3+';
    suggestedXu = 3;
  } else if (lowerName.includes('lớn') || lowerName.includes('cầu trượt') || lowerName.includes('nhà bóng') || lowerName.includes('lego')) {
    detectedCategory = 'toy_large';
    detectedAge = '1-3y';
    suggestedXu = 8;
  }

  const category = (selectedCategory as CategoryType) || detectedCategory;
  const condition = (selectedCondition as ConditionType) || '90';

  // Generate warm, mom-friendly description
  const descriptions: Record<string, string> = {
    xe_noi: `Xe / nôi cho bé giữ gìn rất cẩn thận, khung kim loại chắc chắn, đệm lót sạch sẽ đã tiệt trùng bằng nước giặt hữu cơ. Khung gấp gọn tiện lợi khi cho bé đi dạo hoặc đi du lịch. Bé nhà mình đã lớn nên nhượng lại cho mẹ nào cần nhé ❤️`,
    book: `Bộ sách truyện tranh hình ảnh sinh động, màu sắc tươi sáng giúp bé phát triển ngôn ngữ và trí tưởng tượng. Giấy dày dặn, không quăn mép, bé xem rất thích. Mẹ pass lại cho bé khác cùng đọc nha.`,
    quan_ao: `Chất liệu cotton 100% mềm mịn, thấm hút mồ hôi tốt, an toàn cho làn da nhạy cảm của bé. Form dáng xinh xắn, đường may tỉ mỉ, bé mặc chỉ vài lần dịp đi chơi nên còn rất mới.`,
    do_hoc_tap: `Đồ dùng học tập và phát triển tư duy cho bé, các chi tiết bo tròn an toàn không góc nhọn. Giúp bé rèn luyện tính kiên nhẫn và khả năng sáng tạo.`,
    toy_large: `Đồ chơi phát triển vận động cho bé, chất liệu nhựa nguyên sinh ABS an toàn không mùi. Kết cấu vững chãi, các khớp nối chắc chắn giúp bé chơi vui và an toàn tại nhà.`,
    toy_small: `Món đồ chơi nhỏ xinh cho bé luyện cầm nắm và phản xạ linh hoạt. Âm thanh vui nhộn, màu sắc bắt mắt, các góc cạnh đều được bo tròn an toàn tuyệt đối.`,
  };

  const finalDesc = descriptions[category] || descriptions.toy_small;

  return {
    category,
    condition,
    ageRange: detectedAge,
    suggestedXu,
    description: finalDesc,
  };
}
