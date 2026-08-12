import { Cfo } from '../org/entities/cfo.entity';
import { CorrectionType } from '../org/entities/correction-type.entity';
import { Filial } from '../org/entities/filial.entity';
import { User } from '../users/entities/user.entity';
import { CorrectionCfoStatus } from './entities/correction-cfo-status.entity';
import { CorrectionHistoryEntry } from './entities/correction-history-entry.entity';
import { Correction } from './entities/correction.entity';
import { DocumentSlot } from './entities/document-slot.entity';
import { FileVersion } from './entities/file-version.entity';
import { Remark } from './entities/remark.entity';

export function toUserSummaryDto(user: User) {
  return { id: user.id, username: user.username, fullName: user.fullName };
}

export function toFilialDto(filial: Filial) {
  return { id: filial.id, code: filial.code, name: filial.name, isActive: filial.isActive };
}

export function toCfoDto(cfo: Cfo) {
  return { id: cfo.id, code: cfo.code, name: cfo.name, isActive: cfo.isActive };
}

export function toCorrectionTypeDto(type: CorrectionType) {
  return { id: type.id, code: type.code, name: type.name, description: type.description, isActive: type.isActive };
}

export function toFileVersionDto(version: FileVersion) {
  return {
    id: version.id,
    slotId: version.slotId,
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

export function toDocumentSlotDto(slot: DocumentSlot) {
  const versions = slot.versions ?? [];
  const current = versions.length
    ? versions.reduce((latest, v) => (v.versionNumber > latest.versionNumber ? v : latest))
    : null;
  return {
    id: slot.id,
    correctionId: slot.correctionId,
    requirementId: slot.requirementId,
    label: slot.label,
    isFilled: versions.length > 0,
    isRequired: slot.requirement ? slot.requirement.isRequired : true,
    responsibleCfo: slot.requirement?.responsibleCfo ? toCfoDto(slot.requirement.responsibleCfo) : null,
    currentVersion: current ? toFileVersionDto(current) : null,
  };
}

export function toCfoStatusDto(status: CorrectionCfoStatus) {
  return {
    id: status.id,
    correctionId: status.correctionId,
    cfoId: status.cfoId,
    status: status.status,
    isRequired: status.isRequired,
    decidedById: status.decidedById,
    decidedAt: status.decidedAt,
  };
}

export function toRemarkDto(remark: Remark) {
  return {
    id: remark.id,
    humanId: remark.humanId,
    correctionId: remark.correctionId,
    cfoId: remark.cfoId,
    authorId: remark.authorId,
    createdAt: remark.createdAt,
    relatedSlotId: remark.relatedSlotId,
    fileVersionId: remark.fileVersionId,
    sheetName: remark.sheetName,
    rowRef: remark.rowRef,
    cellRef: remark.cellRef,
    description: remark.description,
    requiredAction: remark.requiredAction,
    status: remark.status,
    closedById: remark.closedById,
    closedAt: remark.closedAt,
    issuerLabel: remark.issuerLabel,
  };
}

export function toHistoryEntryDto(entry: CorrectionHistoryEntry) {
  return {
    id: entry.id,
    correctionId: entry.correctionId,
    timestamp: entry.timestamp,
    userId: entry.userId,
    text: entry.text,
  };
}

export function openRemarksCountOf(remarks: Remark[] | undefined): number {
  return (remarks ?? []).filter((r) => r.status !== 'CLOSED').length;
}

export function toCorrectionBaseDto(correction: Correction) {
  return {
    id: correction.id,
    humanId: correction.humanId,
    filialId: correction.filialId,
    correctionTypeId: correction.correctionTypeId,
    authorId: correction.authorId,
    status: correction.status,
    stageNote: correction.stageNote,
    createdAt: correction.createdAt,
    updatedAt: correction.updatedAt,
    sentToDtoeAt: correction.sentToDtoeAt,
    decidedAt: correction.decidedAt,
    canSend: correction.canSend,
    canSendToDtoe: correction.canSendToDtoe,
    openRemarksCount: openRemarksCountOf(correction.remarks),
  };
}

export function toCorrectionListItemDto(
  correction: Correction,
  opts: { myCfoStatus?: (typeof correction.cfoStatuses)[number]['status'] | null } = {},
) {
  return {
    ...toCorrectionBaseDto(correction),
    filial: toFilialDto(correction.filial),
    correctionType: toCorrectionTypeDto(correction.correctionType),
    author: toUserSummaryDto(correction.author),
    myCfoStatus: opts.myCfoStatus ?? null,
  };
}
