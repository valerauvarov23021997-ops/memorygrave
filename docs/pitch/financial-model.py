"""Национальная программа: вариант А (реестр платный, 3 000 ₽/мес) и Б (реестр бесплатный)."""
PLACES, PILOT_COST, SCALE_COST = 400, 100_000, 80 * 400
CHECK, ORDERS, TAKE = 2_000, 2, 0.20
YEARS = [  # (кладбищ накопительно, доля мест с заказами, команда ₽/год)
    (100, 0.02, 15e6), (3_000, 0.04, 60e6), (14_000, 0.06, 180e6),
    (14_000, 0.06, 180e6), (14_000, 0.06, 180e6),   # годы 4–5: без новых кладбищ
]

def run(registry, label):
    print(f'\n=== {label} ===')
    prev, cum, fin3, fin = 0, 0.0, 0.0, 0.0
    rows = []
    for i, (cem, share, team) in enumerate(YEARS, 1):
        new = cem - prev
        digit = new * (PILOT_COST if i == 1 else SCALE_COST)
        live = prev + new / 2
        gmv = live * PLACES * share * ORDERS * CHECK
        rev = gmv * TAKE + live * registry * 12
        cost = digit + team
        res = rev - cost
        cum += res
        fin += max(-res, 0)
        if i <= 3:
            fin3 += max(-res, 0)
        rows.append((i, cem, gmv * (1 - TAKE), rev, cost, res, cum))
        print(f'Год {i}: кладбищ {cem:>6,}; кладбищам {gmv*(1-TAKE)/1e6:7.1f}; выручка {rev/1e6:7.1f}; '
              f'затраты {cost/1e6:6.1f}; итог {res/1e6:+7.1f}; накопленно {cum/1e6:+7.1f} млн')
        prev = cem
    mature = PLACES * 0.06 * ORDERS * CHECK * TAKE + registry * 12
    print(f'финансирование за 3 года {fin3/1e6:.1f}; за 5 лет {fin/1e6:.1f} млн; '
          f'безубыточность {180e6/mature:,.0f} кладбищ; бюджет на реестр при 14 000: {14_000*registry*12/1e6:.0f} млн/год')
    return rows

a = run(3_000, 'А: реестр 3 000 ₽/мес')
b = run(0, 'Б: реестр бесплатный')
