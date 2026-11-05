"""Музыка v2: тёплая и живая, без звона. Мягкое «войлочное» фортепиано в среднем регистре,
лёгкий пульс 80 уд/мин, бас, пэд, короткий тёмный зал."""
import numpy as np
import wave

SR, END = 44100, 132.0
N = int(SR * (END + 3))
rng = np.random.default_rng(5)
L = np.zeros(N); R = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
BEAT, BAR = 0.75, 6.0   # 80 уд/мин; аккорд — два такта

CH = {  # бас, пэд, ноты арпеджио (средний регистр)
    'Dm': (38, [50, 57, 62, 65], [62, 65, 69, 74, 69, 65]),
    'Bb': (34, [46, 53, 58, 62], [58, 62, 65, 70, 65, 62]),
    'F':  (41, [53, 57, 60, 65], [60, 65, 69, 72, 69, 65]),
    'C':  (36, [48, 55, 60, 64], [60, 64, 67, 72, 67, 64]),
    'Gm': (43, [55, 58, 62, 67], [58, 62, 67, 70, 67, 62]),
}
PROG = 'Dm Bb F C Dm Bb F C Gm Bb F C Dm Bb F C Gm Bb Dm C Bb F'.split()


def part(t):
    """Что играет в момент t (по сценам фильма)."""
    if t < 6: return dict(pad=.7, piano=0, rate=0, pulse=0, bass=0)
    if t < 27.5: return dict(pad=.8, piano=.7, rate=2, pulse=0, bass=0)          # вступление: половинные
    if t < 33: return dict(pad=1.0, piano=.8, rate=1, pulse=0, bass=.6)          # название: четверти
    if t < 98.5: return dict(pad=.85, piano=.75, rate=.5, pulse=1, bass=1)       # приложение: восьмые и пульс
    if t < 107: return dict(pad=.9, piano=.7, rate=1, pulse=.5, bass=.8)         # Даймище
    if t < 123: return dict(pad=1.0, piano=.85, rate=.5, pulse=1, bass=1)        # страна
    return dict(pad=.9, piano=.6, rate=2, pulse=0, bass=.6)                      # финал


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); s = sig[:j - i] * gain
    L[i:j] += s * np.sqrt(.5 * (1 - pan)); R[i:j] += s * np.sqrt(.5 * (1 + pan))


def env(n, a, r):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.sin(np.linspace(0, np.pi / 2, ai)) ** 2
    e[-ri:] *= np.cos(np.linspace(0, np.pi / 2, ri)) ** 2
    return e


def felt_piano(m, vel, length=3.2):
    """Приглушённое фортепиано: мало верхних призвуков, они гаснут быстро."""
    n = int(length * SR); tt = np.arange(n) / SR; f = hz(m)
    amps = [1, .38, .14, .05, .018]
    s = sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (1.4 + 1.9 * (k - 1))) for k, a in enumerate(amps, 1))
    s *= np.minimum(1, tt / .009)                     # мягкий удар молоточка
    s *= np.exp(-tt * (.6 + (m - 55) * .03))          # высокие ноты короче
    s[-int(.3 * SR):] *= np.linspace(1, 0, int(.3 * SR))
    return s * vel


def kick():
    n = int(.45 * SR); tt = np.arange(n) / SR
    f = 46 + 34 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8) * np.minimum(1, tt / .004)


def bass_pluck(m, length=1.4):
    n = int(length * SR); tt = np.arange(n) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * tt) + .18 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 6)
    return s * np.exp(-tt * 2.2) * np.minimum(1, tt / .012)


K = kick()
for i, name in enumerate(PROG):
    bass, pad, arp = CH[name]
    t0 = i * BAR
    p = part(t0 + .01)
    # пэд
    n = int((BAR + 2.6) * SR); tt = np.arange(n) / SR; e = env(n, 1.8, 2.2)
    for k, m in enumerate(pad):
        for d, pan in ((-5, -.45), (5, .45)):
            ph = 2 * np.pi * hz(m) * 2 ** (d / 1200) * tt + k
            add((np.sin(ph) + .12 * np.sin(2 * ph)) * e, max(t0 - 1.0, 0), pan, .018 * p['pad'])
    # по долям
    for b in range(int(BAR / BEAT * 2)):            # восьмые
        tb = t0 + b * BEAT / 2
        q = part(tb)
        if q['piano'] and q['rate'] and (b * .5) % q['rate'] == 0:
            m = arp[(b if q['rate'] == .5 else int(b * .5 / q['rate'])) % len(arp)]
            acc = 1.0 if b % 4 == 0 else (.78 if b % 2 == 0 else .62)
            add(felt_piano(m, acc * (.92 + .16 * rng.random())), tb + .006 * rng.standard_normal(), .3 * np.sin(b * 1.7), .16 * q['piano'])
        if q['pulse'] and b % 4 == 0:              # пульс на 1 и 3
            add(K, tb, 0, .2 * q['pulse'] * (1 if b % 8 == 0 else .8))
        if q['bass'] and b % 8 in (0, 5):          # бас: «раз» и синкопа
            add(bass_pluck(bass + 12 if bass < 40 else bass), tb, 0, .11 * q['bass'] * (1 if b % 8 == 0 else .7))

# короткий тёмный зал
def reverb(x, seed, secs=1.9):
    r = np.random.default_rng(seed); n = int(secs * SR); tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 3.2)
    ir = np.convolve(ir, np.ones(48) / 48, mode='same'); ir[:int(.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]


wet = .28
L2 = L + reverb(L, 1) * wet; R2 = R + reverb(R, 2) * wet
end = int(END * SR)
fade = np.ones(N); fi, fo = int(1.5 * SR), int(6 * SR)
fade[:fi] = np.linspace(0, 1, fi) ** 2; fade[end - fo:end] = np.linspace(1, 0, fo) ** 1.6; fade[end:] = 0
out = np.stack([L2, R2], 1) * fade[:, None]
out = out[:end] / np.abs(out).max() * .89
with wave.open('music2.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('music2.wav', end / SR)
