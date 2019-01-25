const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');
//https://cloud.google.com/nodejs/docs/reference/storage/2.3.x/
const gcs = new Storage();
const os = require('os');
const {ensureDir, remove} = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

exports.onFileCreated = functions.storage
  .object()
  .onFinalize( object => {
    const filePath = object.name;
    const contentType = object.contentType;
    if (
      path.basename(filePath).startsWith('gcphoto-')
      || !contentType.includes('image')
    ) {
      //console.log(`onFileCreated() skip processing file [${filePath}]`);
      return false;
    }
    //console.log('onFileCreated() v.0.2 resize function execution started...');
    //console.log(object);
    const bucket = object.bucket;
    const destBucket = gcs.bucket(bucket);
    //const metadata = {contentType: contentType};
    const workingDir = path.join(os.tmpdir(), 'resize');
    return ensureDir(workingDir)
      .then(() => {
        // Copy file to temp directory
        const tmpFilePath = path.join(workingDir, path.basename(filePath));
        return destBucket.file(filePath).download({destination: tmpFilePath})
          .then(() => {
            console.log('onFileCreated() source file copied to working directory');
            // resize images
            const extName = path.extname(tmpFilePath);
            //const fileName = path.basename(tmpFilePath, extName);
            const fileName = object.generation;
            const thumbnailName = 'gcphoto-' + fileName + '-90px' + extName;
            const thumbnailPath =  path.join(workingDir, thumbnailName);
            const reducedName = 'gcphoto-' + fileName + '-600px' + extName;
            const reducedPath = path.join(workingDir, reducedName);
            const fullName = 'gcphoto-' + fileName + '-1200px' + extName;
            const fullPath = path.join(workingDir, fullName);
            return Promise.all([
              sharp(tmpFilePath).resize(90, 90).toFile(thumbnailPath),
              sharp(tmpFilePath).withMetadata().resize(600, 600, {fit:'inside'}).toFile(reducedPath),
              sharp(tmpFilePath).withMetadata().resize(1200, 1200, {fit:'inside', withoutEnlargement: true}).toFile(fullPath)
            ]).then(() => {
              //console.log('onFileCreated() photos resized > move to /images/ directory');
              return Promise.all([
                destBucket.upload(thumbnailPath, {destination: 'images/' + thumbnailName}),
                destBucket.upload(reducedPath, {destination: 'images/' + reducedName}),
                destBucket.upload(fullPath, {destination: 'images/' + fullName})
              ]).then(() => {
                //console.log('onFileCreated() photos copied to image directory');
                return Promise.all([
                  remove(workingDir),
                  destBucket.file(filePath).delete()
                ]).then(() => {
                  //console.log('onFileCreated() directories and files cleaned up--image generation complete');
                  return Promise.resolve(true);
                });
              });
            });
          })
      })
      .catch(err => {
        console.log('onFileCreated() Error');
        console.log(err)
      })
  });
