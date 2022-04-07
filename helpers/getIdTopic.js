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
	}
	return idTopic
}
module.exports = getIdTopics