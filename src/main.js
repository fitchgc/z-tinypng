let TinyPng = require('./lib/tinypng')
const Cfg = require('./cfg')

function _getTextureFromSpriteFrames(buildResults, assetInfos) {
  let textures = {}
  for (let i = 0; i < assetInfos.length; ++i) {
    let info = assetInfos[i]
    if (buildResults.containsAsset(info.uuid)) {
      let depends = buildResults.getDependencies(info.uuid)
      if (depends.length > 0) {
        // sprite frame should have only one texture
        textures[depends[0]] = true
      }
    }
  }
  return Object.keys(textures)
}
function querySpriteAssets(path, buildResults, excludeFiles) {
  return new Promise((resolve, reject) => {
    Editor.assetdb.queryAssets(path, 'sprite-frame', (err, assetInfos) => {
      let textures = _getTextureFromSpriteFrames(buildResults, assetInfos);
      for (let i = 0; i < textures.length; ++i) {
        //let path = buildResults.getNativeAssetPath(textures[i]);
        //excludeFiles.add(path)
        excludeFiles.add(textures[i])
        // Editor.log(`Texture of "db://assets/Auto Atlas/AutoAtlas": ${path}`);
      }
      resolve()
    });
  })
}

function queryAssets(path, buildResults, excludeFiles) {
  return new Promise((resolve, reject) => {
    Editor.assetdb.queryAssets(path, 'texture', (err, assetInfos) => {
      for (let i = 0; i < assetInfos.length; ++i) {
        let tex = assetInfos[i].uuid
        if (buildResults.containsAsset(tex)) {
          //let path = buildResults.getNativeAssetPath(tex);
          //excludeFiles.add(path)
          excludeFiles.add(tex)
          // Editor.log(`Texture of "${assetInfos[i].url}": ${path}`);
        }
      }
      resolve()
    })
  })
}

async function minifyWithTinyPng(options, cfg) {
  let textures = []
  let excludeFiles = new Set()
  let results = []
  if (cc.ENGINE_VERSION <= '2.2.0') {
    Editor.log('version not support')
    return 
  }
  if (cc.ENGINE_VERSION >= '2.4.0') {
    for (let bundle of options.bundles) {
      results.push(bundle.buildResults)
    }
  } else {
    results.push(options.buildResults)
  }
  for (let buildResults of results) {
    if (cfg.excludeFolders) {
      let folderArr = cfg.excludeFolders.replace(/\n/g, '').split(',')
      for (let folder of folderArr) {
        await querySpriteAssets(`db://assets/${folder}/**/*`, buildResults, excludeFiles)
        await queryAssets(`db://assets/${folder}/**/*`, buildResults, excludeFiles)
      }
      if (cfg.excludeFiles) {
        let fileArr = cfg.excludeFiles.replace(/\n/g, '').split(',')
        for (let file of fileArr) {
          await queryAssets(`db://assets/${file}`, buildResults, excludeFiles)
        }
      }
    }
  }
  Editor.log('excludeFiles: ', excludeFiles)
  for (let buildResults of results) {
    let assets = buildResults.getAssetUuids()
    let textureType = cc.js._getClassId(cc.Texture2D)
    for (let i = 0; i < assets.length; ++i) {
      let asset = assets[i]
      // Editor.log(Editor.assetdb.assetInfoByUuid(asset))
      if (buildResults.getAssetType(asset) === textureType ) {
        let path = buildResults.getNativeAssetPath(asset)
        if (path && !excludeFiles.has(asset)) {
          textures.push(path)
        }
      }
    }
  }
  Editor.log(`[z-tinypng] begin minify images: ${textures.length}`)
  Editor.log(`[z-tinypng] begin minify images: ${textures}`)
  let min = cfg.min * 1024
  let max = cfg.max ? cfg.max * 1024 : 0
  return TinyPng.compressList(textures, min, max)
}

async function onAfterBuildFinish(options, callback) {
  const platform = options.actualPlatform
  const cfg = new Cfg().load().data
  if (cfg.platforms.indexOf(platform) == -1) {
    Editor.log(`[z-tinypng] ${platform} build finished, target platform not in cfg, ignore me.`)
    callback()
    return
  }
  Editor.log(`[z-tinypng] ${platform} build finished, begin job.`)
  // 压缩图片
  try {
    await minifyWithTinyPng(options, cfg)
  } catch (err) {
    Editor.log(err)
  }
  Editor.success('[z-tinypng] all done, bye.')
  callback()
}


module.exports = {
  load() {
    Editor.Builder.on('build-finished', onAfterBuildFinish)
  },

  unload() {
    Editor.Builder.removeListener('build-finished', onAfterBuildFinish)
  },

  messages: {
    open() {
      Editor.Panel.open('z-tinypng')
    }
  }
}
