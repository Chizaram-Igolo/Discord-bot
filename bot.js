// Require the necessary discord.js classes
import * as fs from "fs";
import * as path from "node:path";

// For getting the the value of `__dirname` in
// ES6 module.
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";

import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";

// So that we can use `require` in an assignment statement.
import { createRequire } from "module";
// const require2 = createRequire(import.meta.url);

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

//To allow us access commands in other files
client.commands = new Collection();

const commands = [];
// Grab all the command files from the commands directory you created earlier

// We have to get `__dirname` this way because `__dirname` is not
// available in an ES module scope.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const foldersPath = path.join(__dirname, "commands");

const commandFolders = fs.readdirSync(foldersPath);

(async () => {
  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);

      const command = await import(pathToFileURL(filePath).pathname);

      if ("data" in command.default && "execute" in command.default) {
        //This helps to set this command. Else the bot will not be able to respond
        const commandName = command.default.data.name;

        client.commands.set(commandName, command);

        commands.push(command.default.execute);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }

  // When the client is ready, run this code (only once)
  // We use 'c' for the event parameter to keep it separate from the already defined 'client'
  client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });

  //Add the listener to all bot slash commands
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  });
})();

// Log in to Discord with your client's token
client.login(config.token);
