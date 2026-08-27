import { DocumentSlot } from './entities/document-slot.entity';
import { sortSlotsByRequirementOrder } from './corrections.mapper';

function buildSlot(
  label: string,
  requirement: { order: number } | null,
): DocumentSlot {
  return {
    label,
    requirementId: requirement ? 1 : null,
    requirement,
  } as unknown as DocumentSlot;
}

describe('sortSlotsByRequirementOrder', () => {
  it('сортирует слоты по PackageRequirement.order независимо от порядка вставки', () => {
    const tkp = buildSlot('ХЗ-х ТКП', { order: 5 });
    const note = buildSlot('Согласованная служебная записка', { order: 1 });
    const mtrList = buildSlot('Перечень комплекта МТР (ХС)', { order: 3 });
    const main = buildSlot('Excel корректировка', null);
    const lsr = buildSlot('Локальный сметный расчёт (ПД)', { order: 4 });
    const pkg = buildSlot('Пакет обосновывающих документов', { order: 2 });

    // Порядок вставки в массив намеренно перемешан — не совпадает с order.
    const scrambled = [tkp, note, mtrList, main, lsr, pkg];

    const sorted = sortSlotsByRequirementOrder(scrambled).map((s) => s.label);

    expect(sorted).toEqual([
      'Excel корректировка',
      'Согласованная служебная записка',
      'Пакет обосновывающих документов',
      'Перечень комплекта МТР (ХС)',
      'Локальный сметный расчёт (ПД)',
      'ХЗ-х ТКП',
    ]);
  });

  it('не мутирует исходный массив', () => {
    const a = buildSlot('A', { order: 2 });
    const b = buildSlot('B', { order: 1 });
    const original = [a, b];

    sortSlotsByRequirementOrder(original);

    expect(original).toEqual([a, b]);
  });
});
