"""Спокойная фоновая музыка для видео «Память»: струнный пэд, фортепиано, бас, зал. Синтез с нуля — без чужих прав."""
import numpy as np
import wave

SR, DUR = 44100, 166.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

CH = {  # аккорд: (бас, тело пэда, ноты фортепиано)
    'Dm': (38, [50, 57, 62, 65, 69], [74, 77, 81, 76, 69]),
    'Bb': (34, [46, 53, 62, 65, 70], [74, 77, 82, 72, 70]),
    'F':  (41, [53, 60, 65, 69, 72], [77, 81, 84, 79, 72]),
    'C':  (36, [48, 55, 64, 67, 72], [76, 79, 84, 74, 72]),
    'Gm': (43, [50, 55, 58, 62, 67], [74, 79, 82, 77, 70]),
}
PROG = ('Dm Bb F C Dm Bb F C Gm Bb F C Dm Bb F C Gm Bb Dm C Dm Bb F C Gm C F').split()
BAR = 6.0


def env(n, a, r):
    e = np.ones(n)
    ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.sin(np.linspace(0, np.pi / 2, ai)) ** 2
    e[-ri:] *= np.cos(np.linspace(0, np.pi / 2, ri)) ** 2
    return e


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR); j = min(N, i + len(sig)); sig = sig[:j - i] * gain
    L[i:j] += sig * np.sqrt(0.5 * (1 - pan)); R[i:j] += sig * np.sqrt(0.5 * (1 + pan))


def section_gain(t):
    """Громкость партий по разделам фильма."""
    return dict(
        pad=0.8 if t < 123 else 1.0,
        bass=0.0 if t < 19 else (0.6 if t < 123 else 0.9),
        piano=0.0 if t < 19 else (0.55 if t < 42 else (0.8 if t < 150 else 0.6)),
    )


# пэд: мягкие «струнные» из синусов с расстройкой и медленным вибрато
for i, name in enumerate(PROG):
    bass, body, _ = CH[name]
    st = i * BAR - 1.2
    n = int((BAR + 3.2) * SR)
    tt = np.arange(n) / SR
    g = section_gain(i * BAR)
    e = env(n, 2.2, 2.6)
    for k, m in enumerate(body):
        for d, pan in ((-7, -0.5), (0, 0.0), (7, 0.5)):
            f = hz(m) * 2 ** (d / 1200)
            vib = 1 + 0.0025 * np.sin(2 * np.pi * (4.6 + 0.3 * k) * tt + k)
            ph = 2 * np.pi * f * np.cumsum(vib) / SR
            s = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
            add(s * e, max(st, 0), pan, 0.022 * g['pad'] * (1.1 - 0.12 * k))
    if g['bass']:
        nb = int((BAR + 1.5) * SR); tb = np.arange(nb) / SR
        s = np.sin(2 * np.pi * hz(bass) * tb) + 0.25 * np.sin(4 * np.pi * hz(bass) * tb)
        add(s * env(nb, 1.0, 1.8), i * BAR, 0, 0.07 * g['bass'])

# фортепиано: затухающие гармоники, лёгкая негармоничность
def piano(m, vel, length=4.5):
    n = int(length * SR); tt = np.arange(n) / SR; f = hz(m); s = np.zeros(n)
    for k in range(1, 8):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        s += np.sin(2 * np.pi * fk * tt) * (1 / k ** 1.6) * np.exp(-tt * (0.9 + 0.55 * k))
    att = np.minimum(1, tt / 0.004)
    return s * att * vel


for i, name in enumerate(PROG):
    _, _, notes = CH[name]
    t0 = i * BAR
    g = section_gain(t0)['piano']
    if not g:
        continue
    if t0 < 42 or t0 >= 150:
        times = [0, 1.5, 3.0, 4.5] if t0 < 150 else [0, 0.18, 0.36, 0.54, 2.2]
    else:
        times = [x * 0.75 for x in range(8)]
    for j, dt in enumerate(times):
        m = notes[j % len(notes)]
        vel = (0.85 if j % 4 == 0 else 0.6) * (0.9 + 0.2 * rng.random())
        add(piano(m, vel), t0 + dt + 0.012 * rng.standard_normal(), 0.25 * np.sin(j), 0.10 * g)

# зал: свёртка с затухающим шумом (стерео)
def reverb(x, seed, secs=3.2):
    r = np.random.default_rng(seed); n = int(secs * SR); tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 2.3)
    ir = np.convolve(ir, np.ones(12) / 12, mode='same')  # смягчаем верха
    ir[0] = 0; ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return y


wet = 0.55
L2 = L * (1 - wet * .5) + reverb(L, 1) * wet
R2 = R * (1 - wet * .5) + reverb(R, 2) * wet
mx = max(np.abs(L2).max(), np.abs(R2).max())
fade = np.ones(N); fi = int(3 * SR); fo = int(7 * SR)
fade[:fi] = np.linspace(0, 1, fi) ** 2
end = int(162 * SR); fade[end - fo:end] = np.linspace(1, 0, fo) ** 1.5; fade[end:] = 0
out = np.stack([L2, R2], 1) * fade[:, None] / mx * 0.89
pcm = (out[:end] * 32767).astype(np.int16)
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music.wav', pcm.shape[0] / SR, 's')
