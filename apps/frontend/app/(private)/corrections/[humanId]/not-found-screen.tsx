export function NotFoundScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold">Корректировка не найдена</h1>
      <p className="text-sm text-muted-foreground">Проверьте номер корректировки в адресе страницы.</p>
    </div>
  );
}
