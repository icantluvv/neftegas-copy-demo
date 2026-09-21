import { Cfo } from '../org/entities/cfo.entity';
import { Filial } from '../org/entities/filial.entity';
import { User } from '../users/entities/user.entity';
import { PlanCfoStatus } from './entities/plan-cfo-status.entity';
import { PlanDocumentSlot } from './entities/plan-document-slot.entity';
import { PlanFileVersion } from './entities/plan-file-version.entity';
import { PlanHistoryEntry } from './entities/plan-history-entry.entity';
import { PlanRemark, PlanRemarkStatus } from './entities/plan-remark.entity';
import { PlanType } from './entities/plan-type.entity';
import { Plan } from './entities/plan.entity';

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

export function toPlanTypeDto(type: PlanType) {
  return {
    id: type.id,
    code: type.code,
    name: type.name,
    description: type.description,
    isActive: type.isActive,
  };
}

export function toPlanFileVersionDto(version: PlanFileVersion) {
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

/**
 * Порядок отображения в карточке определяется `PlanPackageRequirement.order`
 * (см. apps/backend/AGENTS.md, аналогично `PackageRequirement` у корректировок),
 * а не порядком вставки строк в БД. Слот без требования (главный файл
 * «Excel плана», `requirementId = null`) всегда идёт первым.
 */
export function sortSlotsByRequirementOrder(
  slots: PlanDocumentSlot[],
): PlanDocumentSlot[] {
  return [...slots].sort(
    (a, b) => (a.requirement?.order ?? -1) - (b.requirement?.order ?? -1),
  );
}

export function toPlanDocumentSlotDto(slot: PlanDocumentSlot) {
  const versions = slot.versions ?? [];
  const current = versions.length
    ? versions.reduce((latest, v) =>
        v.versionNumber > latest.versionNumber ? v : latest,
      )
    : null;
  return {
    id: slot.id,
    planId: slot.planId,
    requirementId: slot.requirementId,
    label: slot.label,
    isFilled: versions.length > 0,
    isRequired: slot.requirement ? slot.requirement.isRequired : true,
    responsibleCfo: slot.requirement?.responsibleCfo
      ? toCfoDto(slot.requirement.responsibleCfo)
      : null,
    currentVersion: current ? toPlanFileVersionDto(current) : null,
    choiceGroupKey: slot.requirement?.choiceGroupKey ?? null,
    groupLabel: slot.requirement?.groupLabel || null,
  };
}

export function toPlanCfoStatusDto(status: PlanCfoStatus) {
  return {
    id: status.id,
    planId: status.planId,
    cfoId: status.cfoId,
    cfo: toCfoDto(status.cfo),
    status: status.status,
    isRequired: status.isRequired,
    decidedById: status.decidedById,
    decidedBy: status.decidedBy ? toUserSummaryDto(status.decidedBy) : null,
    decidedAt: status.decidedAt,
  };
}

export function toPlanRemarkDto(remark: PlanRemark) {
  return {
    id: remark.id,
    humanId: remark.humanId,
    planId: remark.planId,
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

export function toPlanHistoryEntryDto(entry: PlanHistoryEntry) {
  return {
    id: entry.id,
    planId: entry.planId,
    timestamp: entry.timestamp,
    userId: entry.userId,
    user: entry.user ? toUserSummaryDto(entry.user) : null,
    text: entry.text,
  };
}

export function openRemarksCountOf(remarks: PlanRemark[] | undefined): number {
  return (remarks ?? []).filter((r) => r.status !== PlanRemarkStatus.CLOSED)
    .length;
}

export function toPlanBaseDto(plan: Plan) {
  return {
    id: plan.id,
    humanId: plan.humanId,
    filialId: plan.filialId,
    cfoId: plan.cfoId,
    planTypeId: plan.planTypeId,
    authorId: plan.authorId,
    status: plan.status,
    stageNote: plan.stageNote,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    sentToDtoeAt: plan.sentToDtoeAt,
    decidedAt: plan.decidedAt,
    canSend: plan.canSend,
    canSendToDtoe: plan.canSendToDtoe,
    openRemarksCount: openRemarksCountOf(plan.remarks),
  };
}

export function toPlanListItemDto(
  plan: Plan,
  opts: {
    myCfoStatus?: (typeof plan.cfoStatuses)[number]['status'] | null;
  } = {},
) {
  return {
    ...toPlanBaseDto(plan),
    filial: plan.filial ? toFilialDto(plan.filial) : null,
    cfo: plan.cfo ? toCfoDto(plan.cfo) : null,
    planType: toPlanTypeDto(plan.planType),
    author: toUserSummaryDto(plan.author),
    myCfoStatus: opts.myCfoStatus ?? null,
  };
}
