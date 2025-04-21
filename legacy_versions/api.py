from subprocess import run, Popen
from moviepy import VideoFileClip
import requests
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

"""
Telegram Bot
"""
token = '7101554325:AAF-vNJNnjvFgO2s6BYfGLOhAfhifeMcnRY'
user = '@sorendev_bot'
id = 7065839155

################
### COMMANDS ###
################
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('start response')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('help response')

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text('custom response')

#################
### RESPONSES ###
#################
async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    pid = run(["pidof", "led-image-viewer"], capture_output=True)
    if pid.stdout != b'':
        run(["kill", "-9", str(int(pid.stdout))], capture_output=True)
    else:
        pid = run(["pidof", "text-scroller"], capture_output=True)
        run(["kill", "-9", str(int(pid.stdout))], capture_output=True)

    message_type: str = update.message.chat.type
    text: str = str(update.message.text)
    
    #print(f'User ({update.message.chat.id}) in {message_type}: "{text}"')

    Popen(["/home/soren/matrix/rpi-rgb-led-matrix/utils/text-scroller", "-y5", "--led-rows=32", "--led-cols=64", "-f", "/home/soren/matrix/rpi-rgb-led-matrix/fonts/9x18.bdf", text])

    await update.message.reply_text("Text displayed successfully.")

async def handle_image(update: Update, context: ContextTypes.DEFAULT_TYPE):
    pid = run(["pidof", "led-image-viewer"], capture_output=True)
    if pid.stdout != b'':
        run(["kill", "-9", str(int(pid.stdout))], capture_output=True)
    else:
        pid = run(["pidof", "text-scroller"], capture_output=True)
        run(["kill", "-9", str(int(pid.stdout))], capture_output=True)

    file = await context.bot.getFile(update.message.photo[-1].file_id)
    await update.message.reply_text("Image received. Initiating processing...")
    await file.download_to_drive("/home/soren/matrix/img/download.jpg")
    
    Popen(["/home/soren/matrix/rpi-rgb-led-matrix/utils/led-image-viewer", "-C", "--led-rows=32", "--led-cols=64", "--led-swap-green-blue", "/home/soren/matrix/img/download.jpg"])
    await update.message.reply_text("Image displayed successfully.")

async def handle_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    pid = run(["pidof", "led-image-viewer"], capture_output=True)
    if pid.stdout != b'':
        run(["kill", "-9", str(int(pid.stdout))], capture_output=True)
    else:
        pid = run(["pidof", "text-scroller"], capture_output=True)
        run(["kill", "-9", str(int(pid.stdout))], capture_output=True)

    if (update.message.animation != None):
        file = await context.bot.getFile(update.message.animation.file_id)
    else:
        file = await context.bot.getFile(update.message.video.file_id)     
    await update.message.reply_text("Video received. Initiating processing...")
    await file.download_to_drive("/home/soren/matrix/img/download.mp4")

    videoClip = VideoFileClip("/home/soren/matrix/img/download.mp4")
    videoClip.write_gif("/home/soren/matrix/img/download.gif")

    Popen(["/home/soren/matrix/rpi-rgb-led-matrix/utils/led-image-viewer", "-C", "--led-rows=32", "--led-cols=64", "--led-swap-green-blue", "--led-slowdown-gpio=1", "/home/soren/matrix/img/download.gif"])
    await update.message.reply_text("Video displayed successfully.")

async def error(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print(f'Update {update} caused error {context.error}')

'''
SCRIPT
'''
if __name__ == '__main__':
    print('Initializing system...')
    init_text = "Initializing system..."
    url = f"https://api.telegram.org/bot{token}/sendMessage?chat_id={id}&text={init_text}"
    print(requests.get(url).json())
    print("PLEASE WORK PLEASE WORK PLEASE WORK")
    Popen(["/home/soren/matrix/rpi-rgb-led-matrix/utils/led-image-viewer", "-C", "--led-rows=32", "--led-cols=64", "--led-swap-green-blue", "/home/soren/matrix/img/demos/profpic.png"])
    print('Loaded idle display.\nLaunching Telegram bot...')

    ##########################
    ### Telegram API Setup ###
    ##########################
    app = Application.builder().token(token).build()
    
    # Commands
    app.add_handler(CommandHandler('start',start_command))
    app.add_handler(CommandHandler('help',help_command))
    app.add_handler(CommandHandler('custom',custom_command))

    # Messages
    app.add_handler(MessageHandler(filters.TEXT, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_image))
    app.add_handler(MessageHandler(filters.ANIMATION, handle_video))
    app.add_handler(MessageHandler(filters.VIDEO, handle_video))

    # Errors
    app.add_error_handler(error)

    # Polls the bot
    print('Bot initialized, now polling...')
    init_text = "System initialized successfully."
    url = f"https://api.telegram.org/bot{token}/sendMessage?chat_id={id}&text={init_text}"
    print(requests.get(url).json())
    app.run_polling(poll_interval=3)