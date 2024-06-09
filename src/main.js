require('dotenv').config();
const { Client, Events, IntentsBitField, Collection, Partials, GatewayIntentBits } = require('discord.js');
const RAG = require("./rag");
const registerCommands = require('./registerCommands');
const loadCommands = require('./loadCommands');
const chat = require('./events/chat');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildScheduledEvents,
    IntentsBitField.Flags.GuildModeration,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.DirectMessageReactions,
    IntentsBitField.Flags.DirectMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ]
});

client.commands = new Collection();
const rag = new RAG();

client.once(Events.ClientReady, readyClient => {
  rag.init()
    .then(() => {
      loadCommands(client);
      registerCommands(client);
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
});

client.login(process.env.BOT_TOKEN);

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction, rag);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  else if (message.channel.type !== "dm") return;
  chat(message, rag);
});
