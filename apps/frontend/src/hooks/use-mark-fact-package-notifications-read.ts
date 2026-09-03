"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { getNotificationsQueryKey, useMarkNotificationsReadByFactPackage } from "@/packages/api/base/codegen";

export function useMarkFactPackageNotificationsRead() {
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationsReadByFactPackage();

  return useCallback(
    (factPackageId: number) => {
      markRead.mutate(
        { factPackageId },
        {
          onSuccess: (data) => {
            if (data.updatedCount > 0) {
              void queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey() });
            }
          },
        },
      );
    },
    [markRead, queryClient],
  );
}
