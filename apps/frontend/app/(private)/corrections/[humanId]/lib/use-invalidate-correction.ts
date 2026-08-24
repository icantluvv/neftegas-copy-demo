import { useQueryClient } from "@tanstack/react-query";

import { getCorrectionSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/correctionsController/useGetCorrectionSuspense";

/** Сбрасывает кэш карточки корректировки — вызывается после любой мутации по ней. */
export function useInvalidateCorrection(humanId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: getCorrectionSuspenseQueryKey({ humanId }) });
  };
}
