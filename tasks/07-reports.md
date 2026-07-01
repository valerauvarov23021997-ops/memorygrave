# Задача 07 — Фотоотчёты и оценки

## PhotoReportScreen.tsx

Параметры: `{ orderId: string }`

### Данные
```ts
const { data: report } = useQuery({
  queryKey: ['report', orderId],
  queryFn:  () => ordersApi.getReport(orderId),
})
// report: { photosBefore: string[], photosAfter: string[], rating: number | null }
```

### UI (ScrollView)
```
Success-баннер (circle-check + «Уборка выполнена» + дата)
  background: successBg, border: 0.5px sageL

SectionLabel «Фото до»
Grid 2 колонки × PhotoBox (before-стиль: parchment bg)

SectionLabel «Фото после»
Grid 2 колонки × PhotoBox (after-стиль: successBg bg, border sageL)

SectionLabel «Оценить работу» (если rating === null)
StarRating value={localRating} onChange={setLocalRating}
  При изменении — сразу сохранять через debounce 800мс

Button primary «Заказать повторно»
Button secondary «Скачать фото»
```

### PhotoBox.tsx
```tsx
// Нажатие → полноэкранный просмотр через react-native-image-viewing
// Кнопка загрузки: expo-media-library → saveToLibraryAsync

interface PhotoBoxProps {
  uri:     string
  style:   'before' | 'after'
  onPress: () => void
}
```

### Сохранение оценки
```ts
const [localRating, setLocalRating] = useState(report?.rating ?? 0)
const debouncedRating = useDebounce(localRating, 800)

useEffect(() => {
  if (debouncedRating > 0 && debouncedRating !== report?.rating) {
    ordersApi.addReview(orderId, { rating: debouncedRating })
      .then(() => showToast('Спасибо за оценку!', 'success'))
      .catch(() => showToast('Не удалось сохранить оценку', 'error'))
  }
}, [debouncedRating])
```

### «Заказать повторно»
```ts
// Берёт данные текущего заказа и открывает OrderForm
// с предзаполненными graveId и serviceId
nav.navigate('OrderForm', {
  graveId:   order.grave.id,
  serviceId: order.service.id,
})
```

### «Скачать фото»
```ts
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'

async function downloadAllPhotos() {
  const { status } = await MediaLibrary.requestPermissionsAsync()
  if (status !== 'granted') {
    showToast('Нет доступа к галерее', 'error')
    return
  }
  const allPhotos = [...(report.photosBefore ?? []), ...(report.photosAfter ?? [])]
  for (const url of allPhotos) {
    const filename = url.split('/').pop()!
    const localUri = FileSystem.cacheDirectory + filename
    await FileSystem.downloadAsync(url, localUri)
    await MediaLibrary.saveToLibraryAsync(localUri)
  }
  showToast(`${allPhotos.length} фото сохранено в галерею`, 'success')
}
```

## Критерии выполнения

- [ ] Полноэкранный просмотр фото с pinch-to-zoom
- [ ] Оценка сохраняется автоматически через debounce
- [ ] Скачивание всех фото в галерею
- [ ] «Заказать повторно» передаёт правильные параметры
