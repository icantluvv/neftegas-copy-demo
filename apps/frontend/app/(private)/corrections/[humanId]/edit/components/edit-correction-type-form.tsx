"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useChangeCorrectionType, useGetCorrectionTypes } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";

export function EditCorrectionTypeForm({
  humanId,
  currentCorrectionTypeId,
}: {
  humanId: string;
  currentCorrectionTypeId: number;
}) {
  const router = useRouter();
  const [correctionTypeId, setCorrectionTypeId] = useState<number | null>(currentCorrectionTypeId);

  const typesQuery = useGetCorrectionTypes({ params: { isActive: true } });
  const changeType = useChangeCorrectionType({
    mutation: {
      onSuccess: (detail) => router.push(`/corrections/${detail.humanId}`),
    },
  });

  const types = typesQuery.data ?? [];

  function handleSave() {
    if (correctionTypeId == null) return;
    changeType.mutate({ humanId, data: { correctionTypeId } });
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-5 md:p-8">
      <h1 className="text-2xl font-semibold">Изменить тип корректировки {humanId}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Смена типа переформирует комплектность пакета под новый тип — уже загруженные версии файлов в слотах,
        которых нет в новом типе, будут удалены безвозвратно. Общий слот «Excel корректировка» не затрагивается.
      </p>

      <div className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="correction-type" className="text-sm font-medium text-muted-foreground">
            Тип корректировки
          </label>
          <Select
            value={correctionTypeId != null ? String(correctionTypeId) : null}
            onValueChange={(value) => setCorrectionTypeId(value ? Number(value) : null)}
          >
            <SelectTrigger id="correction-type" aria-label="Тип корректировки" className="w-full">
              <SelectValue placeholder="Выберите тип корректировки" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            title={correctionTypeId == null ? "Выберите тип корректировки" : undefined}
            disabled={correctionTypeId == null || correctionTypeId === currentCorrectionTypeId || changeType.isPending}
            onClick={handleSave}
          >
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/corrections/${humanId}`)}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
