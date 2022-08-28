function getIdTopics(emoji) {
	let idTopic = ''
	switch (emoji) {
		case "📑":
			idTopic = '960812100006068264'
			break;
		case "📚":
			idTopic = '960812522720608276'
			break;
		case "🍔":
			idTopic = '960812965928509481'
			break;
		case "🌺":
			idTopic = '960813065534836756'
			break;
		case "⏰":
			idTopic = '960813217540608022'
			break;
		case "📝":
			idTopic = '960813369068257310'
			break;
		case "💸":
			idTopic = '960813690536464394'
			break;
		case "🌥️":
			idTopic = '1008630629195321344'
			break;
		case "🌜":
			idTopic = '1008630764889444373'
			break;
		case "🏀":
			idTopic = '1009361644528349284'
			break;
		case "💻":
			idTopic = '1009362691757985842'
			break;
	}
	return idTopic
}
module.exports = getIdTopics