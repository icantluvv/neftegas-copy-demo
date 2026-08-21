"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { RemarkCreateInput } from "@/packages/api/base/codegen";
import { remarkCreateInputSchema } from "@/packages/api/base/codegen";

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

interface ReturnRemarkDialogProps {
  triggerLabel: string;
  isSubmitting: boolean;
  onSubmit: (data: RemarkCreateInput) => void;
  /** Элемент пакета, к которому привязывается замечание — фиксируется кнопкой в строке, пользователь его не выбирает. */
  slotId?: number;
  slotLabel?: string;
}

export function ReturnRemarkDialog({ triggerLabel, isSubmitting, onSubmit, slotId, slotLabel }: ReturnRemarkDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RemarkCreateInput>({
    resolver: zodResolver(remarkCreateInputSchema),
  });

  function handleFormSubmit(data: RemarkCreateInput) {
    onSubmit(slotId == null ? data : { ...data, relatedSlotId: slotId });
    reset();
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{slotLabel ? `Замечание к элементу: ${slotLabel}` : "Вернуть на доработку"}</DialogTitle>
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
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sheetName">Лист</Label>
              <Input id="sheetName" {...register("sheetName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rowRef">Строка</Label>
              <Input id="rowRef" {...register("rowRef")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cellRef">Ячейка</Label>
              <Input id="cellRef" {...register("cellRef")} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Отмена</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {slotLabel ? "Сохранить замечание" : "Вернуть на доработку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
