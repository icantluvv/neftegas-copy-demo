"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { getNotificationsQueryKey, useMarkNotificationsReadByPlan } from "@/packages/api/base/codegen";

/**
 * Помечает прочитанными все уведомления пользователя по плану.
 * Вызывать в обработчике клика по элементу, ведущему на карточку
 * плана (`/planning/{humanId}`), а не при монтировании самой карточки —
 * иначе запрос уходит на каждый заход, включая обновление страницы и
 * переходы назад/вперёд.
 */
export function useMarkPlanNotificationsRead() {
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationsReadByPlan();

  return useCallback(
    (planId: number) => {
      markRead.mutate(
        { planId },
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
