const Discord = require('discord.js');
const fs = require('fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const config = {
  prefix: "!",
  server_id: process.env['server_id'],
  token: process.env['discord_token'],
};

const bot = new Discord.Client();
bot.commands = new Discord.Collection();

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  bot.commands.set(command.name, command);

  if (command.alias && command.alias.length > 0) {
    for (const a in command.alias) {
      bot.commands.set(command.alias[a], command);
    }
  }
}

bot.on('ready', () => {
    console.log('This Oracle of War is recognizant');
});

bot.on('message', msg => {
  // Exit when incoming message does not start with specifed prefix or is sent by the bot
  if (!msg.content.startsWith(config.prefix) || msg.author.bot) return;

  // Remove Prefix and create Array with each of the arguments
  let cmdString = msg.content.substring(config.prefix.length);
  let args = cmdString.toLowerCase().split(/ +/);
  let [command, ...params] = args;

  // Exit if the command doesn't exist
  if (!bot.commands.has(command)) return;

  // Execute the command
  bot.commands.get(command).execute(msg, params);
});

bot.login(config.token)
    .then(console.log("Bot Login"))
    .catch(error => console.log("Error:", error));

// Add express server that I can ping with uptimebot
require('./server.js');
