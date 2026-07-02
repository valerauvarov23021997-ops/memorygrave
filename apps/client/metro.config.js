// Metro для монорепо: следим за корнем и резолвим hoisted node_modules.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Дополняем дефолтные watchFolders корнем монорепо, не затирая их.
config.watchFolders = [...new Set([...(config.watchFolders ?? []), workspaceRoot])]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// Иерархический поиск оставляем включённым: некоторые зависимости
// (напр. @react-native/virtualized-lists) вложены в node_modules пакетов.

module.exports = config
