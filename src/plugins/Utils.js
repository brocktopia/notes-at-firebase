import EXIF from 'exif-js'
//import moment from 'moment'

const Utils = {

  install(Vue) {
    Vue.prototype.$utils = Utils;
  },

  locationDenied: false,

  getLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          //console.dir(position);
          resolve({
            latitude: Number(position.coords.latitude.toFixed(7)),
            longitude: Number(position.coords.longitude.toFixed(7))
          })
        },
        (err) => {
          console.warn(`Utils.getLocation() ERROR(${err.code}): ${err.message}`);
          //console.dir(err);
          let response = {
            error: err
          };
          if (err.message === 'User denied Geolocation') {
            Utils.locationDenied = true;
            response.title = 'User Denied Geolocation';
            response.message = 'Access to browser geolocation data has been denied. You must allow access to that data to enable this feature. This can be done in your browser settings.';
          } else if (userAction) {
            response.title = 'Geolocation Failed';
            response.message = 'Your device was unable to determine your current location.';
          }
          reject(response)
        },
        {
          enableHighAccuracy: true
        }
      );
    })
  },

  getExifData(img) {
    //console.log(`Util.getExifData()`);
    let data = {hasEXIF: false};
    return new Promise((resolve, reject) => {
      EXIF.getData(img, () => {
        const exifData = EXIF.getAllTags(img);
        //console.log(`Util.getExifData() exif data`);
        //console.dir(exifData);
        // Look for gps data
        if (exifData.GPSLatitude && exifData.GPSLongitude) {
          let [deg1, min1, sec1] = exifData.GPSLatitude;
          let lat = Number((deg1 + min1 / 60 + sec1 / 3600).toFixed(7));
          if (exifData.GPSLatitudeRef === 'S') lat = -(lat);
          let [deg2, min2, sec2] = exifData.GPSLongitude;
          let lng = Number((deg2 + min2 / 60 + sec2 / 3600).toFixed(7));
          if (exifData.GPSLongitudeRef === 'W') lng = -(lng);
          data.geocode = {
            latitude: lat,
            longitude: lng
          };
          data.hasEXIF = true;
        }
        // Look for date info
        if ((exifData.DateTimeOriginal || exifData.DateTime)) {
          const time = exifData.DateTimeOriginal || exifData.DateTime;
          // There are probably going to be different date formats so I'll eventually need to add some sort of data parsing
          //data.datetime = moment(time, 'YYYY:MM:DD HH:mm:ss').toDate();
          data.datetime = time;
          data.hasEXIF = true;
        }
        // Look for size info
        if (exifData.PixelXDimension && exifData.PixelYDimension) {
          data.orientation = (exifData.PixelXDimension > exifData.PixelYDimension) ? 'landscape' : 'portrait';
          data.ratio = (data.orientation === 'landscape') ?
            Number((exifData.PixelXDimension / exifData.PixelYDimension).toFixed(4)) :
            Number((exifData.PixelYDimension / exifData.PixelXDimension).toFixed(4));
        } else if (exifData.ImageWidth && exifData.ImageHeight) {
          data.orientation = (exifData.ImageWidth > exifData.ImageHeight) ? 'landscape' : 'portrait';
          data.ratio = (data.orientation === 'landscape') ?
            Number((exifData.ImageWidth / exifData.ImageHeight).toFixed(4)) :
            Number((exifData.ImageHeight / exifData.ImageWidth).toFixed(4));
        }
        if (data.hasEXIF) resolve(data);
        else reject('No EXIF data')
      });
    })

  },

  deepClone(store) {
    if (!store) {
      return store;
    }
    // this will do a deep clone as long as the object contains no self referencing objects
    let data = Array.isArray(store) ? [] : {};
    Object.keys(store).forEach(key => {
      if (typeof(store[key]) === 'object' && !!store[key].toDate) {
        // don't mess with timestamps
        data[key] = store[key];
      } else {
        data[key] = (typeof(store[key]) === 'object') ? Utils.deepClone(store[key]) : store[key];
      }
    });
    return data;
  }

};

export default Utils
