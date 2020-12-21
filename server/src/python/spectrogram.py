import matplotlib.pyplot as plt
import numpy as np
import librosa
import librosa.display
import warnings
import sys

warnings.filterwarnings("ignore")
print(sys.argv)
filename = sys.argv[1]
artist_title = filename[:-4]
channel_layout = sys.argv[2]
channel_str = sys.argv[3]
channel_int = int(channel_str)

channel_side = 'left'
if channel_int == 1:
    channel_side = 'right'

mono = True
if channel_layout == 'stereo':
    mono = False

img_filename = artist_title + ' - ' + channel_layout + ' - ' + channel_side + '.png'
if channel_layout != 'stereo':
    img_filename = artist_title + ' - mono' + '.png'

print('Loading ' +  filename + '...')
y, sr = librosa.load(filename, mono=mono)
print(filename + ' loaded!')

y_channel = y
if channel_layout == 'stereo':
    y_channel = y[channel_int]

fig = plt.Figure()
ax = fig.add_subplot()
ax.set_axis_off()

S = librosa.feature.melspectrogram(y=y_channel, sr=sr, fmax=8000)
S_dB = librosa.power_to_db(S, ref=np.max)
librosa.display.specshow(S_dB,sr=sr, ax=ax, y_axis='mel', x_axis='time')

fig.savefig(img_filename, bbox_inches='tight', transparent=False, pad_inches=0.0)
print(img_filename + ' saved!')
