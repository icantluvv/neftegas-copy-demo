"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreatePlan, useGetPlanTypes } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";

export function CreatePlanForm() {
  const router = useRouter();
  const [planTypeId, setPlanTypeId] = useState<number | null>(null);

  const typesQuery = useGetPlanTypes({ params: { isActive: true } });
  const createPlan = useCreatePlan({
    mutation: {
      onSuccess: (detail) => router.push(`/planning/${detail.humanId}`),
    },
  });

  const types = typesQuery.data ?? [];

  function handleCreate() {
    if (planTypeId == null) return;
    createPlan.mutate({ data: { planTypeId } });
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-5 md:p-8">
      <h1 className="text-2xl font-semibold">Создать план</h1>

      <div className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-type" className="text-sm font-medium text-muted-foreground">
            Тип плана
          </label>
          <Select
            value={planTypeId != null ? String(planTypeId) : null}
            onValueChange={(value) => setPlanTypeId(value ? Number(value) : null)}
          >
            <SelectTrigger id="plan-type" aria-label="Тип плана" className="w-full">
              <SelectValue placeholder="Выберите тип плана" />
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
            title={planTypeId == null ? "Выберите тип плана" : undefined}
            disabled={planTypeId == null || createPlan.isPending}
            onClick={handleCreate}
          >
            Создать
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/planning")}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
