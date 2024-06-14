# Discord LLama

A Discord RAG (Retrieval Augmented Generation) implementation with ollama and chromadb

## Installation instructions

1. Download and install Node.js in version 20 from their [website](https://nodejs.org/en/download/prebuilt-installer)
2. Choose an option to install `yarn` from their [website](https://yarnpkg.com/getting-started/install)
3. Now open a terminal of your choice in the top directory of the project
4. Execute the command `yarn install -D --frozen-lockfile`
5. [Create a Discord Bot](#create-a-discord-bot-and-get-the-id-and-token) and then create a `.env` file in the project directory and set the required values from [Configuration](#configuration)
7. When you're configuration is done you can run the application with `yarn start`

## Configuration

| Environment Variable | Description | Required | Example | Default |
|---|---|---|---|---|
| CLIENT_ID | The client id from the discord application | X | 1234567890 | |
| BOT_TOKEN | The bot token from the discord application | X | xabf7s6vas | |
| DC_OLLAMA_HOST | The address on which ollama is reachable | X | http://10.10.132.178:8090 | |
| CHROMA_HOST | The address to the chromadb |  | http://10.10.132.178:8000 | http://127.0.0.1:8000 |
| DB_BACKEND | The database should be used (currently only chromadb) |  | chromadb | chromadb |

## Create a discord bot and get the id and token

For this you need a Discord account with 2FA enabled.

1. Head over to the discord [developer portal](https://discord.com/developers/applications)
2. Click on "New Application" and follow the steps
3. Copy the Application ID from the "General Information" (this is also your client id) and fill it out in your `.env`
4. Click on "Bot" in the left sidebar
5. Set a username for your bot and select "Reset token" to get a Bot token and fill it out in you `.env`
6. Select if your bot should be a public bot or not
7. Turn on the three options under "Privileged Gateway Intents"
8. After that head over to "Installation" then tick "Guild Install"
9. Under Install link choose the option "Discord Provided Link"
10. For "Default Install Settings" select `applications.commands` and `bot`
11. For permissions it's your choice if you want it easy then select `dministrator`
12. Copy the generated link and open it to invite the bot to a server
