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
    { reply_markup: { inline_keyboard
