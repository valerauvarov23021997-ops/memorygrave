"""Финансовая модель «Памяти», версия 2 (05.11.2026).

ДАННЫЕ ВЛАДЕЛЬЦА (решения команды):
  оцифровка: ≈300 ₽ за захоронение сейчас (пилот Даймище: до 100 тыс ₽ за 382 места),
             снижается за счёт оптимизации до 90 ₽
  цель: 10 млн ПЛАТЯЩИХ клиентов; средний чек 6 000 ₽ в год на клиента
  под 10 млн клиентов оцифровываем 30 млн захоронений (1 клиент на 3 могилы)
  подписка «Стандарт» 299 ₽/мес — берёт 3 % клиентов
  кладбищу 80 %, платформе 20 %
ЗАКОН:
  НДС 22 % с 01.01.2026 (425-ФЗ от 28.11.2025); налог на прибыль 25 % с 2025 года
ДОПУЩЕНИЯ (проверяются пилотом и банком):
  эквайринг 2,5 % оборота платит платформа; привлечение клиента 500 ₽; отток 15 % в год;
  команда: 300 млн ₽/год постоянных + 60 ₽ на клиента (поддержка, серверы, модерация фото);
  актуализация реестра: 1 млн новых захоронений в год по 90 ₽;
  ставка по кредиту 15 % годовых; 14 000 кладбищ под реестр (вариант А, 3 000 ₽/мес)
"""
CHECK_YEAR = 6_000
TAKE, VAT, PROFIT_TAX = 0.20, 0.22, 0.25
SUB_SHARE, SUB_PRICE = 0.03, 299
ACQ, CAC, CHURN = 0.025, 500, 0.15
TEAM_FIX, TEAM_VAR = 300e6, 60
UPKEEP = 1_000_000 * 90
RATE = 0.15
CEMETERIES, REGISTRY = 14_000, 3_000
BURIALS_TOTAL = 30e6

net = lambda gross: gross / (1 + VAT)   # выручка без НДС


def year_pnl(clients, registry, team_fix=TEAM_FIX, new_clients=None, cemeteries=CEMETERIES):
    """Операционный результат года при среднем числе платящих клиентов."""
    gmv = clients * CHECK_YEAR
    commission = gmv * TAKE
    subs = clients * SUB_SHARE * SUB_PRICE * 12
    reg = cemeteries * registry * 12
    revenue = net(commission + subs + reg)
    if new_clients is None:
        new_clients = clients * CHURN
    costs = dict(
        acquiring=(gmv + subs) * ACQ,
        team=team_fix + clients * TEAM_VAR,
        marketing=new_clients * CAC,
    )
    return dict(gmv=gmv, cemeteries_get=gmv * (1 - TAKE), commission=commission, subs=subs, reg=reg,
                revenue=revenue, vat=(commission + subs + reg) - revenue, costs=costs,
                opex=sum(costs.values()))


def steady(clients, registry):
    p = year_pnl(clients, registry)
    ebit = p['revenue'] - p['opex'] - UPKEEP
    tax = max(ebit, 0) * PROFIT_TAX
    return p, ebit, tax, ebit - tax


# Путь 5 лет: (оцифровано захоронений за год, цена ₽, клиентов на конец года, команда пост.)
PATH = [
    (400_000, 300, 100_000, 60e6),
    (4_000_000, 180, 1_000_000, 150e6),
    (12_000_000, 90, 4_000_000, 300e6),
    (13_600_000, 90, 7_000_000, 300e6),
    (0, 90, 10_000_000, 300e6),
]


def path(registry, label, show=True):
    debt, cum_burials, prev_clients, out = 0.0, 0, 0, []
    peak = 0.0
    for i, (burials, price, end_clients, team_fix) in enumerate(PATH, 1):
        cum_burials += burials
        avg = (prev_clients + end_clients) / 2
        cem = CEMETERIES * cum_burials / BURIALS_TOTAL
        new = end_clients - prev_clients + prev_clients * CHURN
        p = year_pnl(avg, registry, team_fix, new, cem)
        digit = burials * price + (UPKEEP if i >= 4 else 0)
        interest = debt * RATE
        ebit = p['revenue'] - p['opex'] - digit - interest
        tax = max(ebit, 0) * PROFIT_TAX
        res = ebit - tax
        debt = max(debt - res, 0) if res > 0 else debt - res
        peak = max(peak, debt)
        out.append(dict(i=i, burials=cum_burials, clients=end_clients, gmv=p['gmv'], rev=p['revenue'],
                        digit=digit, opex=p['opex'], interest=interest, tax=tax, res=res, debt=debt,
                        vat=p['vat'], cem=p['cemeteries_get']))
        prev_clients = end_clients
    if show:
        print(f'\n=== {label}: путь 5 лет (млн ₽) ===')
        for r in out:
            print(f"Год {r['i']}: оцифровано {r['burials']/1e6:5.1f} млн; клиентов {r['clients']/1e6:4.1f} млн; "
                  f"оборот {r['gmv']/1e6:8.0f}; выручка б/НДС {r['rev']/1e6:7.0f}; оцифровка {r['digit']/1e6:6.0f}; "
                  f"расходы {r['opex']/1e6:6.0f}; проценты {r['interest']/1e6:5.0f}; налог {r['tax']/1e6:5.0f}; "
                  f"итог {r['res']/1e6:+7.0f}; долг {r['debt']/1e6:6.0f}")
        print(f'Пиковый долг (кредит под концессию): {peak/1e6:,.0f} млн ₽')
    return out, peak


