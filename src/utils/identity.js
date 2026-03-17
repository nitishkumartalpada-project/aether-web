export const getOrCreateGhostId = () => {
	let ghostId = localStorage.getItem("aether_ghost_id");

	if (!ghostId) {
		ghostId =
			"aether_" +
			Math.random().toString(36).substring(2, 15) +
			Date.now().toString(36);
		localStorage.setItem("aether_ghost_id", ghostId);
		console.log("Aether Core: New Anonymous Identity Minted ->", ghostId);
	} else {
		console.log("Aether Core: Session Restored ->", ghostId);
	}

	return ghostId;
};
