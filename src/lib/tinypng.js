const path = require('path')
const https = require('https')
const {URL} = require('url')
const fs = require('fs-extra')
const tinyExts = ['.jpg', '.png']
const HttpUtil = require('./http.utils')
const Stream = require('stream').Transform

class TinyPng {
  constructor() {
    if (Promise.prototype.finally) {
      Promise.prototype.finally = function (callback) {
        let P = this.constructor
        return this.then(
          value => P.resolve(callback()).then(() => value),
          reason => P.resolve(callback()).then(() => {
            throw reason
          })
        )
      }
    }
  }

  static async compressList(imagelist, min, max) {
    if (!imagelist || imagelist.length === 0) {
      throw new Error('没有获取到图片文件')
    }
    let total = imagelist.length
    let compressed = 0
    let noCompress = 0
    let beginTime = Date.now()
    return new Promise((resolve, reject) => {
      for (let i in imagelist) {
        let imgPath = imagelist[i]
        TinyPng.compressImg(imgPath, imgPath, min, max)
          .then((res) => {
            compressed++
            Editor.log(`[${compressed}/${total}] ${res.input.size}-> ${res.output.size} ${res.output.path}`)
          })
          .catch((err) => {
            noCompress++
            Editor.log(`[${noCompress}/${total}] err, ${imgPath}`)
            Editor.log(err)
          })
          .finally(() => {
            if ((compressed + noCompress) >= total) {
              Editor.log(`[TinyPng] success: ${compressed}, skip: ${noCompress} , cost ${((Date.now() - beginTime) / 1000) | 0}s`)
              resolve && resolve()
            }
          })
      }
    })

  }

  static uploadImage(imageData, min, max) {
    let dataLength = imageData.length || 0
    return new Promise((resolve, reject) => {
      if (!imageData) {
        reject && reject(new Error(`no image data , datalength: ${dataLength}`))
      }
      let req = https.request(HttpUtil.generateHeader(dataLength), (res) => {
        res.on('data', (buf) => {
          let obj
          try {
            obj = JSON.parse(buf.toString())
          } catch (err) {
            reject && reject(new Error('解析返回值失败'))
          }
          if (obj.err) {
            reject && reject(new Error(obj.err))
          } else {
            resolve && resolve(obj)
          }
        })
      })
      req.write(imageData, 'binary')
      req.on('err', (err) => {
        reject && reject(err)
      })
      req.on('timeout', () => {
        req.abort()
        reject && reject(new Error('timeout'))
      })
      req.end()
    })
  }

  static async compressImg(sourceImg, targetImg, min, max) {
    if (!sourceImg) {
      throw new Error('请传入正确的sourceImg')
    }
    targetImg = targetImg || sourceImg

    let exists = await fs.exists(sourceImg)
    if (!exists) {
      throw new Error('传入的文件不存在')
    }
    min = min || 0
    let imageData
    let stat = await fs.stat(sourceImg)
    if (stat.size < min) {
      throw new Error(`image data ${stat.size} less than: ${min}`)
    }
    if (max && stat.size > max) {
      throw new Error(`image data ${stat.size} reach max: ${max}`)
    }
    sourceImg = sourceImg.replace(/\\/g, '/')
    let extname = path.extname(sourceImg).toLowerCase()
    try {
      imageData = await fs.readFile(sourceImg)
    } catch (err) {
      throw err
    }
    if (!imageData) {
      throw new Error(`no image data found for ${sourceImg}`)
    }
    let resObj = {
      input: {size: stat.size, path: sourceImg},
    }

    if (tinyExts.indexOf(extname) > -1) {
      let obj
      try {
        obj = await this.uploadImage(imageData, min, max)
      } catch (err) {
        Editor.warn('upload err', err)
        throw err
      }
      if (obj && obj.output) {
        try {
          let length = await this.downloadFile(obj.output.url, targetImg)
          resObj.output = {
            size: length,
            path: targetImg
          }
        } catch (err) {
          Editor.log(err)
          throw err
        }
      }
    }
    return resObj
  }

  static downloadFile(url, targetPath) {
    return new Promise((resolve, reject) => {
      https.request(url, function (response) {
        let size = 0
        let data = new Stream()

        response.on('data', function (chunk) {
          data.push(chunk)
          size += chunk.length
        })

        response.on('end', function () {
          fs.outputFileSync(targetPath, data.read())
          resolve(size)
        })
      }).end()
    })
  }
}

module.exports = TinyPng
