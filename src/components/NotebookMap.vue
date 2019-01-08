<template>

    <div class="content">
      <gmap-map
        class="content"
        ref="notebookMap"
        :center="mapCenter"
        :zoom="10"
      >
        <gmap-info-window
          :options="infoOptions"
          :position="infoWindowPos"
          :opened="infoWinOpen"
          @closeclick="infoWinOpen=false"
        >
          <div class="note-info" v-if="!!infoMarker.note">
            <h3>{{infoMarker.note.name}}</h3>
            <div>{{$moment(infoMarker.date).format('l h:mm:ss a')}}</div>
            <div v-if="infoMarker.hasPlace">
              <img :src="infoMarker.note.place.icon" width="24" height="24"/>
              <span>{{infoMarker.note.place.name}}</span>
              <a :href="infoMarker.note.place.url" target="_blank">
                <svg class="icon-tiny"><use xlink:href="dist/symbols.svg#launch"></use></svg>
              </a>
            </div>
            <p style="max-width:250px;">{{infoMarker.note.note.length > 200 ? infoMarker.note.note.substr(0,200) + '...' : infoMarker.note.note}}</p>
            <button @click="showNote(infoMarker.note)">Open Note</button>
          </div>
        </gmap-info-window>
        <gmap-marker
          v-for="marker in noteMarkers"
          :key="marker.key"
          :title="marker.title"
          :position="marker.position"
          @click="toggleInfoWindow(marker)"
        ></gmap-marker>
        <gmap-marker
          v-for="marker in placeMarkers"
          :key="marker.key"
          :title="marker.title"
          :position="marker.position"
          :place="marker.place"
          @click="toggleInfoWindow(marker, marker.key)"
        ></gmap-marker>
      </gmap-map>
    </div>

</template>

<script>
  import {GmapMap, GmapInfoWindow} from 'vue2-google-maps'

  var vm;
  export default {

    props:{
      notes:Array,
      name:String
    },

    data: function() {
      return {
        google:null,
        noteMarkers:[],
        placeMarkers:[],
        infoWindowPos: null,
        infoWinOpen: false,
        infoMarker: {note:{note:''}},
        currentMidx: null,
        infoOptions: {
          pixelOffset: {
            width: 0,
            height: -35
          }
        }
      }
    },

    computed:{
      notebookMapBounds: function() {
       // console.log('NotebookMap.computed.notebookMapBounds');
        if (!vm) return 0;
        let minLat = 360, maxLat = -360, minLon = 360, maxLon = -360;
        vm.notes.forEach(function(note) {
          if (note.geocode && note.geocode.latitude) {
            if (note.geocode.latitude > maxLat) maxLat = note.geocode.latitude;
            if (note.geocode.latitude < minLat) minLat = note.geocode.latitude;
            if (note.geocode.longitude > maxLon) maxLon = note.geocode.longitude;
            if (note.geocode.longitude < minLon) minLon = note.geocode.longitude;
          }
        });
        // LatLngBounds([sw, ne])
        //console.log('notebookMapBounds: minLat ['+minLat+'] maxLat ['+maxLat+'] minLon ['+minLon+'] maxLon ['+maxLon+']');
        let sw = new vm.google.maps.LatLng(minLat, minLon),
          ne = new vm.google.maps.LatLng(maxLat, maxLon);
        return new vm.google.maps.LatLngBounds(sw, ne);
      },
      mapCenter: function() {
        //console.log('NotebookMap.computed.mapCenter');
        if (!vm) return {'lat':0, 'lng':0};
        let bounds = vm.notebookMapBounds;
        console.log('mapCenter:');
        console.dir(bounds.getCenter().toJSON());
        if (bounds) {
          return bounds.getCenter().toJSON();
        } else {
          let geo = vm.notes[0].geocode;
          return {'lat':geo.lat, 'lng': geo.lon};
        }
      }
    },

    mounted () {
      //console.log('NotebookMap.mounted()');
      vm = this;
      // At this point, the child GmapMap has been mounted, but its map has not been initialized.
      // Therefore we need to write mapRef.$mapPromise.then(() => ...)
      vm.$refs.notebookMap.$mapPromise.then((map) => {
        map.fitBounds(vm.notebookMapBounds);
      });
      // Get google reference
      vm.$gmapApiPromiseLazy().then((google) => {
        vm.google = google;
        console.log('NotebookMap.mounted() google maps reference');
        console.dir(google.maps);
      });
      // create marker objects from notes
      vm.notes.forEach(function(note) {
        let marker = {
          note: note,
          title: note.name,
          key: note._id,
          date: note.Created_date.toDate(),
          position: {'lat': note.geocode.latitude, 'lng': note.geocode.longitude}
        };
        if (note.place && note.place.name) {
          marker.hasPlace = true;
          marker.place = {
            placeId:note.place._id,
            location: {
              lat:note.geocode.latitude,
              lng:note.geocode.longitude
            }
          };
          vm.placeMarkers.push(marker);
        }
        else {
          vm.noteMarkers.push(marker);
        }
      });
    },

    methods: {
      showNote: function(note) {
        //console.log('NotebookMap.showNote()');
        vm.$emit('select', note);
      },
      toggleInfoWindow: function(marker) {
        //console.log('NotebookMap.toggleInfoWindow()');
        // if it's the same marker toggle it off
        if (vm.infoMarker && vm.infoMarker.note._id === marker.note._id) {
          vm.infoWinOpen = !vm.infoWinOpen;
        } else {
          vm.infoWindowPos = marker.position;
          vm.infoMarker = marker;
          vm.infoWinOpen = true;
        }
      }
    }
  }

</script>

<style scoped>
  .note-info h3 {
    margin-bottom: 0;
  }
  .note-info img {
    vertical-align: middle;
  }
  a svg {
    fill: #42b983;
  }
</style>
