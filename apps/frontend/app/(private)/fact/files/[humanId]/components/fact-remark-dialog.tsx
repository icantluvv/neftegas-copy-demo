"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { FactPackageRemarkCreateInput } from "@/packages/api/base/codegen";
import { factPackageRemarkCreateInputSchema } from "@/packages/api/base/codegen";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

interface FactRemarkDialogProps {
  triggerLabel: string;
  dialogTitle: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (data: FactPackageRemarkCreateInput) => void;
  /** Форма пакета, к которой привязывается замечание — фиксируется кнопкой в строке, пользователь её не выбирает. */
  formId: number;
}

/**
 * Что это: диалог с формой замечания к форме факт-пакета.
 * Кто видит: ЦФО (пока пакет у него на проверке) и ДТОиР (пока пакет на проверке ДТОиР) — рендерится вызывающей стороной по правам.
 * Когда активен: кнопка-триггер всегда активна, когда показана; кнопка отправки — пока не идёт запрос.
 * Что происходит: у ЦФО отправка атомарно возвращает пакет на доработку; у ДТОиР — только фиксирует замечание (openspec/changes/fact-package-review/design.md).
 */
export function FactRemarkDialog({
  triggerLabel,
  dialogTitle,
  submitLabel,
  isSubmitting,
  onSubmit,
  formId,
}: FactRemarkDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FactPackageRemarkCreateInput>({
    resolver: zodResolver(factPackageRemarkCreateInputSchema),
    defaultValues: { relatedFormId: formId },
  });

  function handleFormSubmit(data: FactPackageRemarkCreateInput) {
    onSubmit({ ...data, relatedFormId: formId });
    reset();
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Описание</Label>
            <Input id="description" aria-invalid={!!errors.description} {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requiredAction">Что исправить</Label>
            <Input id="requiredAction" aria-invalid={!!errors.requiredAction} {...register("requiredAction")} />
            {errors.requiredAction && <p className="text-sm text-destructive">{errors.requiredAction.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
