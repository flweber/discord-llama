const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('del')
    .setDescription('Deletes a document from the data collection')
    .addStringOption(option => option
      .setName("document")
      .setDescription("The pdf filename you want to delete")
      .setRequired(true)
    ),
  async execute(interaction, RAG) {
    const response = await interaction.deferReply({ ephemeral: true });

    const document = interaction.options.getString("document");

    const res = await RAG.deleteDocument(document);

    await interaction.editReply({
      ephemeral: true, content: `\`\`\`javascript\n${JSON.stringify(res, undefined, 2)}\n\`\`\``
    });
  },
};