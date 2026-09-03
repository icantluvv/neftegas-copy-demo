/**
 * Статичный каталог направлений и форм факт-пакета (не таблица в БД — набор
 * форм и деление ХС/ПД фиксированы бизнес-правилами ЧТЗ, см.
 * openspec/changes/fact-package-review/design.md, раздел «Каталог форм»).
 */

export enum Direction {
  DO = 'DO',
  TOIR = 'TOIR',
  KR_PD = 'KR_PD',
  KR_HS = 'KR_HS',
}

export enum FactFormCode {
  ACT_WORK = 'ACT_WORK',
  ACT_SERVICE = 'ACT_SERVICE',
  KS2 = 'KS2',
  KS3 = 'KS3',
  ACT_MATERIALS = 'ACT_MATERIALS',
  INVOICE = 'INVOICE',
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
}

export const FORM_LABELS: Record<FactFormCode, string> = {
  [FactFormCode.ACT_WORK]: 'Акт выполнения работ',
  [FactFormCode.ACT_SERVICE]: 'Акт выполнения услуги',
  [FactFormCode.KS2]: 'Форма КС-2',
  [FactFormCode.KS3]: 'Форма КС-3',
  [FactFormCode.ACT_MATERIALS]: 'Акт вовлечённости материалов',
  [FactFormCode.INVOICE]: 'Счёт на оплату',
  [FactFormCode.PAYMENT_REQUEST]: 'Заявка на платёж',
};

const ALL_FORM_CODES: FactFormCode[] = [
  FactFormCode.ACT_WORK,
  FactFormCode.ACT_SERVICE,
  FactFormCode.KS2,
  FactFormCode.KS3,
  FactFormCode.ACT_MATERIALS,
  FactFormCode.INVOICE,
  FactFormCode.PAYMENT_REQUEST,
];

/** КР ХС — хозяйственный способ, без подрядчика: нет форм приёмки у подрядчика. */
const KR_HS_FORM_CODES: FactFormCode[] = [
  FactFormCode.ACT_WORK,
  FactFormCode.ACT_MATERIALS,
  FactFormCode.INVOICE,
  FactFormCode.PAYMENT_REQUEST,
];

export const DIRECTION_FORM_CODES: Record<Direction, FactFormCode[]> = {
  [Direction.DO]: ALL_FORM_CODES,
  [Direction.TOIR]: ALL_FORM_CODES,
  [Direction.KR_PD]: ALL_FORM_CODES,
  [Direction.KR_HS]: KR_HS_FORM_CODES,
};
