import matplotlib.pyplot as plt
import numpy as np
import librosa
import librosa.display
import warnings
import sys
import os

warnings.filterwarnings("ignore")
# print(sys.argv)
file_name = sys.argv[1]
file_path = sys.argv[2]
artist_title = file_name[:-4]
channel_layout = sys.argv[3]
channel_str = sys.argv[4]
channel_int = int(channel_str)

channel_side = 'left'
if channel_int == 1:
    channel_side = 'right'

mono = True
if channel_layout == 'stereo':
    mono = False

img_file_name = artist_title + ' - ' + channel_layout + ' - ' + channel_side + '.png'
if channel_layout != 'stereo':
    img_file_name = artist_title + ' - mono' + '.png'

print('Loading ' +  file_name + '...')
y, sr = librosa.load(file_path, mono=mono)
print(file_name + ' loaded!')

y_channel = y
if channel_layout == 'stereo':
    y_channel = y[channel_int]

fig = plt.Figure()
ax = fig.add_subplot()
ax.set_axis_off()

S = librosa.feature.melspectrogram(y=y_channel, sr=sr, fmax=8000)
S_dB = librosa.power_to_db(S, ref=np.max)
librosa.display.specshow(S_dB,sr=sr, ax=ax, y_axis='mel', x_axis='time')

images_path = os.path.abspath('../server/src/spectrogram-images/')
saved_image_path = images_path + '/' + img_file_name
fig.savefig(saved_image_path, bbox_inches='tight', transparent=False, pad_inches=0.0)
print(img_file_name + ' saved at ' + saved_image_path)
