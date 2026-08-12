export function AccessDeniedScreen() {
    return (
        <div className='h-full flex flex-col items-center justify-center text-center'>
            <h1 className="text-2xl font-semibold">Доступ запрещён</h1>
            <p className="text-sm text-muted-foreground">
                У вас нет прав для просмотра этого раздела.
            </p>
        </div>
    );
}
