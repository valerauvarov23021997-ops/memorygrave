module.exports = function (api) {
  api.cache(true)
  // В SDK 54 babel-preset-expo сам подключает плагин worklets/reanimated —
  // отдельно его добавлять не нужно.
  return {
    presets: ['babel-preset-expo'],
  }
}
