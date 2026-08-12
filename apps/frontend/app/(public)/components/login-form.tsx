'use client'

import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {AuthUser, LoginRequest, loginRequestSchema, useLogin} from "@/packages/api/base/codegen";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";

const ROLE_HOME_ROUTE: Partial<Record<AuthUser["role"], string>> = {
  FILIAL: "/filial",
  CFO: "/cfo",
  DTOE: "/dtoe",
};

export function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
  });

  const login = useLogin({
    mutation: {
      onSuccess: (data) => {
        router.replace(ROLE_HOME_ROUTE[data.role] ?? "/");
      },
      onError: (error) => {
        const status = (error as { cause?: { status?: number } }).cause?.status;
        if (status === 401) {
          toast.error("Неверный email или пароль");
          return;
        }
        toast.error("Ошибка сервера. Попробуйте позже");
      },
    },
  });

  function onSubmit(data: LoginRequest) {
    login.mutate({ data });
  }

  return (
      <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/10 p-8"
      >
        <h1 className="text-xl font-semibold">Вход</h1>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
              id="email"
              type="email"
              autoComplete="email"
              className="min-h-12"
              aria-invalid={!!errors.email}
              {...register("email")}
          />
          {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="min-h-12"
              aria-invalid={!!errors.password}
              {...register("password")}
          />
          {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
          )}
        </div>

        <Button type="submit" className="min-h-12" disabled={login.isPending}>
          {login.isPending ? "Входим…" : "Войти"}
        </Button>
      </form>
  );
}
