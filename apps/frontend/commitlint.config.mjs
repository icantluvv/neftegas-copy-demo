/**
 * Конфигурация commitlint (хук commit-msg через Lefthook, см. lefthook.yml в корне).
 * Формат коммитов — Conventional Commits: `тип(скоуп): короткое описание`.
 * Кастомное правило `optional-trailers` проверяет трейлеры `Refs`/`Change`.
 * Правила проекта — раздел «Формат коммита» в корневом AGENTS.md.
 */

const TRAILER_PATTERN = /^(?:[A-Za-z][A-Za-z0-9-]*|BREAKING CHANGE): .+$/
const MANAGED_TRAILER_PATTERN = /^(?:Change|Refs):/
const CHANGE_TRAILER_PATTERN = /^Change: \S(?:.*\S)?$/
const REFS_TRAILER_PATTERN = /^Refs: KT-\d+$/

const ERROR_MESSAGE = `трейлер Change обязателен в footer (после пустой строки), Refs — опционален:
Change: <название-чейнджа>
Refs: KT-12345678
Пример: git commit -m 'fix(notify): исправить фильтр' -m 'Change: some-change'`

function getLines(raw) {
    return raw.replace(/\r\n?/g, '\n').trimEnd().split('\n')
}

function getFooterLines(lines) {
    const separatorIndex = lines.findLastIndex((line) => line.trim() === '')

    if (separatorIndex <= 0 || separatorIndex === lines.length - 1) return []

    const footerLines = lines.slice(separatorIndex + 1)

    return footerLines.every((line) => TRAILER_PATTERN.test(line)) ? footerLines : []
}

/**
 * @param {{ raw?: string }} options Параметры правила.
 * @returns {[boolean, string]} Результат валидации и сообщение об ошибке.
 */
export function optionalTrailersRule({ raw = '' }) {
    const lines = getLines(raw)
    const managedLines = lines.filter((line) => MANAGED_TRAILER_PATTERN.test(line))
    const footerLines = getFooterLines(lines)
    const managedFooterLines = footerLines.filter((line) => MANAGED_TRAILER_PATTERN.test(line))
    const changeTrailers = managedFooterLines.filter((line) => line.startsWith('Change:'))
    const refsTrailers = managedFooterLines.filter((line) => line.startsWith('Refs:'))
    const valid =
        managedFooterLines.length === managedLines.length &&
        changeTrailers.length === 1 &&
        changeTrailers.every((line) => CHANGE_TRAILER_PATTERN.test(line)) &&
        refsTrailers.length <= 1 &&
        refsTrailers.every((line) => REFS_TRAILER_PATTERN.test(line))

    return [valid, ERROR_MESSAGE]
}

const config = {
    extends: ['@commitlint/config-conventional'],
    plugins: [
        {
            rules: {
                'optional-trailers': optionalTrailersRule,
            },
        },
    ],
    rules: {
        'optional-trailers': [2, 'always'],
    },
}

export default config
