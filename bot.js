const Telegraf = require('telegraf')
const mongo = require('mongodb').MongoClient
const axios = require('axios')
const fs = require('fs')
const data = require('./data')
const countries = require('./countries')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage
const stage = new Stage()
const bot = new Telegraf(process.env.BOT_TOKEN)

// Register scenes
const scanQR = new Scene('scanQR')
stage.register(scanQR)
const generate = new Scene('generate')
stage.register(generate)
const scanBarcode = new Scene('scanBarcode')
stage.register(scanBarcode)

// Connect to MongoDB
mongo.connect(process.env.MONGO_LINK, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    sendError(err)
  }

  db = client.db('oneqrbot')
  bot.startPolling()
})

// Use session and stage middleware
bot.use(session())
bot.use(stage.middleware())

// Start command
bot.start((ctx) => {
  starter(ctx)
})

// Handle menu options
bot.hears('🔍 Scan QR Code', (ctx) => {
  ctx.scene.enter('scanQR')
})

bot.hears('🖊 Generate QR Code', (ctx) => {
  ctx.scene.enter('generate')
})

bot.hears('🔍 Scan Barcode', (ctx) => {
  ctx.scene.enter('scanBarcode')
})

bot.hears('📁 Source code', (ctx) => {
  ctx.reply(
    'You can see code of this bot on GitHub. Thanks for stars!',
    { reply_markup: { inline_keyboard: [[{text: '🔗 GitHub', url: 'https://github.com/Khuzha/oneqrbot'}]] } }
  )
})

scanBarcode.enter((ctx) => {
  ctx.reply(
    'I`m ready. Send a picture!', 
    { reply_markup: { keyboard: [['⬅️ Back']], resize_keyboard: true } }
  )
})

bot.command('share', async (ctx) => {
  // Get the user's chat ID
  const chatId = ctx.message.chat.id;

  // Get the user's most recent scanned QR code or barcode from the database
  const recentScan = await db.collection('scans').findOne({ chatId });

  // Check if the user has a recent scan to share
  if (recentScan) {
    // Ask the user to enter the chat ID of the user they want to share the scan with
    ctx.reply('Please enter the chat ID of the user you want to share your scan with:');

    // Listen for the user's response
    bot.on('text', async (ctx) => {
      // Get the target chat ID from the user's message
      const targetChatId = ctx.message.text;

      // Share the scan with the target user
      await bot.telegram.sendMessage(targetChatId, `Scan shared by ${chatId}: ${recentScan.data}`);

      // Let the user know that the scan was shared successfully
      ctx.reply('Scan shared successfully!');
    });
  } else {
    // Let the user know that they don't have a recent scan to share
    ctx.reply('You don't have a recent scan to share.');
  }
});

