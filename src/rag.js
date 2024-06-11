const Ollama = require('ollama').Ollama;
const MilvusClient = require('@zilliz/milvus2-sdk-node').MilvusClient;
const DataType = require('@zilliz/milvus2-sdk-node').DataType;
const PDFParser = require("pdf2json");
const path = require("node:path");
const fs = require("node:fs");

class RAG {
  constructor() {
    this.milvus = undefined;
    this.ollama = undefined;
    this.jsonPath = path.join(__dirname, "documents.json");
  }


  async loadCollection() {
    await this.milvus.loadCollectionSync({
      collection_name: "rag_data",
    });
  }

  async init() {
    const address = process.env.MILVUS_ADDRESS;

    // connect to milvus
    this.milvus = new MilvusClient({ address });

    this.milvus.connect();

    this.milvus.showCollections()
      .then(res => {
        if (!res.collection_names.includes("rag_data")) {
          this.milvus.createCollection({
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

    await this.milvus.createIndex({
      collection_name: "rag_data",
      field_name: 'embed',
      index_name: 'test1',
      index_type: 'FLAT',
      params: { efConstruction: 10, M: 4 },
      metric_type: 'L2',
    });

    await this.loadCollection();

    this.ollama = new Ollama({ host: process.env.DC_OLLAMA_HOST });
  }

  async createEmbedding(prompt) {
    const embed = await this.ollama.embeddings({
      model: 'mxbai-embed-large',
      keep_alive: 60000,
      prompt,
    });
    return embed.embedding;
  }
  async addDocument(name, url, isLocal = false) {
    if (isLocal) {
      console.warn("Local documents are not implemented.");
    } else {
      try {
        // PDF von der URL herunterladen
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        const pdfBuffer = await response.arrayBuffer(); // Buffer der PDF Datei

        const pdfParser = new PDFParser(this, 1);
        // Ein Promise erstellen, um die Verarbeitung abzuwarten
        const pdfPromise = new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", pdfData => {
            console.log(JSON.stringify(pdfData, undefined, 2));
            console.log(pdfParser.getRawTextContent());
            resolve(pdfData);
          });
        });

        pdfParser.parseBuffer(Buffer.from(pdfBuffer));

        // Warten auf PDF zu JSON Konversion
        await pdfPromise;

        const content = pdfParser.getRawTextContent();

        console.log(content);

        const embedding = await this.createEmbedding(content);

        await this.milvus.upsert({
          collection_name: "rag_data",
          data: [{
            name,
            embed: embedding,
            updated_timestamp: Date.now(),
          }],
        });

        await this.loadCollection();

        let existingData = {};
        if (fs.existsSync(this.jsonPath)) {
          existingData = JSON.parse(fs.readFileSync(this.jsonPath, 'utf8'));
        }

        // Aktualisiere Daten
        existingData[name] = content;
        fs.writeFileSync(this.jsonPath, JSON.stringify(existingData, null, 2));

        console.log('Documents file has been updated.');
      } catch (error) {
        throw new Error(`Error downloading or parsing PDF: ${error}`);
      }
    }
  }

  async deleteDocument(name) {
    const res = await this.milvus.delete({
      collection_name: "rag_data",
      filter: `name in ['${name}']`,
    });

    let existingData = {};
    if (fs.existsSync(this.jsonPath)) {
      existingData = JSON.parse(fs.readFileSync(this.jsonPath, 'utf8'));
      delete existingData[name];
      fs.writeFileSync(this.jsonPath, JSON.stringify(existingData, null, 2));
    }

    return res;
  }

  async listDocuments() {
    const res = await this.milvus.get({
      collection_name: "rag_data",
      limit: 100,
    });

    return res;
  }

  async search(embedding) {
    const res = await this.milvus.search({
      collection_name: "rag_data",
      data: embedding,
      limit: 4,
      params: { nprobe: 64 },
      output_fields: ['name', 'embed'],
    });

    return res;
  }

  async answerQuestion(prompt, document, history = []) {
    const readData = fs.readFileSync(this.jsonPath, 'utf8');
    const documents = JSON.parse(readData);
    console.log("Request ollama...")
    let answer = "";
    const chat = await this.ollama.chat({
      model: 'llama3-chatqa',
      keep_alive: 60000,
      messages: [
        {
          role: "system",
          content: `You are a support bot which should help the user on specific requests.
          You're always polite and you're always answering in the language in which the user writes.
          You are only allowed to use the following information to answer the request: ${documents[document]}.
          Format the response using markdown and use not more than 2000 characters.`
        },
        {
          role: "user",
          content: prompt,
        }
      ],
      stream: true,
    });
    for await (const part of chat) {
      answer += part.message.content;
      //process.stdout.write(part.message.content);
    }
    console.log("Request done.");
    return answer;
  }
};

module.exports = RAG;