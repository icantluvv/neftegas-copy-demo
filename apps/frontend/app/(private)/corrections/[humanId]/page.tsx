type PageProps = {
  params: Promise<{ humanId: string }>;
};

export default async function CorrectionPage({ params }: PageProps) {
  const { humanId } = await params;

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-lg font-semibold">Корректировка {humanId}</h1>
      <p className="text-sm text-muted-foreground">
        Карточка корректировки будет доступна в следующем обновлении.
      </p>
    </div>
  );
}
