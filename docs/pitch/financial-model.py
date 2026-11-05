"""Финансовая модель «Памяти» для встречи с государством.

ФАКТЫ (источник):
  рыночная цена инвентаризации: 817 509 ₽ за кладбище 9,6 га (Приморский край, контракт)
    = 85 тыс ₽/га; прайс подрядчика «от 95 000 ₽ за 1 га»
  Даймище: 382 места, участки 152 × 175 м ≈ 2,7 га
  исполнителю 80% стоимости заказа, платформе 20% (решение владельца)
  каталог: уборка от 800 ₽, цветы от 500, свечи от 300, ограда от 6 000, скамейка от 8 000, плита от 15 000

ДОПУЩЕНИЯ — проверяются пилотом.
"""

# ── допущения ──
HA = 3.0                 # га на среднее кладбище (Даймище ≈ 2,7)
PLACES = 400             # мест на кладбище (Даймище 382)
SURVEY_PER_HA = 90_000   # съёмка по рыночной цене, середина 85–95 тыс
NAMES_PER_PLACE = 100    # фото и перепись надписи, ₽ за место
CHECK = 2_000            # средний чек заказа, ₽
ORDERS_PER_GRAVE = 2     # заказа в год на «активную» могилу: весна и осень
TAKE = 0.20              # доля платформы
REGISTRY_FEE = 3_000     # ведение цифрового реестра для администрации, ₽/мес за кладбище

YEARS = [
    # (кладбищ накопительно, доля мест с заказами, команда и серверы ₽/год)
    (25, 0.02, 10_000_000),
    (120, 0.04, 18_000_000),
    (300, 0.06, 25_000_000),
]

# ФАКТ: Даймище оцифровано целиком не дороже 100 тыс ₽ (съёмка + фото + перепись)
digit_per_cem = 100_000      # год 1, пилот: как на Даймище
PER_PLACE_SCALE = 80         # ОЦЕНКА КОМАНДЫ при масштабе: 65–80 ₽ за захоронение, берём верх
digit_scale = PER_PLACE_SCALE * PLACES
print(f'Оцифровка одного кладбища: {digit_per_cem:,.0f} ₽')

# экономика одного кладбища при зрелом спросе (6%)
gmv1 = PLACES * 0.06 * ORDERS_PER_GRAVE * CHECK
print(f'Одно кладбище, зрелый спрос: оборот {gmv1:,.0f} ₽/год; администрации {gmv1*(1-TAKE):,.0f}; '
      f'платформе {gmv1*TAKE:,.0f} + реестр {REGISTRY_FEE*12:,.0f} = {gmv1*TAKE+REGISTRY_FEE*12:,.0f}')
print(f'  окупаемость оцифровки: пилот {digit_per_cem/(gmv1*TAKE+REGISTRY_FEE*12):.1f} г.; масштаб {digit_scale/(gmv1*TAKE+REGISTRY_FEE*12)*12:.0f} мес. (кладбище {digit_scale:,.0f} ₽)')
print(f'  безубыточность команды 25 млн: {25e6/(gmv1*TAKE+REGISTRY_FEE*12):.0f} кладбищ')

prev = 0
tot = dict(digit=0, team=0, rev=0, admins=0, gmv=0)
for i, (cem, share, team) in enumerate(YEARS, 1):
    new = cem - prev
    digit = new * (digit_per_cem if i == 1 else digit_scale)
    places = cem * PLACES
    orders = places * share * ORDERS_PER_GRAVE
    gmv = orders * CHECK
    commission = gmv * TAKE
    registry = cem * REGISTRY_FEE * 12  # упрощение: реестр оплачивается за весь год
    rev = commission + registry
    admins = gmv * (1 - TAKE)
    cost = digit + team
    print(f'\nГод {i}: кладбищ {cem} (+{new}), мест {places:,}, заказов {orders:,.0f}')
    print(f'  оборот заказов {gmv/1e6:.2f} млн; администрациям {admins/1e6:.2f} млн')
    print(f'  выручка компании {rev/1e6:.2f} млн (комиссия {commission/1e6:.2f} + реестр {registry/1e6:.2f})')
    print(f'  затраты: оцифровка {digit/1e6:.2f} + команда {team/1e6:.2f} = {cost/1e6:.2f} млн; разрыв {(cost-rev)/1e6:.2f} млн')
    for k, v in dict(digit=digit, team=team, rev=rev, admins=admins, gmv=gmv).items():
        tot[k] += v
    prev = cem

print(f"\nЗа 3 года: оцифровка {tot['digit']/1e6:.1f} + команда {tot['team']/1e6:.1f} = "
      f"{(tot['digit']+tot['team'])/1e6:.1f} млн; выручка {tot['rev']/1e6:.1f}; "
      f"финансирование {(tot['digit']+tot['team']-tot['rev'])/1e6:.1f} млн; "
      f"администрациям {tot['admins']/1e6:.1f} млн; оборот {tot['gmv']/1e6:.1f} млн")
pilot = YEARS[0][0] * digit_per_cem + YEARS[0][2]
print(f'Пилот (год 1): {pilot/1e6:.2f} млн ₽')
