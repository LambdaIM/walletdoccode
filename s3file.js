var Minio = require('minio')

var minioClient = new Minio.Client({
  endPoint: '127.0.0.1',
  port: 8091,
  accessKey: 'lambda1',
  secretKey: '123456781',
  signature_version: 's3v4',
  useSSL: false,
});

// 读取Buckets 列表
minioClient.listBuckets(function (err, buckets) {
  if (err) return console.log(err)
  console.log('buckets :', buckets)
})

//创建bucket
minioClient.makeBucket('mybucket', '', function (err) {
  if (err) return console.log('Error creating bucket.', err)
  console.log('Bucket created successfully in ')
})

//上传文件
var fs = require('fs')
var file = './README.md'
var fileStream = fs.createReadStream(file)
var fileStat = fs.stat(file, function (err, stats) {
  if (err) {
    return console.log(err)
  }
  minioClient.putObject('mybucket', 'README.md', fileStream, stats.size, function (err, etag) {
    console.log('-----')
    return console.log(err, etag) // err should be null
  })
})

//下载文件
var size = 0;
var data = '';
minioClient.getObject('mybucket', 'README.md', function (err, dataStream) {
  if (err) {
    return console.log(err)
  }
  var myWriteStream = fs.createWriteStream('./README2.md')
  dataStream.pipe(myWriteStream);
  dataStream.on('data', function (chunk) {
    size += chunk.length
  })
  dataStream.on('end', function () {
    console.log('End. Total size = ' + size)
  })
  dataStream.on('error', function (err) {
    console.log(err)
  })

})