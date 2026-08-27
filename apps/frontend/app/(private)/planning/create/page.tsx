import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CreateCorrectionStub} from "#/components/create-correction-stub";

const PACKAGE_DOCUMENT_NAMES = ["Excel корректировка", "Пакет документов", "Счета на оплату"];

export default async function PlanningCreatePage() {
    const user = await getMe();
    if (user.role !== "FILIAL") {
        return <AccessDeniedScreen/>;
    }

    return <CreateCorrectionStub cancelHref="/planning" documentNames={PACKAGE_DOCUMENT_NAMES}/>;
}
