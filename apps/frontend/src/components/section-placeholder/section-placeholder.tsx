import type {LucideIcon} from "lucide-react";

export interface SectionPlaceholderDocument {
    name: string;
    reference: string;
}

export interface SectionPlaceholderProps {
    icon: LucideIcon;
    title: string;
    description: string;
    documents?: SectionPlaceholderDocument[];
}

export function SectionPlaceholder({icon: Icon, title, description, documents}: SectionPlaceholderProps) {
    return (
        <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Icon className="size-7 text-muted-foreground" aria-hidden="true"/>
            </div>

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {documents && documents.length > 0 && (
                <div className="w-full rounded-lg border border-border p-4 text-left">
                    <h2 className="mb-3 text-xs font-medium uppercase text-muted-foreground">
                        Формы документов раздела
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {documents.map((document) => (
                            <li key={document.name} className="flex items-baseline justify-between gap-4 text-sm">
                                <span>{document.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">{document.reference}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <p className="text-xs text-muted-foreground">Раздел в разработке</p>
        </div>
    );
}
