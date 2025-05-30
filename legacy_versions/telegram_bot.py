# pip install python-telegram-bot

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

token = '7101554325:AAF-vNJNnjvFgO2s6BYfGLOhAfhifeMcnRY'
user = '@sorendev_bot'

'''
COMMANDS
'''
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('start response')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('help response')

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('custom response')

'''
RESPONSES
'''

def handle_response(text: str):
    processed: str = text.lower()

    if 'hello' in processed:
        return 'hello response'
    
    if 'misc' in processed:
        return 'misc response'
    
    return 'no valid command'

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message_type: str = update.message.chat.type
    text: str = update.message.text
    
    print(f'User ({update.message.chat.id}) in {message_type}: "{text}"')

    if message_type == 'group':
        if user in text:
            new_text: str = text.replace(user, '').strip()
            response: str = handle_response(new_text)
        else:
            return
    else:
        response: str = handle_response(text)

    print('Bot:', response)
    await update.message.reply_text(response)

async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f'Update {update} caused error {context.error}')

'''
SCRIPT
'''

if __name__ == '__main__':
    print('Starting bot...')
    app = Application.builder().token(token).build()

    # Commands
    app.add_handler(CommandHandler('start',start_command))
    app.add_handler(CommandHandler('help',help_command))
    app.add_handler(CommandHandler('custom',custom_command))

    # Messages
    app.add_handler(MessageHandler(filters.TEXT, handle_message))

    # Errors
    app.add_error_handler(error)

    # Polls the bot
    print('Bot initialized, now polling...')
    app.run_polling(poll_interval=3)