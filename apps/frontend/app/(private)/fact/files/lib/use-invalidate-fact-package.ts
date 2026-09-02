"use client";

import { useQueryClient } from "@tanstack/react-query";

import { getFactPackageSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/factPackagesController/useGetFactPackageSuspense";

/** Сбрасывает кэш карточки факт-пакета — вызывается после любой мутации по ней. */
export function useInvalidateFactPackage(humanId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: getFactPackageSuspenseQueryKey({ humanId }) });
  };
}
