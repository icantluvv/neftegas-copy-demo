import { Cfo } from '../org/entities/cfo.entity';
import { Filial } from '../org/entities/filial.entity';
import { User } from '../users/entities/user.entity';
import { DIRECTION_FORM_CODES, Direction } from './fact-form-catalog';
import { FactForm } from './entities/fact-form.entity';
import { FactFormVersion } from './entities/fact-form-version.entity';
import { FactPackageCfoStatus } from './entities/fact-package-cfo-status.entity';
import { FactPackageHistoryEntry } from './entities/fact-package-history-entry.entity';
import { FactPackage } from './entities/fact-package.entity';
import {
  FactPackageRemark,
  FactRemarkStatus,
} from './entities/fact-package-remark.entity';

export function toUserSummaryDto(user: User) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    position: user.position,
  };
}

export function toFilialDto(filial: Filial) {
  return {
    id: filial.id,
    code: filial.code,
    name: filial.name,
    isActive: filial.isActive,
  };
}

export function toCfoDto(cfo: Cfo) {
  return { id: cfo.id, code: cfo.code, name: cfo.name, isActive: cfo.isActive };
}

export function toFactFormVersionDto(version: FactFormVersion) {
  return {
    id: version.id,
    formId: version.formId,
    versionNumber: version.versionNumber,
    fileName: version.fileName,
    fileSize: Number(version.fileSize),
    mimeType: version.mimeType,
    uploadedById: version.uploadedById,
    uploadedAt: version.uploadedAt,
    remarkId: version.remarkId,
    note: version.note,
  };
}

/** Версии формы, отсортированные по возрастанию versionNumber (не мутирует исходный массив). */
export function sortVersionsAscending(
  versions: FactFormVersion[],
): FactFormVersion[] {
  return [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
}

export function toFactFormDto(form: FactForm) {
  const versions = sortVersionsAscending(form.versions ?? []);
  const current = versions.length ? versions[versions.length - 1] : null;
  return {
    id: form.id,
    factPackageId: form.factPackageId,
    code: form.code,
    label: form.label,
    isFilled: versions.length > 0,
    currentVersion: current ? toFactFormVersionDto(current) : null,
    versions: versions.map(toFactFormVersionDto),
  };
}

/** Формы, отсортированные по порядку каталога направления (не мутирует исходный массив). */
export function sortFormsByCatalogOrder(
  direction: Direction,
  forms: FactForm[],
): FactForm[] {
  const order = DIRECTION_FORM_CODES[direction];
  return [...forms].sort(
    (a, b) => order.indexOf(a.code) - order.indexOf(b.code),
  );
}

export function toCfoStatusDto(status: FactPackageCfoStatus) {
  return {
    id: status.id,
    factPackageId: status.factPackageId,
    cfoId: status.cfoId,
    cfo: toCfoDto(status.cfo),
    status: status.status,
    isRequired: status.isRequired,
    decidedById: status.decidedById,
    decidedBy: status.decidedBy ? toUserSummaryDto(status.decidedBy) : null,
    decidedAt: status.decidedAt,
  };
}

export function toRemarkDto(remark: FactPackageRemark) {
  return {
    id: remark.id,
    humanId: remark.humanId,
    factPackageId: remark.factPackageId,
    relatedFormId: remark.relatedFormId,
    cfoId: remark.cfoId,
    authorId: remark.authorId,
    createdAt: remark.createdAt,
    description: remark.description,
    requiredAction: remark.requiredAction,
    status: remark.status,
    closedAt: remark.closedAt,
    issuerLabel: remark.issuerLabel,
  };
}

export function toHistoryEntryDto(entry: FactPackageHistoryEntry) {
  return {
    id: entry.id,
    factPackageId: entry.factPackageId,
    timestamp: entry.timestamp,
    userId: entry.userId,
    user: entry.user ? toUserSummaryDto(entry.user) : null,
    text: entry.text,
  };
}

export function openRemarksCountOf(
  remarks: FactPackageRemark[] | undefined,
): number {
  return (remarks ?? []).filter((r) => r.status !== FactRemarkStatus.CLOSED)
    .length;
}

export function toFactPackageBaseDto(factPackage: FactPackage) {
  return {
    id: factPackage.id,
    humanId: factPackage.humanId,
    filialId: factPackage.filialId,
    cfoId: factPackage.cfoId,
    direction: factPackage.direction,
    authorId: factPackage.authorId,
    status: factPackage.status,
    createdAt: factPackage.createdAt,
    updatedAt: factPackage.updatedAt,
    sentToDtoeAt: factPackage.sentToDtoeAt,
    decidedAt: factPackage.decidedAt,
    canSubmit: factPackage.canSubmit,
    canSendToDtoe: factPackage.canSendToDtoe,
    openRemarksCount: openRemarksCountOf(factPackage.remarks),
  };
}

export function toFactPackageListItemDto(
  factPackage: FactPackage,
  opts: {
    myCfoStatus?: (typeof factPackage.cfoStatuses)[number]['status'] | null;
  } = {},
) {
  return {
    ...toFactPackageBaseDto(factPackage),
    filial: factPackage.filial ? toFilialDto(factPackage.filial) : null,
    cfo: factPackage.cfo ? toCfoDto(factPackage.cfo) : null,
    author: toUserSummaryDto(factPackage.author),
    myCfoStatus: opts.myCfoStatus ?? null,
  };
}