if __name__ == '__main__':
    print('Средний чек клиента в год: оборот 6 000 ₽ → кладбищу 4 800 ₽, платформе 1 200 ₽ (с НДС)'
          f' + подписка в среднем {SUB_SHARE*SUB_PRICE*12:.0f} ₽')
    total_digit = sum(b * c for b, c, *_ in PATH)
    print(f'Оцифровка 30 млн захоронений: {total_digit/1e9:.2f} млрд ₽ '
          f'(в среднем {total_digit/BURIALS_TOTAL:.0f} ₽ за место; при 300 ₽ было бы {30e6*300/1e9:.1f} млрд)')
    for reg, label in ((0, 'Б: реестр бесплатный'), (REGISTRY, 'А: реестр 3 000 ₽/мес')):
        print(f'\n=== {label}: год в стационаре ===')
        for n in (1e6, 3e6, 5e6, 10e6):
            p, ebit, tax, profit = steady(n, reg)
            c = p['costs']
            print(f"{n/1e6:4.0f} млн клиентов: оборот {p['gmv']/1e9:5.1f} млрд; кладбищам {p['cemeteries_get']/1e9:5.1f}; "
                  f"выручка б/НДС {p['revenue']/1e9:5.2f}; эквайринг {c['acquiring']/1e9:4.2f}; команда {c['team']/1e9:4.2f}; "
                  f"маркетинг {c['marketing']/1e9:4.2f}; до налога {ebit/1e9:5.2f}; налог на прибыль {tax/1e9:4.2f}; "
                  f"ЧИСТАЯ {profit/1e9:5.2f} млрд; гос 50–60 %: {profit*.5/1e9:.2f}–{profit*.6/1e9:.2f}; НДС {p['vat']/1e9:.2f}")
        path(reg, label)


def extras():
    rev_c = net(CHECK_YEAR * TAKE + SUB_SHARE * SUB_PRICE * 12)
    var_c = (CHECK_YEAR + SUB_SHARE * SUB_PRICE * 12) * ACQ + TEAM_VAR + CHURN * CAC
    margin = rev_c - var_c
    print(f'\nНа одного клиента в год: выручка б/НДС {rev_c:.0f} ₽; переменные расходы {var_c:.0f} ₽ '
          f'(эквайринг {(CHECK_YEAR + SUB_SHARE*SUB_PRICE*12)*ACQ:.0f}, сервис {TEAM_VAR}, замена оттока {CHURN*CAC:.0f}); '
          f'маржа {margin:.0f} ₽')
    print(f'Оцифровка на клиента: 3 × 90 = 270 ₽ → окупается за {270/margin*12:.1f} мес; '
          f'привлечение {CAC} ₽ → {CAC/margin*12:.1f} мес')
    print(f'Безубыточность (Б): {(TEAM_FIX+UPKEEP)/margin/1e3:,.0f} тыс клиентов; '
          f'(А): {(TEAM_FIX+UPKEEP-net(CEMETERIES*REGISTRY*12))/margin/1e3:,.0f} тыс')
    # бюджетные платежи за реестр в варианте А за 5 лет
    cum, total = 0, 0
    for burials, *_ in PATH:
        prev = cum; cum += burials
        total += CEMETERIES * (prev + cum) / 2 / BURIALS_TOTAL * REGISTRY * 12
    print(f'А: муниципалитеты платят за реестр за 5 лет ≈ {total/1e6:,.0f} млн ₽; в стационаре {CEMETERIES*REGISTRY*12/1e6:.0f} млн/год')
    for reg in (0, REGISTRY):
        p, ebit, tax, profit = steady(10e6, reg)
        print(f'reg={reg}: государству в год при 10 млн: дивиденды 50–60 % {profit*.5/1e9:.2f}–{profit*.6/1e9:.2f}; '
              f'НДС {p["vat"]/1e9:.2f}; налог на прибыль {tax/1e9:.2f}; итого {(profit*.5+p["vat"]+tax)/1e9:.1f}–{(profit*.6+p["vat"]+tax)/1e9:.1f} млрд')
    print(f'Рынок оцифровки 30 млн мест по 602–671 ₽: {30e6*602/1e9:.1f}–{30e6*671/1e9:.1f} млрд')


if __name__ == '__main__':
    extras()
