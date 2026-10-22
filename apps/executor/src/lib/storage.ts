import { setStoragePrefix } from '@pamyat/api'

// Свой сохранённый вход, отдельно от клиентского приложения:
// в Expo Go их хранилища общие
setStoragePrefix('executor.')
