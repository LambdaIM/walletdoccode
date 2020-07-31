var Minio = require('minio')

var minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 8091,
    accessKey: 'lambda1',
    secretKey: '123456781',
    signature_version:'s3v4',
    useSSL: false,
});

minioClient.listBuckets(function(err, buckets) {
    if (err) return console.log(err)
    console.log('buckets :', buckets)
  })

//   minioClient.makeBucket('mybucket', 'us-east-1', function(err) {
//     if (err) return console.log('Error creating bucket.', err)
//     console.log('Bucket created successfully in "us-east-1".')
//   })

var fs = require('fs')
// var file = './README.md'
// var fileStream = Fs.createReadStream(file)
// var fileStat = Fs.stat(file, function(err, stats) {
//   if (err) {
//     return console.log(err)
//   }
//   minioClient.putObject('mybucket', 'README.md', fileStream, stats.size, function(err, etag) {
//     console.log('-----')
//     return console.log(err, etag) // err should be null
//   })
// })

var size = 0;
var data='';
minioClient.getObject('mybucket', 'README.md', function(err, dataStream) {
  if (err) {
    return console.log(err)
  }
  var myWriteStream = fs.createWriteStream('./README2.md')

  dataStream.on('data', function(chunk) {
      
    size += chunk.length
    data +=chunk
    
  })
  dataStream.on('end', function() {
    console.log('End. Total size = ' + size)

    console.log('文件流传输完成')
    // myWriteStream.WriteStream('./README2.md',data,'utf8')
    fs.writeFileSync('./README2.md',data,'utf8')
    
  })
  dataStream.on('error', function(err) {
    console.log(err)
  })
  
})