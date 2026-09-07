import { PlansArchiveList } from "./components/plans-archive-list";

export default function PlanningFilesPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Файлы — План на 2027</h1>
            <p className="text-sm text-muted-foreground">
                Архив документов и версий файлов модуля «План на 2027». Откройте план, чтобы посмотреть комплектность
                пакета и версии загруженных файлов.
            </p>
            <PlansArchiveList />
        </div>
    );
}
