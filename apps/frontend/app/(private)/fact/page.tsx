import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../components/access-denied-screen";
import {CfoFactDashboard} from "./components/cfo-fact-dashboard";
import {DtoeFactDashboard} from "./components/dtoe-fact-dashboard";
import {FilialFactDashboard} from "./components/filial-fact-dashboard";
import {getDashboardKind} from "#/utils/get-dashboard-kind";

export const dynamic = "force-dynamic";

/**
 * «Рабочий стол» модуля «Факт» — зеркало `app/(private)/dashboard/page.tsx`
 * для факт-пакетов: свод по направлениям (диаграмма + таблица), карточки
 * с агрегированными счётчиками. Экран «Файлы» (создание/загрузка по
 * направлению) — отдельно, `/fact/files`.
 */
export default async function FactPage() {
    const user = await getMe();
    const kind = getDashboardKind(user.role);

    switch (kind) {
        case "filial":
            return <FilialFactDashboard/>;
        case "cfo":
            return <CfoFactDashboard/>;
        case "dtoe":
            return <DtoeFactDashboard/>;
        default:
            return <AccessDeniedScreen/>;
    }
}
