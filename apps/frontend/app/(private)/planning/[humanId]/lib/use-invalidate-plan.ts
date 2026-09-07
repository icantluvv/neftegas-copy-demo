import { useQueryClient } from "@tanstack/react-query";

import { getPlanSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/plansController/useGetPlanSuspense";

/** Сбрасывает кэш карточки плана — вызывается после любой мутации по ней. */
export function useInvalidatePlan(humanId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: getPlanSuspenseQueryKey({ humanId }) });
  };
}
