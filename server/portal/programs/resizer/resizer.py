from PIL import Image as image
import numpy as np
import os
import glob
from pathlib import Path
import cv2 as cv
import argparse

def resize(img):
    width = len(img[0])
    height = len(img)
    height_new = int(width / 2)

    if height_new < height:
        height_diff = height - height_new
        offset = int(height_diff / 2)
        img = img[offset:height_new+offset]
    else:
        width_new = int(height * 2)
        width_diff = width - width_new
        offset = int(width_diff / 2)

        img_new = []
        for i,row in enumerate(img):
            img_new.append(img[i][offset:width_new+offset])
        img = np.asarray(img_new, dtype=np.uint8)

    return img

'''
Main
'''
parser = argparse.ArgumentParser(description="Resizes images and animations")
# Define expected arguments
parser.add_argument('device', help="Device name")
# Parse them
args = parser.parse_args()
device = args.device

cwd = '/home/soren-gabor/Desktop/portal'
path = Path(cwd)

# Check if uploaded file is an image or GIF
for filename in os.listdir(f'{cwd}/uploads/{device}'):
    # Handle images
    if (filename[-3:].lower() == 'jpg') or (filename[-3:].lower() == 'png') or (filename[-4:].lower() == 'jpeg') or (filename[-4:].lower() == 'heif'):
        img = cv.imread(f'{cwd}/uploads/{device}/{filename}', cv.IMREAD_COLOR)
        resized_img = resize(img)
        cv.imwrite(f'{cwd}/uploads/{device}/{filename}',resized_img)

    # Handle GIFs
    elif (filename[-3:].lower() == 'gif'):
        # Delete old frames
        files = glob.glob(f'{cwd}/programs/resizer/frames/*')
        for f in files:
            os.remove(f)

        # Save GIF as individual frames
        with image.open(f'{cwd}/uploads/{device}/{filename}') as img:
            frame = 0
            while True:
                frame_path = os.path.join(f'{cwd}/programs/resizer/frames', f"frame_{frame:03d}.png")
                img.save(frame_path, format="PNG")
                frame += 1
                try:
                    img.seek(frame)  # Move to the next frame
                except EOFError:
                    break  # Exit loop when no more frames
        
        # Resize saved frames
        for frame in os.listdir(f'{cwd}/programs/resizer/frames'):
            img = cv.imread(f'{cwd}/programs/resizer/frames/{frame}', cv.IMREAD_COLOR)
            resized_img = resize(img)
            cv.imwrite(f'{cwd}/programs/resizer/frames/{frame}',resized_img)

        # Convert resized frames to GIF
        frames = []
        for filename in sorted(glob.glob(f'{cwd}/programs/resizer/frames/*.png')):
            frames.append(image.open(filename))
        
        frames[0].save(f'{cwd}/uploads/{device}/{device}_image.gif', save_all=True, append_images=frames[1:], optimize=False, duration=100, loop=0)