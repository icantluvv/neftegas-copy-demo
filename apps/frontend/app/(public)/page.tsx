import {LoginForm} from "@/app/(public)/components/login-form";
import {AuthWaveBackground} from "#/components/auth-wave-background";
import {clientEnvironment} from "#/env/client";

export default function Home() {
  return (
      <div className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4">
        <AuthWaveBackground/>
        <div className="relative flex w-full max-w-sm flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
              Система согласования корректировок
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[oklch(0.52_0.13_250)] uppercase dark:text-[oklch(0.75_0.13_250)]">
              {clientEnvironment.NEXT_PUBLIC_APP_NAME}
            </h1>
          </div>
          <LoginForm/>
        </div>
      </div>
  );
}
