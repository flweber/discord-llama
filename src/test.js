const Ollama = require('ollama').Ollama;
const MilvusClient = require('@zilliz/milvus2-sdk-node').MilvusClient;
const DataType = require('@zilliz/milvus2-sdk-node').DataType;
const readline = require('node:readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const documents = {
    "Llama_Guide.pdf": "Llamas are members of the camelid family",
};

const address = 'dns2.flweber.de:19530';

// connect to milvus
const client = new MilvusClient({ address });

client.connect();

client.showCollections()
  .then(res => {
    if (!res.collection_names.includes("rag_data")) {
      client.createCollection({
        collection_name: "rag_data",
        fields: [
          {
            name: "name",
            description: "Document name",
            data_type: DataType.VarChar,
            is_primary_key: true,
            autoID: false,
            max_length: 128,
          },
          {
            name: "embed",
            description: "Vector data of the document",
            data_type: DataType.FloatVector,
            dim: 1024,
          },
          {
            name: "updated_timestamp",
            description: "Timestamp when this document was last updated",
            data_type: DataType.Int64,
          }
        ]
      });
    }
  });

const ollama = new Ollama({ host: 'http://10.10.132.178:8090' });

async function run() {
  const upsertData = [];
  for (let i = 0; i < documents.length; i++) {
    const embed = await ollama.embeddings({
      model: 'mxbai-embed-large',
      keep_alive: 60000,
      prompt: 'Llamas are members of the camelid family',
    });
    upsertData.push({
      name: documents[i].name,
      embed: embed.embedding,
      updated_timestamp: Date.now(),
    });
  }

  await client.upsert({
    collection_name: "rag_data",
    data: upsertData,
  });

  await client.createIndex({
    collection_name: "rag_data",
    field_name: 'embed',
    index_name: 'test1',
    index_type: 'FLAT',
    params: { efConstruction: 10, M: 4 },
    metric_type: 'L2',
  })
    .then(res => console.log(res))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });

  await client.loadCollectionSync({
    collection_name: "rag_data",
  })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });

  rl.question(`What is your question?`, async prompt => {
    const embed = await ollama.embeddings({
      model: 'mxbai-embed-large',
      keep_alive: 60000,
      prompt,
    });

    const res = await client.search({
      collection_name: "rag_data",
      data: embed.embedding,
      limit: 1,
      params: { nprobe: 64 },
      output_fields: ['name', 'embed'],
    });

    console.log(res);
    return;

    const chat = await ollama.chat({
      model: 'llama3-chatqa',
      keep_alive: 60000,
      messages: [
        {
          role: "system",
          content: `You are a support bot which should help the user on specific requests.
          You're always polite and you're always answering in the language in which the user writes.
          You are only allowed to use the following information to answer the request: ${documents[0].content}`
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      stream: true,
    });
    for await (const part of chat) {
      process.stdout.write(part.message.content)
    }
    rl.close();
  });
}

run();
