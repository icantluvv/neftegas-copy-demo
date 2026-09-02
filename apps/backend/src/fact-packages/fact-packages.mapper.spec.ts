import { FactFormCode, Direction } from './fact-form-catalog';
import { FactForm } from './entities/fact-form.entity';
import { FactPackage, FactPackageStatus } from './entities/fact-package.entity';
import { FactPackageRemark } from './entities/fact-package-remark.entity';
import {
  toFactFormDto,
  toFactPackageBaseDto,
  toFactPackageListItemDto,
  toRemarkDto,
  sortVersionsAscending,
} from './fact-packages.mapper';

function buildVersion(versionNumber: number) {
  return {
    id: versionNumber,
    formId: 1,
    versionNumber,
    fileName: `file-v${versionNumber}.pdf`,
    fileSize: 100,
    mimeType: 'application/pdf',
    uploadedById: 1,
    uploadedAt: new Date(),
    remarkId: null,
    note: '',
  } as unknown as FactForm['versions'][number];
}

describe('sortVersionsAscending', () => {
  it('сортирует версии по возрастанию versionNumber независимо от порядка вставки', () => {
    const scrambled = [buildVersion(3), buildVersion(1), buildVersion(2)];

    const sorted = sortVersionsAscending(scrambled).map((v) => v.versionNumber);

    expect(sorted).toEqual([1, 2, 3]);
  });

  it('не мутирует исходный массив', () => {
    const original = [buildVersion(2), buildVersion(1)];

    sortVersionsAscending(original);

    expect(original.map((v) => v.versionNumber)).toEqual([2, 1]);
  });
});

describe('toFactFormDto', () => {
  it('isFilled = false и currentVersion = null для формы без версий', () => {
    const form = {
      id: 1,
      factPackageId: 1,
      code: FactFormCode.ACT_WORK,
      label: 'Акт выполнения работ',
      versions: [],
    } as unknown as FactForm;

    const dto = toFactFormDto(form);

    expect(dto.isFilled).toBe(false);
    expect(dto.currentVersion).toBeNull();
    expect(dto.versions).toEqual([]);
  });

  it('currentVersion — версия с наибольшим versionNumber, versions отсортированы по возрастанию', () => {
    const form = {
      id: 1,
      factPackageId: 1,
      code: FactFormCode.ACT_WORK,
      label: 'Акт выполнения работ',
      versions: [buildVersion(2), buildVersion(1), buildVersion(3)],
    } as unknown as FactForm;

    const dto = toFactFormDto(form);

    expect(dto.isFilled).toBe(true);
    expect(dto.currentVersion?.versionNumber).toBe(3);
    expect(dto.versions.map((v) => v.versionNumber)).toEqual([1, 2, 3]);
  });
});

describe('toRemarkDto', () => {
  it('issuerLabel — код ЦФО, если cfo заполнен', () => {
    const remark = {
      id: 1,
      humanId: 'FCT-REM-000001',
      factPackageId: 1,
      relatedFormId: 1,
      cfoId: 5,
      cfo: { code: 'ОГМ' },
      authorId: 2,
      createdAt: new Date(),
      description: 'd',
      requiredAction: 'r',
      status: 'OPEN',
      closedAt: null,
      issuerLabel: 'ОГМ',
    } as unknown as FactPackageRemark;

    expect(toRemarkDto(remark).issuerLabel).toBe('ОГМ');
  });

  it('issuerLabel — «ДТОиР», если cfoId null', () => {
    const remark = {
      id: 2,
      humanId: 'FCT-REM-000002',
      factPackageId: 1,
      relatedFormId: 1,
      cfoId: null,
      cfo: null,
      authorId: 2,
      createdAt: new Date(),
      description: 'd',
      requiredAction: 'r',
      status: 'OPEN',
      closedAt: null,
      issuerLabel: 'ДТОиР',
    } as unknown as FactPackageRemark;

    expect(toRemarkDto(remark).issuerLabel).toBe('ДТОиР');
  });
});

describe('toFactPackageBaseDto', () => {
  it('canSubmit true для DRAFT, canSendToDtoe false', () => {
    const factPackage = {
      id: 1,
      humanId: 'FCT-000001',
      filialId: 1,
      direction: Direction.DO,
      authorId: 1,
      status: FactPackageStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentToDtoeAt: null,
      decidedAt: null,
      remarks: [],
      canSubmit: true,
      canSendToDtoe: false,
    } as unknown as FactPackage;

    const dto = toFactPackageBaseDto(factPackage);

    expect(dto.canSubmit).toBe(true);
    expect(dto.canSendToDtoe).toBe(false);
    expect(dto.openRemarksCount).toBe(0);
  });

  it('openRemarksCount не считает CLOSED замечания', () => {
    const factPackage = {
      id: 1,
      humanId: 'FCT-000001',
      filialId: 1,
      direction: Direction.DO,
      authorId: 1,
      status: FactPackageStatus.RETURNED_FOR_REVISION,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentToDtoeAt: null,
      decidedAt: null,
      remarks: [
        { status: 'OPEN' },
        { status: 'CLOSED' },
        { status: 'FIXED_BY_FILIAL' },
      ],
      canSubmit: true,
      canSendToDtoe: false,
    } as unknown as FactPackage;

    expect(toFactPackageBaseDto(factPackage).openRemarksCount).toBe(2);
  });
});

describe('toFactPackageListItemDto', () => {
  it('добавляет myCfoStatus из опций', () => {
    const factPackage = {
      id: 1,
      humanId: 'FCT-000001',
      filialId: 1,
      direction: Direction.DO,
      authorId: 1,
      status: FactPackageStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentToDtoeAt: null,
      decidedAt: null,
      remarks: [],
      filial: { id: 1, code: 'donbassgaz', name: 'Донбассгаз', isActive: true },
      author: {
        id: 1,
        username: 'u',
        fullName: 'U',
        role: 'FILIAL',
        position: '',
      },
      canSubmit: true,
      canSendToDtoe: false,
    } as unknown as FactPackage;

    const dto = toFactPackageListItemDto(factPackage, {
      myCfoStatus: 'PENDING' as never,
    });

    expect(dto.myCfoStatus).toBe('PENDING');
  });
});
