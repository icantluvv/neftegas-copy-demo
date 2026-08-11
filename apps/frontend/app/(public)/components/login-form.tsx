'use client'

import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {LoginRequest, loginRequestSchema, useLogin} from "@/packages/api/base/codegen";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";

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
      onSuccess: () => {
        router.replace("/dashboard");
      },
      onError: () => {
        toast.error("Неверный логин или пароль");
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
          <Label htmlFor="username">Логин</Label>
          <Input
              id="username"
              autoComplete="username"
              aria-invalid={!!errors.username}
              {...register("username")}
          />
          {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
          />
          {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
          )}
        </div>

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Входим…" : "Войти"}
        </Button>
      </form>
  );
}
