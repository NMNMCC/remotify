type Choice = "rock" | "paper" | "scissors";
type Result = "win" | "lose" | "tie";

function* rock_paper_scissors(): Generator<
	Choice,
	Result,
	Choice
> {
	while (true) {
		const computer = [
			"rock",
			"paper",
			"scissors",
		][crypto.getRandomValues(new Uint8Array(1))[0] % 3] as Choice;

		let player: Choice;
		switch (computer) {
			case "rock":
				player = yield "rock";
				break;
			case "paper":
				player = yield "paper";
				break;
			case "scissors":
				player = yield "scissors";
				break;
		}

		if (computer === player) {
			console.log("TIE", { "computer:": computer, "player:": player });
			continue;
		} else if (
			(computer === "rock" && player === "scissors") ||
			(computer === "paper" && player === "rock") ||
			(computer === "scissors" && player === "paper")
		) {
			console.log("WIN", { "computer:": computer, "player:": player });
			return "win";
		} else {
			console.log("LOSE", { "computer:": computer, "player:": player });
			return "lose";
		}
	}
}

function main() {
	const generator = rock_paper_scissors();

	void generator.next();

	while (true) {
		if (generator.next(prompt("Your choice:") as Choice).done) { return; }
	}
}

main();
