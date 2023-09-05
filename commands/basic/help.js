import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get information on how voting!"),
  async execute(interaction) {
    await interaction.reply(
      "Here are the basic information to help you get started with the app!"
    );
  },
};
