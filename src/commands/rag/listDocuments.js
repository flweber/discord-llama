const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all documents from database'),
  async execute(interaction, RAG) {
    const response = await interaction.deferReply({ ephemeral: true });

    const res = await RAG.listDocuments();

    await interaction.editReply({
      ephemeral: true, content: `Max. of 100 documents:\n\n\`\`\`javascript\n${JSON.stringify(res, undefined, 2)}\n\`\`\``
    });
  },
};