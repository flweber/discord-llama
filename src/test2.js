const Ollama = require('ollama').Ollama;
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ollama = new Ollama({ host: 'http://10.10.132.178:8090' });

async function run() {
  return new Promise((resolve, reject) => {
    let answer = "";
    rl.question(`What is your question?`, async prompt => {
      try {
        const chat = await ollama.chat({
          model: 'llama3',
          keep_alive: 60000,
          messages: [
            {
              role: "user",
              content: prompt,
            }
          ],
          stream: true,
        });
        for await (const part of chat) {
          answer += part.message.content;
          process.stdout.write(part.message.content)
        }
        resolve(answer);
      } catch (err) {
        reject(err);
      }
    });
  });
}

run().then(answer => {
  console.warn("Whole answer was: ", answer);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
