<template>
  <div>

    <header class="note-head">
      <h3 @click="itemSelect">{{note.name}}</h3>
    </header>

    <div class="body">

      <div class="date">{{note.Created_date ? $moment(note.Created_date.toDate()).format('LLLL') : ''}}</div>

      <img
        :src="staticMapUrl"
        class="note-view-map"
        width="250"
        height="150"
        @click="mapSelect"
      >

      <div class="geocoords" v-if="!!note.geocode">
        <a @click="mapSelect" class="geocords-link">
          <svg class="icon-tiny" style="vertical-align: text-bottom;"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
          {{geoLat +', '+geoLon}}
        </a>
      </div>

      <div class="places" v-if="!!note.place && !!note.place.name">
        <img :src="note.place.icon" class="icon-tiny" />
        <span class="placeName">{{note.place.name}}</span>
        <a :href="note.place.url" target="_blank" style="display: inline-block; vertical-align: middle;">
          <svg class="icon-tiny"><use xlink:href="dist/symbols.svg#launch"></use></svg>
        </a>
      </div>

      <p class="note">{{note.note}}</p>

      <p class="photos" v-for="photo in note.photos">
        <span v-if="!!photo.name" class="photo-name">{{photo.name}}</span>
        <img
          :key="photo.id"
          :src="photoUrl(photo, 'medium')"
          @error="onPhotoError(photo, $event)"
          class="note-photo"
          @click="photoSelect(photo)"
        />
        <span v-if="!!photo.caption" class="photo-caption">{{photo.caption}}</span>
      </p>

    </div>

  </div>

</template>

<script>
  import googleConfig from '@/google-maps-config'
  import { mapGetters } from 'vuex'

  export default {

    name: "NoteFullItem",

    props: {
      note: Object
    },

    computed: {

      geoLat() {
        return this.note.geocode ? this.note.geocode.latitude : 0;
      },

      geoLon() {
        return this.note.geocode ? this.note.geocode.longitude : 0;
      },

      notePosition() {
        return this.note.geocode ? {
          lat: this.note.geocode.latitude,
          lng: this.note.geocode.longitude
        } : {lat: 0, lng: 0};
      },

      hasPlace() {
        return (!!this.note.place && !!this.note.place._id);
      },

      staticMapUrl() {
        if (!this.note.geocode) return '';
        let url = 'https://maps.googleapis.com/maps/api/staticmap?size=250x150&scale=2';
        let loc = `${this.note.geocode.latitude},${this.note.geocode.longitude}`;
        url += `&center=${loc}`;
        url += `&markers=${loc}`;
        url += `&key=${googleConfig.key}`;
        return url
      },

      ...mapGetters('photos', ['photoUrl'])

    },

    data() {
      return {
        reloads: {},
        reloadMax: 20
      }
    },

    methods:{

      itemSelect() {
        //console.log(`NoteListItem.itemSelect()`);
        this.$emit('select', this.note);
      },

      photoSelect(photo){
        //console.log(`NoteListItem.photoSelect() note [${this.note._id}] photo [${photo.id}]`);
        const data = {note_id: this.note._id, photo_id: photo.id};
        this.$emit('photoselect', data);
      },

      onPhotoError(photo, evnt) {
        // Sometimes it takes a couple of seconds for a newly uploaded image to respond
        // get/create a counter reference
        let reload;
        if (!this.reloads[photo.id]) {
          console.log(`NoteListItem.onPhotoError() photo id ${photo.id}`);
          reload = this.reloads[photo.id] = {photo: photo, count: 0, src: evnt.target.src};
          evnt.target.style.display = 'none';
          evnt.target.addEventListener('load', this.onPhotoErrorReload, {once:true});
        } else {
          reload = this.reloads[photo.id];
        }
        //console.log(`PhotoScroller.onPhotoError() ${reload.count}`);
        if (reload.count < this.reloadMax) {
          reload.timeout = setTimeout(() => {
            reload.count++;
            console.log(`NoteListItem.onPhotoError() reload [${reload.count}] of photo ${photo.id}`);
            let reloadUrl = `${reload.src}?reload=${reload.count}`;
            //console.log(`PhotoScroller.onPhotoError() reload ${reloadUrl}`);
            evnt.target.src = reloadUrl;
          }, 1000)
        } else {
          //console.log(`PhotoScroller.onPhotoError() Give up reloading ${reload.photo.id}`);
          reload.timeout = null;
          this.$emit('missingphoto', photo);
        }
      },

      onPhotoErrorReload(evnt) {
        //console.log(`PhotoScroller.onPhotoErrorReload()`);
        evnt.target.style.display = 'block';
      },

      mapSelect() {
        //console.log(`NoteListItem.mapSelect()`);
        this.$emit('mapselect', this.note);
      }
    }

  }
</script>

<style lang="scss" scoped>

  .body {
    padding: 0 20px 10px;
    overflow-x: hidden;
  }

  .body > div {
    margin: 10px 0;
  }

  header.note-head {
    background-color: #666;
    padding: 0 10px;
    position: relative;
    width: 100%;
    top: 0;
    left: 0;
    h3 {
      padding: 0;
      margin: 0;
      line-height: 40px;
      color: white;
      font-weight: normal;
      cursor: pointer;
    }
  }

  .note-view-map {
    display: inline-block;
    float: right;
    margin: 10px 0;
    cursor: pointer;
  }

  .date, .geocoords, .places {
    float: left;
    clear: left;
  }

  .places img {
    vertical-align: middle;
  }

  .places .placeName {
    display: inline-block;
    vertical-align: middle;
    max-width: 520px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .note {
    border: 1px solid transparent;
    white-space: pre-wrap;
    clear: both;
  }

  .note-photo {
    display: block;
    margin: 0 auto;
  }

  .photo-name {
    color:#666;
    width: 100%;
    display: inline-block;
    text-align: center;
  }

  .photo-caption {
    width: 100%;
    display: inline-block;
    margin-top: 8px;
    padding: 0 40px;
  }

</style>
