import {
  DIRECTION_FORM_CODES,
  Direction,
  FactFormCode,
} from './fact-form-catalog';

describe('DIRECTION_FORM_CODES', () => {
  it('КР ХС — ровно 4 формы, без форм приёмки у подрядчика', () => {
    const codes = DIRECTION_FORM_CODES[Direction.KR_HS];

    expect(codes).toHaveLength(4);
    expect(codes).toEqual(
      expect.arrayContaining([
        FactFormCode.ACT_WORK,
        FactFormCode.ACT_MATERIALS,
        FactFormCode.INVOICE,
        FactFormCode.PAYMENT_REQUEST,
      ]),
    );
    expect(codes).not.toContain(FactFormCode.ACT_SERVICE);
    expect(codes).not.toContain(FactFormCode.KS2);
    expect(codes).not.toContain(FactFormCode.KS3);
  });

  it.each([Direction.DO, Direction.TOIR, Direction.KR_PD])(
    '%s — все 7 форм каталога',
    (direction) => {
      expect(DIRECTION_FORM_CODES[direction]).toHaveLength(7);
    },
  );
});
