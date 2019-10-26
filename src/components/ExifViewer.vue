<template>
  <div class="modal-mask">

    <div class="modal-wrapper">

      <div class="modal-container">

        <button class="icon close-btn" @click="$emit('close')"><svg><use xlink:href="dist/symbols.svg#close-note">
          <title>Cancel Edit</title>
        </use></svg></button>

        <div class="modal-header">EXIF Data For Selected Photo(s)</div>

        <gmap-map
          v-if="hasGpsData"
          class="gmap-container"
          ref="exifMap"
          :center="mapCenter"
          :zoom="15"
        >
          <gmap-marker
            v-for="marker in exifMarkers"
            :key="marker.key"
            :title="marker.title"
            :icon="marker.icon"
            :position="marker.position"
            @click="markerSelect(marker)"
          ></gmap-marker>
        </gmap-map>

        <div>Select any EXIF data you would like to use to update your Note properties.</div>

        <div class="button-bar">
          <button @click="$emit('close')">Cancel</button>
          <button @click="updateNote">Update Note</button>
        </div>

        <div class="exif-container">
          <div v-for="exif in exifs" class="exif-item">
            <img class="photo-icon" :src="exif.path || exif.thumb"/>
            <div class="name">{{exif.name}}</div>
            <div class="date" v-if="!!exif.datetime">
              <input type="radio" name="date" @change="dateSelect(exif, $event)">
              Date: {{$moment(exif.datetime, 'YYYY:MM:DD HH:mm:ss').format('LLLL')}}
            </div>
            <div v-if="!!exif.geocode" class="geocode link">
              <input type="radio" name="geocode" @change="geocodeSelect(exif, $event)">
              Location: {{exif.geocode.latitude + ', ' + exif.geocode.longitude}}
            </div>
          </div>
        </div>


      </div>

    </div>

  </div>
</template>

<script>
  export default {

    name: "ExifViewer",

    props: {
      exifs: Array
    },

    data() {
      return {
        selected: {},
        map: null
      }
    },

    computed:{

      hasGpsData() {
        return !! this.exifs.find(exif => !!exif.geocode);
      },

      viewerMapBounds() {
        // console.log('ExifViewer.computed.viewerMapBounds');
        if (!this.exifs || !window.google || this.exifs < 1) return 0;
        let minLat = 360, maxLat = -360, minLon = 360, maxLon = -360;
        this.exifs.forEach(function(item) {
          if (item.geocode && item.geocode.latitude) {
            if (item.geocode.latitude > maxLat) maxLat = item.geocode.latitude;
            if (item.geocode.latitude < minLat) minLat = item.geocode.latitude;
            if (item.geocode.longitude > maxLon) maxLon = item.geocode.longitude;
            if (item.geocode.longitude < minLon) minLon = item.geocode.longitude;
          }
        });
        // LatLngBounds([sw, ne])
        //console.log('ExifViewer.viewerMapBounds: minLat ['+minLat+'] maxLat ['+maxLat+'] minLon ['+minLon+'] maxLon ['+maxLon+']');
        let sw = new window.google.maps.LatLng(minLat, minLon),
          ne = new window.google.maps.LatLng(maxLat, maxLon);
        return new window.google.maps.LatLngBounds(sw, ne);
      },

      mapCenter() {
        //console.log('ExifViewer.computed.mapCenter');
        if (!this.exifs || !this.map) return {'lat':0, 'lng':0};
        let bounds = this.viewerMapBounds;
        if (bounds) {
          return bounds.getCenter().toJSON();
        } else {
          let geo = this.exifs[0].geocode;
          return {'lat':geo.latitude, 'lng': geo.longitude};
        }
      },

      exifMarkers() {
        if (!this.map) {
          // need to wait for map to load for google.maps reference
          return [];
        }
        let markers = [];
        let useIcon = this.exifs.length > 1;
        this.exifs.forEach((item) => {
          // only add markers for items with geocodes
          if (!item.geocode) {
            //console.log('ExifViewer.computed.exifMarkers exif missing geocode data');
            return;
          }
          let marker = {
            item: item,
            title: item.name,
            key: item.index,
            position: {'lat': Number(item.geocode.latitude), 'lng': Number(item.geocode.longitude)}
          };
          if (useIcon) {
            let size;
            if (!!item.ratio) {
              size = item.orientation == 'landscape' ? new window.google.maps.Size(60 * item.ratio, 60) : new window.google.maps.Size(60, 60 * item.ratio);
            } else {
              size = item.orientation == 'landscape' ? new window.google.maps.Size(80, 60) : new window.google.maps.Size(60, 80);
            }
            marker.icon = {
              url: item.path || item.medium,
              scaledSize: size
            }
          }
          console.dir(marker);
          markers.push(marker);
        });
        return markers;
      }
    },

    mounted() {
      if (this.hasGpsData) {
        this.$refs.exifMap.$mapPromise.then((map) => {
          this.map = map;
          if (this.viewerMapBounds) map.fitBounds(this.viewerMapBounds);
        });
      }
    },

    methods: {

      markerSelect() {
        //console.log(`ExifViewer.markerSelect()`);
        // TODO Would be nice to have icon click select radio boxes
      },

      dateSelect(exif, evnt) {
        //console.log(`ExifViewer.dateSelect()`);
        this.selected.datetime = this.$moment(exif.datetime, 'YYYY:MM:DD HH:mm:ss').toDate();
      },

      geocodeSelect(exif, evnt){
        //console.log(`ExifViewer.geocodeSelect()`);
        this.selected.geocode = exif.geocode;
      },

      updateNote() {
        //console.log('ExifViewer.updateNote');
        this.$emit('selectexif', this.selected);
        this.$emit('close');
      }

    }

  }
</script>

<style lang="scss" scoped>

  .close-btn {
    position: absolute;
    top: 0;
    right: 0;
  }

  .button-bar {
    float: right;
    margin-top: 8px;
    button {
      margin-left: 10px;
    }
  }

  .photo-icon {
    max-height: 90px;
    max-width: 120px;
    float: left;
    margin-right: 10px;
  }

  .modal-mask .modal-container {
    width: 640px;
    height: auto;
    position: relative;
  }

  .modal-header {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .gmap-container {
    width: 580px;
    height: 350px;
  }

  .exif-container {
    overflow-y: auto;
    clear: right;
    max-height: calc(100vh - 500px);
  }
  .exif-item {
    margin-top: 10px;
    height: 90px;
  }
  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {
    .modal-mask .modal-container {
      font-size: 1.2em;
    }
    .name {
      max-width: 400px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

</style>
