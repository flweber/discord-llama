const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a pd document to the RAG Bot')
    .addAttachmentOption(option => option
      .setName("document")
      .setDescription("The pdf file you want to add")
      .setRequired(true)
    ),
  async execute(interaction, RAG) {
    const response = await interaction.deferReply({ ephemeral: true });

    const attachment = interaction.options.getAttachment("document");

    if (attachment.contentType.toLowerCase() !== "application/pdf") {
      await interaction.editReply({ ephemeral: true, content: "It seems your document is not a pdf file." });
      return;
    }

    await RAG.addDocument(attachment.name, attachment.url);

    await interaction.editReply({
      ephemeral: true, content: `Added document ${attachment.name}`
    });
  },
};