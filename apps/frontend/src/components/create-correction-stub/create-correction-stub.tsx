"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

import {Button} from "#/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "#/components/ui/select";

const STUB_CORRECTION_TYPE = "Стандартная корректировка";

export interface CreateCorrectionStubProps {
    cancelHref: string;
    documentNames: string[];
}

export function CreateCorrectionStub({cancelHref, documentNames}: CreateCorrectionStubProps) {
    const router = useRouter();
    const [correctionType, setCorrectionType] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Создать корректировку</h1>

            <div className="flex max-w-md flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="module-correction-type" className="text-sm font-medium text-muted-foreground">
                        Тип корректировки
                    </label>
                    <Select value={correctionType} onValueChange={setCorrectionType}>
                        <SelectTrigger id="module-correction-type" aria-label="Тип корректировки" className="w-full">
                            <SelectValue placeholder="Выберите тип корректировки"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={STUB_CORRECTION_TYPE}>{STUB_CORRECTION_TYPE}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Комплектность пакета
                    </span>
                    <ul className="flex flex-col gap-1 text-sm">
                        {documentNames.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button type="button" disabled title="Раздел в разработке — создание пока не подключено">
                        Создать
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
                        Отмена
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Раздел в разработке: форма повторяет вид модуля «Корректировка», но не связана с ним —
                    отдельное создание корректировок для этого раздела будет реализовано в последующих изменениях.
                </p>
            </div>
        </div>
    );
}
