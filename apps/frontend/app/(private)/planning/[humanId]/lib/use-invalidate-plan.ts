import { useQueryClient } from "@tanstack/react-query";

import { getPlanSuspenseQueryKey } from "@/packages/api/base/codegen/hooks/plansController/useGetPlanSuspense";

export function useInvalidatePlan(humanId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: getPlanSuspenseQueryKey({ humanId }) });
  };
}
