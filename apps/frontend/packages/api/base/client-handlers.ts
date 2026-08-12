type ProfileIncompleteHandler = () => void

let onProfileIncomplete: ProfileIncompleteHandler | null = null

export function setOnProfileIncomplete(handler: ProfileIncompleteHandler) {
	onProfileIncomplete = handler
}

export function getOnProfileIncomplete() {
	return onProfileIncomplete
}
