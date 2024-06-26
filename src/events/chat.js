const _ = require("lodash");

module.exports = async (message, rag) => {
  let interval;
  try {
    interval = setInterval(() => message.channel.sendTyping(), 5000);
    message.channel.sendTyping();
    const embedding = await rag.createEmbedding(message.content);
    const searchResults = await rag.search(embedding);
    let answer = "";
    if (rag.backend !== "chromadb") {
      _.forEach(searchResults.results, result => console.log(`${result.name}: ${result.score}`));
      if (searchResults.results.length <= 0) {
        throw { message: "Nothing found" };
      }
      const result = _.sortBy(searchResults.results, ["score"])[searchResults.results.length - 1];
      console.log(`\n\nDocument: ${result.name}\nScore: ${result.score}\n\n`);
      if (result.score < 250) throw new Error("Sorry we don't have any data to your question");
      answer = await rag.answerQuestion(message.content, result.name);
    } else {
      if (searchResults.documents.length <= 0) {
        throw { message: "Nothing found" };
      }
      console.log("Found documents: ", searchResults.documents);
      answer = await rag.answerQuestion(message.content, searchResults.documents[0]);
    }
    message.author.send(answer);
  } catch (err) {
    message.author.send(err.message ?? err);
  } finally {
    clearInterval(interval);
  }
};