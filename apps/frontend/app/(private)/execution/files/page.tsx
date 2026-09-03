import {FileText} from "lucide-react";

import {SectionPlaceholder} from "#/components/section-placeholder";

export default function ExecutionFilesPage() {
    return (
        <SectionPlaceholder
            icon={FileText}
            title="Файлы"
            description="Архив документов и версий файлов модуля «Выполнение»."
        />
    );
}
