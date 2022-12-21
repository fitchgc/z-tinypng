class HttpUtil {
  static generateHeader(dataLength) {
    let random = function (start, end) {
      return (Math.random() * (end - start) + start) | 0
    }
    let getIp = function () {
      return `${random(1,254)}.${random(1,254)}.${random(1,254)}.${random(1,254)}`
    }
    //生成请求头部
    let timeout = 10000 * (1 + dataLength / 500000)
    let time = Date.now()
    let useragent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${70 + Math.random() * 10|0}.0.4324.${Math.random() * 100|0} Safari/537.36`
    return {
      method: 'POST',
      hostname: 'tinypng.com',
      path: '/web/shrink',
      headers: {
        rejectUnauthorized: false,
        'Refresh-Token': (time -= 5000),
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': useragent,
        'X-Forwarded-For': getIp(),
        Cookie: ''
      },
      timeout
    }
  }
}

module.exports = HttpUtil
