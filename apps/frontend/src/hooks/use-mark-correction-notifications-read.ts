"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { getNotificationsQueryKey, useMarkNotificationsReadByCorrection } from "@/packages/api/base/codegen";

/**
 * Помечает прочитанными все уведомления пользователя по корректировке.
 * Вызывать в обработчике клика по элементу, ведущему на карточку
 * корректировки (`/corrections/{humanId}`), а не при монтировании самой
 * карточки — иначе запрос уходит на каждый заход, включая обновление
 * страницы и переходы назад/вперёд.
 */
export function useMarkCorrectionNotificationsRead() {
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationsReadByCorrection();

  return useCallback(
    (correctionId: number) => {
      markRead.mutate(
        { correctionId },
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
