"""Музыка v3: спокойный монотонный эмбиент. Ни одной отдельной ноты и удара —
только тянущиеся тёплые аккорды, низкая основа на «ре», мягкий «воздух» и длинный тёмный зал."""
import numpy as np
import wave
from scipy.signal import butter, sosfilt, sosfilt_zi

SR, END = 44100, 115.0
N = int(SR * END)
t_all = np.arange(N) / SR
rng = np.random.default_rng(21)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def saw(f, n, ph0):
    """Пила без алиасинга (PolyBLEP)."""
    dt = f / SR
    p = (ph0 + dt * np.arange(n)) % 1.0
    s = 2 * p - 1
    a = p < dt; x = p[a] / dt; s[a] -= x + x - x * x - 1
    b = p > 1 - dt; x = (p[b] - 1) / dt; s[b] -= x * x + x + x + 1
    return s


def sweep_lowpass(x, cutoff, order=4, block=1024):
    """Фильтр с медленно плывущей частотой среза (cutoff — массив на каждый отсчёт)."""
    out = np.zeros_like(x); zi = None
    for i in range(0, len(x), block):
        sos = butter(order, min(cutoff[i], SR * .45), btype='low', fs=SR, output='sos')
        if zi is None: zi = sosfilt_zi(sos) * x[0]
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return out


def env_window(n, a, r):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.sin(np.linspace(0, np.pi / 2, ai)) ** 2
    e[-ri:] *= np.cos(np.linspace(0, np.pi / 2, ri)) ** 2
    return e


L = np.zeros(N); R = np.zeros(N)

# 1. основа: «ре» и «ля» тянутся через весь фильм
for m, g in ((38, .26), (45, .2), (50, .15)):
    for d in (-7, -2, 3, 8):
        f = hz(m) * 2 ** (d / 1200)
        s = saw(f, N, rng.random())
        pan = d / 12
        L += s * g * np.sqrt(.5 * (1 - pan)); R += s * g * np.sqrt(.5 * (1 + pan))
cut = 300 + 120 * np.sin(2 * np.pi * t_all / 37)
L = sweep_lowpass(L, cut); R = sweep_lowpass(R, cut)

# 2. аккорды — очень медленно, с длинными наплывами
CHORDS = [[50, 53, 57, 64], [46, 50, 53, 57], [53, 57, 60, 67], [48, 55, 62, 64],
          [50, 53, 57, 64], [46, 53, 57, 62], [55, 58, 62, 65], [50, 57, 62, 64]]
SEG = END / len(CHORDS)
padL = np.zeros(N); padR = np.zeros(N)
for i, ch in enumerate(CHORDS):
    st = max(0, i * SEG - 4); en = min(END, (i + 1) * SEG + 5)
    a, b = int(st * SR), int(en * SR); n = b - a
    e = env_window(n, 5.5 if i else 7, 6)
    for m in ch:
        for d in (-9, -3, 4, 10):
            pan = d / 13
            s = saw(hz(m) * 2 ** (d / 1200), n, rng.random()) * e * .2
            padL[a:b] += s * np.sqrt(.5 * (1 - pan)); padR[a:b] += s * np.sqrt(.5 * (1 + pan))
# фильтр «дышит» и чуть раскрывается к названию и к финалу
lift = np.exp(-((t_all - 28) / 6) ** 2) + np.exp(-((t_all - 99) / 9) ** 2)
pcut = 680 + 300 * np.sin(2 * np.pi * t_all / 23) ** 2 + 520 * lift
padL = sweep_lowpass(padL, pcut); padR = sweep_lowpass(padR, pcut)
L += padL; R += padR

# 3. воздух: тихий розовый шум в полосе голоса, медленно дышит
def pink(n):
    w = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); f[0] = 1
    return np.fft.irfft(w / np.sqrt(f), n)
air_sos = butter(2, [350, 1800], btype='band', fs=SR, output='sos')
for ch in (0, 1):
    a = sosfilt(air_sos, pink(N)); a /= np.abs(a).max()
    a *= .05 * (0.6 + 0.4 * np.sin(2 * np.pi * t_all / 17 + ch * 1.3))
    if ch == 0: L += a
    else: R += a

# 4. длинный тёмный зал
def reverb(x, seed, secs=4.5):
    r = np.random.default_rng(seed); n = int(secs * SR); tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 1.5)
    ir = sosfilt(butter(2, 2200, fs=SR, output='sos'), ir); ir[:int(.02 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
L2 = L * .7 + reverb(L, 1) * .55; R2 = R * .7 + reverb(R, 2) * .55

# общая динамика: тихий вход, мягкие подъёмы, долгий уход
dyn = (0.55 + 0.45 * np.clip(t_all / 10, 0, 1)) * (1 + .18 * lift)
dyn *= np.clip(t_all / 3, 0, 1) ** 2
dyn *= np.clip((END - t_all) / 7, 0, 1) ** 1.5
out = np.stack([L2 * dyn, R2 * dyn], 1)
out = sosfilt(butter(2, 30, btype='high', fs=SR, output='sos'), out, axis=0)
out = out / np.abs(out).max() * .89
with wave.open('music3.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('music3.wav', END)
