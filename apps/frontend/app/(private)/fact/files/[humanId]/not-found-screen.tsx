export function NotFoundScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold">Факт-пакет не найден</h1>
      <p className="text-sm text-muted-foreground">Проверьте номер факт-пакета в адресе страницы.</p>
    </div>
  );
}
